# Aggregates — planb

Inventario tactical DDD del modelo. Sigue la convención **Vernon/Khorikov** en el código: todo lo que se persiste/carga independientemente lleva el marker `IAggregateRoot`. La distinción entre "aggregate root con complejidad interna" vs "entity standalone" se mantiene **solo en este doc**, como referencia de estudio.

Para los criterios de decisión que llevaron a clasificar cada cosa donde está, ver el final del doc ("Criterios de clasificación") y los hot spots en [`../eventstorming.md`](../eventstorming.md).

---

## Criterios de clasificación

Todo objeto del modelo cae en uno de estos cuatro buckets:

### 1. Aggregate root con complejidad interna (rich aggregate)

- Tiene **identidad** (`Entity<TId>`).
- Tiene **repositorio propio**.
- Se persiste/carga independientemente.
- **Tiene children** (entities o value objects internos).
- Protege **invariantes que abarcan múltiples objetos** dentro del aggregate.

→ En código: `IAggregateRoot` marker + colección de children + métodos del root que manipulan a los children.

### 2. Entity standalone (single-entity aggregate)

- Tiene **identidad**.
- Tiene **repositorio propio**.
- Se persiste/carga independientemente.
- **NO tiene children**.
- Protege **invariantes intra-entity** (sobre sus propias columnas).

→ En código: `IAggregateRoot` marker (por convención Vernon/Khorikov), pero sin children. Es funcionalmente un aggregate de tamaño 1.

### 3. Child entity

- Tiene **identidad** (para distinguirla de hermanas).
- **NO tiene repositorio propio**.
- Vive **dentro de un aggregate root**.
- Su lifecycle está mediado por el aggregate root.

→ En código: `Entity<TId>` SIN `IAggregateRoot`. Acceso vía la collection del aggregate.

### 4. Projection / read model

- **NO tiene identidad de dominio** (es derivada).
- Generada por listeners de events.
- Optimizada para consulta.

→ En código: típicamente una clase POCO + tabla SQL alimentada por handler.

---

## Bounded Context: Identity

### `User` — aggregate root (rich)

**Tipo**: aggregate root con complejidad interna.

**Children**: `VerificationToken` (collection).

**Invariantes que protege**:

- `Email` único entre users non-expired (índice único parcial `WHERE expired_at IS NULL`).
- `PasswordHash` no vacío.
- State machine `email_verified_at`: NULL → set time once → no re-asignar.
- State machine `disabled_at` / `expired_at`: terminal states.
- **Como mucho un VerificationToken activo por purpose** — invariante interno que requiere visibilidad de la collection. Cuando se emite un token nuevo, los anteriores activos del mismo purpose se invalidan en la misma operación.
- `MarkEmailVerifiedFor(rawValue)` busca el token, lo consume, y marca al user verified — todo atómico.

**Métodos del root**:

- `User.Register(email, passwordHash, clock)` — factory, role=member, email_verified_at=null.
- `User.CreateStaff(email, passwordHash, role, clock)` — factory, role IN (moderator, admin, university_staff), email_verified_at=now (auto-verified, ver HOT 14).
- `IssueVerificationToken(rawValue, purpose, ttl, clock)` — invalida activos del mismo purpose y agrega uno nuevo.
- `MarkEmailVerifiedFor(rawValue, clock)` — busca el token UserEmailVerification, valida, consume, marca user verified.
- `Disable(byId, reason, clock)`, `Restore(clock)` — state machine de account suspension.
- `ExpireUnverifiedRegistration(clock)` — terminal state, libera el email vía `expired_at`.

**Domain events que emite** (catálogo en [`domain-events.md`](domain-events.md)):

`UserRegistered`, `StaffUserCreated`, `UserEmailVerified`, `UserDisabled`, `UserRestored`, `UnverifiedRegistrationExpired`, `VerificationTokenIssued`, `VerificationTokenConsumed`, `VerificationTokenInvalidated`.

### `VerificationToken` — child entity de User (y de TeacherProfile)

**Tipo**: child entity.

**Vive dentro de**: User para `purpose=UserEmailVerification`. TeacherProfile para `purpose=TeacherInstitutionalVerification`. Mismo type de entity, parametrizada por `purpose`.

