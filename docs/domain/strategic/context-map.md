# Context Map — planb

Mapa de relaciones entre los 6 Bounded Contexts. Para cada par definimos el **patrón de integración** (en términos de Evans/Vernon) y el **mecanismo técnico** (synchronous reads, integration events, etc.).

Los BCs viven todos en el mismo modular monolith ([ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md)) pero las reglas de acoplamiento son las mismas que si fueran microservicios:

- **No se referencian aggregates de otros BCs por navegación EF Core**. Se usan IDs opacos.
- **No se hacen FKs cross-schema** ([ADR-0017](../../decisions/0017-persistence-ignorance.md)).
- **Reads cross-BC** pasan por interfaces explícitas (`<BC>QueryService` en `Application/Contracts/`).
- **Writes cross-BC** pasan por integration events vía Wolverine outbox (ADR-0030).

---

## Diagrama overview

```
                  ┌─────────────┐
                  │  Identity   │  ◄────── upstream (foundational)
                  │             │
                  └──────┬──────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  ┌──────────┐    ┌─────────────┐   ┌──────────┐
  │ Academic │    │ Enrollments │   │ Planning │
  │          │    │             │   │          │
  └────┬─────┘    └──────┬──────┘   └────┬─────┘
       │                 │               │
       │                 ▼               │
       │          ┌─────────────┐        │
       └─────────►│   Reviews   │◄───────┘
                  │             │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Moderation  │
                  │             │
                  └─────────────┘
```

---

## Relaciones por par de BCs

### Identity → Enrollments

**Patrón**: Customer/Supplier — Identity es upstream (publishes), Enrollments es downstream (consumes).

**Por qué Customer/Supplier y no Conformist**: el equipo es el mismo, hay control sobre ambos, y Enrollments tiene voz para pedir cambios al contract de Identity (ej. agregar `IsVerified(userId)` al query service).

**Mecanismo**:

- **Reads sync**: `IIdentityQueryService.GetActiveProfileFor(userId, careerPlanId)` para validar antes de crear `EnrollmentRecord`.
- **Eventos integration**: Identity emite `UserDisabled` → Enrollments (en futuro) puede reaccionar para soft-marcar registros del user disabled.
- **Aggregates ID-only**: Enrollments tiene `studentProfileId` como columna opaca, no FK al schema `identity`.

### Identity → Reviews

**Patrón**: Customer/Supplier.

**Mecanismo**:

- **Reads sync**: `IIdentityQueryService.IsTeacherProfileVerifiedForTeacher(userId, teacherId)` para validar que un docente puede responder una review.
- **Eventos integration**: `UserDisabled` → Reviews soft-flag las reviews del user para presentación. `TeacherProfileVerified` → habilita capability `review:respond`.

### Identity → Planning

**Patrón**: Customer/Supplier.

**Mecanismo**:

- **Reads sync**: `IIdentityQueryService.GetStudentProfile(userId, careerPlanId)` para identificar al owner del SimulationDraft.
- Sin events relevantes en MVP.

### Academic → Enrollments

**Patrón**: Customer/Supplier.

**Mecanismo**:

- **Reads sync**: `IAcademicQueryService.IsSubjectInPlan(subjectId, careerPlanId)` para validar invariante al crear `EnrollmentRecord`.
- **Reads sync**: `IAcademicQueryService.GetCommissionTeachers(commissionId)` (técnicamente lo consume Reviews al validar `docente_reseñado_id`, pero también Enrollments al cargar histórica con info del docente).
- Sin events cross-BC en MVP. Catálogo es estable; cambios infrecuentes y manejados por admin.

### Academic → Reviews

**Patrón**: Customer/Supplier.

**Mecanismo**:

- **Reads sync**: `IAcademicQueryService.GetCommissionTeachers(commissionId)` para validar `docente_reseñado_id` ∈ teachers de la commission del enrollment.
- **Reads sync**: `IAcademicQueryService.GetSubjectMetadata(subjectId)` para enriquecer la presentación pública de reviews con nombre/código de materia.

### Academic → Planning

**Patrón**: Customer/Supplier.

**Mecanismo**:

- **Reads sync**: `IAcademicQueryService.GetSubjectsInPlan(careerPlanId)`, `GetPrerequisitesFor(subjectId)`, `GetTermsForUniversity(universityId)` — todo lo que necesita el simulador para presentar opciones.
- Sin writes cross-BC.

### Enrollments → Reviews

**Patrón**: Customer/Supplier con **integration events** (cross-BC eventual consistency).

**Por qué integration events y no solo reads**: porque hay write cross-BC. Un edit destructive en EnrollmentRecord debe invalidar la Review correspondiente. Esto se modeló como Reviews **observa** events de Enrollments.

**Mecanismo**:

- **Reads sync**: `IEnrollmentQueryService.GetEnrollmentRecord(recordId)` para que Reviews pueda mostrar contexto (qué materia, qué cuatrimestre).
- **Integration events**: Enrollments emite `EnrollmentRecordEdited(recordId, changes)` → Reviews tiene policy que reacciona: si el cambio hace inválida la review (ej. status pasa a `cursando`), dispara `InvalidateReview(reviewId)`. Ver ADR-0032.

### Enrollments → Planning

**Patrón**: Customer/Supplier.

**Mecanismo**:

- **Reads sync**: `IEnrollmentQueryService.GetTakenSubjects(profileId)` para que el simulador compute "available" / "blocked".

### Reviews → Moderation

**Patrón**: Customer/Supplier con integration events bidireccionales.

**Mecanismo**:

- **Reads sync**: `IReviewQueryService.GetReview(reviewId)` para que Moderator UI muestre el contenido al resolver un report. `IReviewQueryService.GetReviewsForReports(reviewIds[])` para la cola.
- **Integration events**:
  - Reviews emite `ReviewPublished`, `ReviewQuarantined`, `ReviewEdited`, `ReviewRemoved`, `ReviewRestored` — Moderation observa y persiste en `ReviewAuditLog` projection.
  - Moderation emite `ReportUpheld` → Reviews reacciona disparando `RemoveReview(reviewId)`.
- Sin reads de Moderation desde Reviews (Reviews no necesita saber sobre reports en su lógica core; los reports son responsabilidad de Moderation).

### Planning → Reviews

**Patrón**: Customer/Supplier (read-only).

**Mecanismo**:

- **Reads sync**: el simulador muestra el rating promedio + cantidad de reseñas para cada subject candidato. `IReviewQueryService.GetAggregatesForSubject(subjectId, ?teacherId?)`.
- Sin writes ni events.

---

## Integration events globalmente

Todos los integration events viajan por **Wolverine outbox** persistido en Postgres ([ADR-0015](../../decisions/0015-wolverine-como-mediator-y-message-bus.md), ADR-0030). Esto da:

- **Atomicidad write+publish**: el aggregate se guarda y el event entra al outbox en la misma transacción EF Core.
- **At-least-once delivery**: el dispatcher de Wolverine reintenta hasta confirmar consumo.
- **Eventual consistency cross-BC**: handlers downstream se ejecutan asincrónicamente.

**Catálogo de integration events relevantes** (los que cruzan BCs):

| Event | Origen | Consumers |
|---|---|---|
| `UserDisabled` | Identity | Reviews (soft-flag), Moderation (audit) |
| `TeacherProfileVerified` | Identity | Reviews (capability) |
| `EnrollmentRecordEdited` | Enrollments | Reviews (policy de invalidation) |
| `ReviewPublished` | Reviews | Moderation (audit) |
| `ReviewQuarantined` | Reviews | Moderation (cola), Audit |
| `ReviewEdited` | Reviews | Moderation (audit + rerun filter trigger) |
| `ReviewRemoved` | Reviews | Moderation (audit) |
| `ReviewRestored` | Reviews | Moderation (audit) |
| `ReportUpheld` | Moderation | Reviews (disparar RemoveReview) |
| `TeacherResponsePublished` | Reviews | Moderation (audit) |
| `TeacherResponseEdited` | Reviews | Moderation (audit) |

Domain events (intra-BC) NO cruzan boundaries — quedan dentro del BC y se manejan en transacción local. La distinción event-domain vs event-integration está documentada en `tactical/domain-events.md`.

---

## Shared Kernel

`backend/libs/shared-kernel/Planb.SharedKernel/` provee primitivas reusables:

- `Entity<TId>`, `IAggregateRoot` (markers).
- `IDomainEvent`, `IDomainEventSource`, `IDomainEventPublisher`, `DomainEventDispatcher`.
- `Result`, `Result<T>`, `Error`, `ErrorType`.
- `IDateTimeProvider`, `SystemDateTimeProvider`.

**Regla**: shared-kernel NO contiene lógica de dominio — solo abstracciones que todos los BCs usan. Si una abstracción es específica de un BC, vive en ese BC.

---

## Anti-Corruption Layer (no aplica en MVP)

Si en futuro integramos con sistemas universitarios externos (ej. SIU Guarani para sync de inscripciones reales), un ACL viviría entre Academic/Enrollments y el sistema externo. Su rol: traducir el modelo externo a nuestro modelo de dominio sin contaminar nuestros BCs con conceptos foreign.

En MVP no hay integraciones externas → no hay ACL todavía.

---

## Cuándo revisitar el context map

- Si aparece un nuevo BC: agregar sección con sus relaciones.
- Si una relación cambia de patrón (ej. Customer/Supplier pasa a Conformist porque dejamos de tener voz sobre el upstream): documentar el cambio.
- Si los integration events crecen mucho en uno de los BCs, considerar partir el BC.
- Si dos BCs comparten demasiada lógica vía Shared Kernel, evaluar si en realidad son uno solo.
