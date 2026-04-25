# Epics — planb

Capabilities mayores del producto. Cada epic agrupa un conjunto de user stories que aportan valor al usuario y comparten contexto de implementación.

Granularidad: una epic es una unidad que un equipo podría asumir como "trabajo de varios sprints" si tuviéramos sprints. Para nuestro proyecto solo-dev, una epic suele cruzar 1-3 fases del cronograma (`STATUS.md`).

| ID | Epic | UCs incluidos | Phase target |
|---|---|---|---|
| EPIC-01 | Catálogo público y exploración | UC-001 a UC-004 | 3 |
| EPIC-02 | Identidad y autenticación | UC-010, UC-011, UC-012, UC-068, + UCs nuevos onboarding | 2 |
| EPIC-03 | Historial académico | UC-013, UC-014, UC-015 | 3 |
| EPIC-04 | Planificación de cuatrimestre (simulador + saved + shared) | UC-016 + UCs nuevos Planning | 4 |
| EPIC-05 | Sistema de reseñas | UC-017, UC-018, UC-019, UC-020 | 4 |
| EPIC-06 | Claim e identidad docente | UC-030, UC-031, UC-032, UC-040, UC-041, UC-066 | 5 |
| EPIC-07 | Moderación | UC-050, UC-051, UC-052, UC-053 | 4 |
| EPIC-08 | Backoffice de catálogo | UC-060 a UC-065 | 3 |
| EPIC-09 | Backoffice de cuentas staff | UC-067, UC-068 | 5 |
| EPIC-10 | Dashboard institucional | UC-080 | 5 |

---

## EPIC-01: Catálogo público y exploración

**Capacidad**: Visitor anónimo puede explorar el catálogo (universidades, carreras, planes, materias, docentes), ver reseñas agregadas, y buscar por texto libre. Es el funnel de entrada al producto — antes de registrarse, el visitor evalúa la plataforma navegando.

**UCs**:

- UC-001 Explorar catálogo de universidades y carreras.
- UC-002 Ver página de una materia con reseñas.
- UC-003 Ver página de un docente con reseñas.
- UC-004 Buscar materia o docente por texto libre.

**BCs involucrados**: Academic (lecturas), Reviews (lecturas anonimizadas).

**Decisiones que la condicionan**: [ADR-0001](../decisions/0001-multi-universidad-desde-dia-1.md) (multi-universidad), [ADR-0009](../decisions/0009-anonimato-como-regla-de-presentacion.md) (anonimato).

**Phase target**: 3 (precarga + frontend base). Es lo primero que el público ve.

---

## EPIC-02: Identidad y autenticación

**Capacidad**: registrarse, verificar email, loguearse, gestionar la cuenta básica. Es el muro entre Visitor y Member.

**UCs**:

- UC-010 Registrarse.
- UC-011 Verificar email.
- UC-012 Crear StudentProfile eligiendo CareerPlan.
- UC-068 Deshabilitar cuenta member (incluido aquí porque opera sobre la User aggregate).
- **UC-NEW-01** Reenviar verification email.
- **UC-NEW-02** Expirar registro no verificado (system action automático).

**BCs involucrados**: Identity primario.

**Decisiones que la condicionan**: [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md), [ADR-0023](../decisions/0023-auth-flow-jwt-cookie-layout-guards.md), ADR-0033 (VerificationToken como child).

**Phase target**: 2 (en progreso — slices A+B done, slices C/D/E pendientes).

---

## EPIC-03: Historial académico

**Capacidad**: el alumno carga y mantiene su historial — qué cursó, cuándo, con qué resultado. Habilita el simulador (que computa "available" / "blocked" desde el historial) y las reseñas (que se anclan a entradas del historial).

**UCs**:

- UC-013 Cargar historial manualmente.
- UC-014 Importar historial desde PDF/texto.
- UC-015 Editar una entrada del historial.

**BCs involucrados**: Enrollments primario, Academic (lectura para validación), Identity (lectura para owner check).

**Decisiones que la condicionan**: [ADR-0004](../decisions/0004-enrollment-guarda-hechos.md), [ADR-0006](../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md), ADR-0032 (edit invalida Review).

**Phase target**: 3.

---

## EPIC-04: Planificación de cuatrimestre

**Capacidad**: simular combinaciones de materias para el próximo cuatrimestre, guardarlas como drafts privados, compartirlas al corpus público para que otros aprendan. Es **la herramienta core del producto** — el "review-driven semester planning" hecho concreto.

**UCs**:

- UC-016 Simular inscripción.
- **UC-NEW-03** Guardar simulación como draft privado.
- **UC-NEW-04** Compartir simulación al corpus público.
- **UC-NEW-05** Editar simulación.
- **UC-NEW-06** Borrar simulación.
- **UC-NEW-07** Ver simulaciones públicas de otros alumnos.
- **UC-NEW-08** (post-MVP) Recibir simulación recomendada.

**BCs involucrados**: Planning primario, Academic (lectura), Enrollments (lectura), Reviews (lectura para enriquecer presentación).

**Decisiones que la condicionan**: ADR-0028 (no gating del simulador, premium features como reward), ADR-0029 (Planning como BC propio), [ADR-0003](../decisions/0003-correlativas-con-dos-tipos.md) (correlativas).

**Phase target**: 4.

---

## EPIC-05: Sistema de reseñas

**Capacidad**: alumno publica su experiencia de cursada, otros leen, autor edita, terceros reportan si hay abuso, autor ve estado de reports. Es el motor de contenido de la plataforma.

**UCs**:

- UC-017 Publicar reseña de cursada.
- UC-018 Editar reseña propia.
- UC-019 Reportar una reseña.
- UC-020 Ver el estado de sus reports.