**Invariantes intra-entity**:

- `Value` no vacío.
- `Purpose` válido.
- TTL > 0.
- State machine: `issued → consumed | invalidated | expired`. No vuelve atrás.
- No se puede consumir si `consumed_at`, `invalidated_at` o `expires_at < now`.

Detalle en ADR-0033.

### `StudentProfile` — entity standalone

**Tipo**: single-entity aggregate (sin children).

**Invariantes**:

- `UserId` referencia un User (validado en app service, no FK).
- `(UserId, CareerPlanId)` UNIQUE entre profiles activos.
- `EnrollmentYear` ∈ [1950, año actual].
- State machine `Status`: active / graduated / abandoned. Reglas:
  - `Status='graduated'` requiere `GraduatedAt NOT NULL`.
  - `Status IN ('active', 'abandoned')` requiere `GraduatedAt IS NULL`.

**Cross-aggregate validation**: `User` debe estar verificado al momento de crear (`User.IsVerified`). El app service consulta `IIdentityQueryService.IsVerified(userId)` antes de instanciar.

### `TeacherProfile` — entity standalone

**Tipo**: single-entity aggregate. (Tendrá children VerificationToken cuando se implemente el flow de institutional email — en ese momento pasa a aggregate rich. Por ahora sin children porque slice no implementado.)

**Invariantes**:

- `(UserId, TeacherId)` UNIQUE.
- `(TeacherId)` UNIQUE entre profiles con `verified_at NOT NULL` — un Teacher tiene un solo TeacherProfile verificado.
- `verification_method='institutional_email'` requiere `institutional_email NOT NULL` y dominio en `Teacher.University.institutional_email_domains`.
- `verification_method='manual'` requiere `verified_by NOT NULL` apuntando a un User con `role='admin'`.

---

## Bounded Context: Academic

### `University` — entity standalone

**Tipo**: single-entity aggregate.

**Invariantes**:

- `slug` UNIQUE.
- `Name`, `ShortName`, `Country`, `City` NOT NULL.
- `InstitutionalEmailDomains` array de strings normalizados (lowercase, sin protocolo).

### `Career` — entity standalone

**Invariantes**: `(UniversityId, Code)` UNIQUE cuando code es non-null.

### `CareerPlan` — entity standalone

**Invariantes**:

- `(CareerId, VersionLabel)` UNIQUE.
- `EffectiveTo IS NULL OR EffectiveTo >= EffectiveFrom`.
- "Solo un plan vigente por Career" — invariante cross-aggregate enforced en app service (al crear nuevo, el anterior se retira automáticamente).

### `Subject` — aggregate root (rich)

**Tipo**: aggregate root con complejidad interna.

**Children**: `Prerequisite` (collection).

**Invariantes**:

- `(CareerPlanId, Code)` UNIQUE.
- `Hours > 0`, `Year >= 1`, `TermNumber >= 1`.
- **Sub-grafo de prerequisites no tiene ciclos consigo misma** — invariante intra-aggregate.
- **Aciclicidad GLOBAL del grafo de prerequisites del CareerPlan** — invariante cross-aggregate; la valida el domain service `IPrerequisiteGraphValidator` (HOT 12).

**Métodos del root**:

- `Subject.AddPrerequisite(requiredSubjectId, type)` — solo invariante intra (no apunta a sí misma); el cross-aggregate (ciclo en el grafo del plan) lo chequea el app service vía domain service antes de invocar este método.
- `Subject.RemovePrerequisite(requiredSubjectId, type)`.

### `Prerequisite` — child entity de Subject

**Tipo**: child entity.

**Invariantes**:

- `RequiredSubjectId != Subject.Id`.
- `Type` ∈ {para_cursar, para_rendir} (ver [ADR-0003](../../decisions/0003-correlativas-con-dos-tipos.md)).

### `Teacher` — entity standalone

**Invariantes**:

- `Title` lowercase en DB (presentation layer aplica title case).
- `UniversityId` referencia válida.
- `IsActive` toggle (no se borra; se desactiva).

### `AcademicTerm` — entity standalone

**Invariantes**:

- `(UniversityId, Year, Number, Kind)` UNIQUE.
- `Label` se computa al insertar (`"<year><kind><number>"`).
- `EnrollmentClosesAt > EnrollmentOpensAt`, `EndDate > StartDate`.

### `Commission` — aggregate root (rich)

**Tipo**: aggregate root con complejidad interna.

**Children**: `CommissionTeacher` (collection).

**Invariantes**:

- `(SubjectId, AcademicTermId, Name)` UNIQUE.
- `Subject.University == AcademicTerm.University` (cross-aggregate, validado en app service).
- `Capacity > 0` (cuando aplica).
- **Como mucho un teacher con `role='titular'` por commission** — invariante interno.
- **No se asigna el mismo teacher dos veces a la misma commission** — invariante interno.

**Métodos del root**:

- `Commission.AssignTeacher(teacherId, role)`.
- `Commission.UnassignTeacher(teacherId)`.

### `CommissionTeacher` — child entity de Commission

**Invariantes**:

- `Role` ∈ {titular, adjunto, jtp, ayudante, invitado}.

---

## Bounded Context: Enrollments

### `HistorialImport` — entity standalone

**Invariantes**:

- State machine `Status`: pending → processing → completed | failed. No vuelve atrás.
- `Status='completed'` requiere `Results NOT NULL` con al menos un row procesado.
- `Status='failed'` requiere `Error NOT NULL`.
- `RawPayload` no vacío al crear.
- `SourceType` ∈ {pdf, text}.

### `EnrollmentRecord` — entity standalone

**Invariantes**:

- `(StudentProfileId, SubjectId, AcademicTermId)` UNIQUE.
- `Status` ∈ {cursando, aprobada, desaprobada, abandonada, equivalencia}.
- `Status='aprobada'` ⇒ `Grade NOT NULL`, `ApprovalMethod NOT NULL`.
- `Status='cursando'` ⇒ `Grade IS NULL`, `ApprovalMethod IS NULL`.
- `Grade ∈ [0, 10]` cuando aplica.
- `ApprovalMethod` ∈ {parcial, final, promocion, equivalencia}.

**Cross-aggregate invariante**: `SubjectId` ∈ subjects del `CareerPlan` del `StudentProfile`. Validado en app service vía `IAcademicQueryService.IsSubjectInPlan`.

**Comportamiento crítico**: edit destructive (cambio a `cursando` cuando había Review existente) emite event `EnrollmentRecordEdited` que Reviews observa para invalidar reseñas (ADR-0032).

---

## Bounded Context: Reviews

### `Review` — aggregate root (rich)

**Tipo**: aggregate root con complejidad interna.

**Children**: `TeacherResponse` (al menos 0 o 1 — UNIQUE por review).

**Invariantes**:

- `EnrollmentRecordId` UNIQUE — una review por enrollment.
- Al menos uno de `SubjectText`, `TeacherText` no vacío.
- `Difficulty ∈ [1, 5]`.
- `DocenteResenadoId` ∈ teachers de la commission del enrollment (cross-aggregate, validado en app service).
- State machine `Status`: published / under_review / removed.
- Edit solo desde `published` ([ADR-0012](../../decisions/0012-edicion-de-resena-solo-desde-published.md)).
- **Una sola TeacherResponse por review** — invariante interno (UNIQUE constraint + lógica del aggregate).
- TeacherResponse author = TeacherProfile verificado donde teacher_id = `DocenteResenadoId`.

**Métodos del root**:

- `Review.Publish(verdict)` — recibe el verdict del filter; si clean → published; si triggered → under_review.
- `Review.Edit(changes)` — re-corre filter, marca "editada después de respuesta" si aplica.
- `Review.Quarantine(reason)` — pasa a under_review.
- `Review.Remove()`, `Review.Restore()` — terminal y reverso (ADR-0011).
- `Review.Invalidate(reason)` — pasa a under_review por cross-BC trigger.
- `Review.PostTeacherResponse(authorTeacherProfileId, text, clock)` — agrega la response, valida author.
- `Review.EditTeacherResponse(authorTeacherProfileId, newText, clock)` — solo el author original.