**BCs involucrados**: Reviews primario, Moderation (para reports), Identity (lectura para anonimización), Enrollments (lectura para ancla).

**Decisiones que la condicionan**: [ADR-0005](../decisions/0005-resena-anclada-al-enrollment.md), [ADR-0007](../decisions/0007-pgvector-implementado-ui-gated-off.md), [ADR-0009](../decisions/0009-anonimato-como-regla-de-presentacion.md), [ADR-0011](../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md), [ADR-0012](../decisions/0012-edicion-de-resena-solo-desde-published.md), [ADR-0013](../decisions/0013-embedding-gated-en-transiciones-a-published.md), ADR-0028 (reseñas opcionales).

**Phase target**: 4.

---

## EPIC-06: Claim e identidad docente

**Capacidad**: un member que también es docente puede reclamar su identidad docente, verificarla (vía email institucional o evidencia manual), y entonces responder reseñas sobre sí mismo.

**UCs**:

- UC-030 Iniciar claim de TeacherProfile.
- UC-031 Verificar por email institucional.
- UC-032 Solicitar verificación manual.
- UC-040 Responder reseña sobre sí mismo.
- UC-041 Editar respuesta propia.
- UC-066 Verificar TeacherProfile manualmente (admin lado).

**BCs involucrados**: Identity primario, Reviews (TeacherResponse), Academic (Teacher entity).

**Decisiones que la condicionan**: [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).

**Phase target**: 5.

---

## EPIC-07: Moderación

**Capacidad**: moderadores ven cola de reseñas pendientes, resuelven reports (upheld / dismissed), restauran reseñas removidas, consultan audit log de cualquier reseña.

**UCs**:

- UC-050 Ver cola de reseñas under_review.
- UC-051 Resolver un report.
- UC-052 Restaurar reseña removida.
- UC-053 Ver audit log de una reseña.

**BCs involucrados**: Moderation primario, Reviews (operaciones cross-BC vía events).

**Decisiones que la condicionan**: [ADR-0010](../decisions/0010-threshold-auto-hide-configurable-por-env-var.md), [ADR-0011](../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md), ADR-0030 (cross-BC consistency), ADR-0031 (audit log como projection).

**Phase target**: 4 (porque va junto con el sistema de reseñas — sin moderación, las reseñas son un riesgo).

---

## EPIC-08: Backoffice de catálogo

**Capacidad**: admin precarga y mantiene el catálogo académico — universities, careers, plans, subjects, prerequisites, teachers, terms, commissions.

**UCs**:

- UC-060 Gestionar University.
- UC-061 Gestionar Career + CareerPlan.
- UC-062 Gestionar Subject + Prerequisite.
- UC-063 Gestionar Teacher.
- UC-064 Gestionar AcademicTerm.
- UC-065 Gestionar Commission + CommissionTeacher.

**BCs involucrados**: Academic primario.

**Decisiones que la condicionan**: [ADR-0001](../decisions/0001-multi-universidad-desde-dia-1.md), [ADR-0002](../decisions/0002-versionado-de-planes-de-estudio.md), [ADR-0003](../decisions/0003-correlativas-con-dos-tipos.md).

**Phase target**: 3 (sin catálogo cargado, no hay UC-001 ni nada).

---

## EPIC-09: Backoffice de cuentas staff

**Capacidad**: admin crea moderadores / otros admins / staff universitario. No hay auto-registro para estos roles (ADR-0008).

**UCs**:

- UC-067 Crear/deshabilitar cuentas staff.
- UC-068 Deshabilitar cuenta member (compartido con EPIC-02).

**BCs involucrados**: Identity primario.

**Decisiones que la condicionan**: [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).

**Phase target**: 5 — antes del lanzamiento público necesitamos moderadores reales, no solo el dev.

---

## EPIC-10: Dashboard institucional

**Capacidad**: university staff ve panel agregado de su universidad — reseñas por materia/docente, tasas de abandono, combinaciones que más fallan. Solo agregados anónimos, sin acceso a reseñas individuales.

**UCs**:

- UC-080 Ver dashboard institucional.

**BCs involucrados**: principalmente queries sobre Reviews + Enrollments, scoped por University del staff.

**Decisiones que la condicionan**: [ADR-0009](../decisions/0009-anonimato-como-regla-de-presentacion.md).

**Phase target**: 5 — es el value prop para que las universidades acepten ser parte del producto a futuro.

---

## Relación con cronograma de fases

| Phase | Epics target |
|---|---|
| 1 — Diseño y modelado | (no epics, fundación documental) |
| 2 — Backend y autenticación | EPIC-02 (en progreso) |
| 3 — Precarga + frontend base | EPIC-01, EPIC-03, EPIC-08 |
| 4 — Simulador + reseñas | EPIC-04, EPIC-05, EPIC-07 |
| 5 — Dashboard + verif docente | EPIC-06, EPIC-09, EPIC-10 |
| 6 — Focus group | (todas operativas, ajustes basados en feedback) |
| 7 — Lanzamiento público | (production hardening, no epics nuevas) |

Una epic puede tocar múltiples fases (ej. EPIC-02 arranca en Fase 2 pero UC-068 técnicamente cae en Fase 5). El "phase target" indica cuándo la epic queda **funcional al usuario**, no cuándo todos sus UCs cierran.

---

## Cómo se trackean

- En este doc: descripción capability + UCs incluidos + decisiones + phase target.
- En Notion: una entry por epic en la database `plan-b — Epics`. User Stories vinculadas via relation. Status (Not Started / In Progress / Done) reflejando el agregado de las US.
- En código: indirectamente, vía PRs que referencian US-NNN o UC-NNN. La epic NO aparece en commits — solo es organización de planning.