### `TeacherResponse` — child entity de Review

**Invariantes**:

- `AuthorTeacherProfileId` matchea `Review.DocenteResenadoId.TeacherId` y está verificado.
- `Text` no vacío.

### `ReviewEmbedding` — projection

**Tipo**: projection / read model.

**Generación**: handler async escucha `ReviewPublished` y `ReviewEdited`, computa el embedding via modelo `intfloat/multilingual-e5-base` y persiste. Ver [ADR-0007](../../decisions/0007-pgvector-implementado-ui-gated-off.md), [ADR-0013](../../decisions/0013-embedding-gated-en-transiciones-a-published.md).

**No es aggregate** — no tiene comportamiento de dominio, no se modifica desde el modelo. Read-only consumido por features futuras (clustering, semantic search).

---

## Bounded Context: Moderation

### `ReviewReport` — entity standalone

**Invariantes**:

- `(ReviewId, ReporterId)` UNIQUE — un user solo puede reportar una vez la misma review.
- `ReporterId != Review.AuthorId` — el autor no puede reportarse a sí mismo (validado en app service).
- State machine `Status`: open → upheld | dismissed. Terminal.
- `Status='upheld'` requiere `ResolutionNote NOT NULL`, `ModeratorId NOT NULL`, `ResolvedAt NOT NULL`.

### `ReviewAuditLog` — projection

**Tipo**: projection append-only.

**Generación**: handler escucha events de Review/ReviewReport/TeacherResponse y escribe rows en `review_audit_log` con `(at, review_id, action, actor_id, before?, after?)`. Ver ADR-0031.

**No es aggregate** — append-only, sin lifecycle, sin invariantes sobre múltiples rows.

---

## Bounded Context: Planning

### `SimulationDraft` — entity standalone

**Invariantes**:

- `OwnerProfileId` referencia un StudentProfile activo (validado en app service).
- `Materias` (collection de `SubjectId`) son del `CareerPlan` del owner (validado en app service).
- `TermId` corresponde a un AcademicTerm futuro o vigente.
- State machine: `private → shared → private` (toggle vía `Share`/`Unshare`).

**Comportamiento**:

- `SimulationDraft.Save(profileId, subjects, termId)` — factory, privado.
- `SimulationDraft.Update(subjects)`.
- `SimulationDraft.Share()`, `SimulationDraft.Unshare()`.
- `SimulationDraft.Delete()` — hard delete (no audit value en simulations privadas).

---

## Tabla resumen

| Type | Conteo | Items |
|---|---|---|
| Aggregate roots con complejidad interna | 4 | User, Subject, Commission, Review |
| Entities standalone | 11 | StudentProfile, TeacherProfile, University, Career, CareerPlan, Teacher, AcademicTerm, HistorialImport, EnrollmentRecord, ReviewReport, SimulationDraft |
| Child entities | 4 | VerificationToken, Prerequisite, CommissionTeacher, TeacherResponse |
| Projections | 2 | ReviewEmbedding, ReviewAuditLog |

**15 entries con `IAggregateRoot` marker en código** (4 + 11). Los child entities y projections NO llevan el marker.

---

## Notas operativas

**¿Por qué Vernon/Khorikov en vez de "marker solo para los rich"?**

La convención de tener `IAggregateRoot` para todo lo independiente da:
- Un solo concepto de "thing with own repository" en código.
- Repository constraint genérico: `IRepository<T> where T : IAggregateRoot`.
- Menos clases marker (no necesitamos `IRootEntity` separado).

El costo es perder en código la distinción que sí hacemos en docs. Aceptable porque los hot spots y razonamiento del modelo se consultan en este doc, no se inferencia desde el código.

**¿Y si una entity standalone gana un child en futuro?**

TeacherProfile es candidato cuando agreguemos VerificationToken para institutional email verification (slice futuro). En ese momento:
- En código: nada cambia (ya tiene `IAggregateRoot`).
- En este doc: muevo TeacherProfile de "standalone" a "rich aggregate" y agrego la sub-sección.

Eso es exactamente la utilidad de mantener este doc: refleja el estado actual del modelo y se actualiza cuando el modelo crece.
