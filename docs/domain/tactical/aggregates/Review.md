# Review (Reviews)

**Tipo**: rich
**BC**: Reviews
**Root ID**: `ReviewId`
**Child entities**: `TeacherResponse` (0 o 1, UNIQUE por review)

> Nota sobre `ReviewEmbedding`: es projection / read model, no child entity. Vive en Reviews BC pero no es parte del aggregate. Ver [projections/](../projections/) y [ADR-0007](../../../decisions/0007-pgvector-implementado-ui-gated-off.md).

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Publish(verdict)` | Member que crea reseña, post-filter | Recibe `FilterVerdict` del domain service `IReviewContentFilter`. Si `Clean` → status `published`. Si `Triggered(reasons)` → status `under_review` con reasons documentadas. Emite `ReviewPublished` o `ReviewQuarantined`. |
| `Edit(changes)` | Member autor desde UI | Solo permitido desde `published` ([ADR-0012](../../../decisions/0012-edicion-de-resena-solo-desde-published.md)). Re-corre filter. Marca "editada después de respuesta" si ya hay `TeacherResponse`. Emite `ReviewEdited`. |
| `Quarantine(reason)` | Threshold de reports / staff | Pasa a `under_review` con reason ∈ `{AutoFilter, ReportThreshold, Other}`. Emite `ReviewQuarantined`. |
| `Remove(reason)` | Moderator al upheld report | Pasa a `removed` (terminal pero reversible). Emite `ReviewRemoved`. |
| `Restore(restoredBy)` | Moderator/admin desde audit | Vuelve a `published` desde `removed` o `under_review`. Sin reversión cascade ([ADR-0011](../../../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md)). Emite `ReviewRestored`. |
| `Invalidate(triggeringEventId)` | Policy `InvalidateReviewIfEnrollmentNoLongerValid` (cross-BC) | Pasa a `under_review` por trigger externo (edit destructive del enrollment). Emite `ReviewInvalidated`. |
| `PostTeacherResponse(authorTeacherProfileId, text, clock)` | Docente verificado, capability `review:respond` | Agrega la TeacherResponse (UNIQUE por review). Valida author = TeacherProfile verificado donde `teacher_id == DocenteResenadoId`. Emite `TeacherResponsePublished`. |
| `EditTeacherResponse(authorTeacherProfileId, newText, clock)` | Mismo docente author de la response | Edita la response. Solo el author original. Emite `TeacherResponseEdited`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `ReviewPublished` | Tras `Publish` con verdict Clean | Moderation (audit log), pipeline de embedding gated ([ADR-0013](../../../decisions/0013-embedding-gated-en-transiciones-a-published.md)) |
| `ReviewQuarantined` | Tras `Publish` con verdict Triggered o tras `Quarantine` | Moderation (audit + cola) |
| `ReviewEdited` | Tras `Edit` | Moderation (audit), pipeline de embedding |
| `ReviewInvalidated` | Tras `Invalidate` | Reviews local + telemetría |
| `ReviewRemoved` | Tras `Remove` | Moderation (audit) |
| `ReviewRestored` | Tras `Restore` | Moderation (audit) |
| `TeacherResponsePublished` | Tras `PostTeacherResponse` | Moderation (audit), notificación al author de la review |
| `TeacherResponseEdited` | Tras `EditTeacherResponse` | Moderation (audit) |

Casi todos son también integration events publicados al outbox para Moderation (audit log).

### 3. Invariantes que protege

- `EnrollmentRecordId` UNIQUE: una review por enrollment.
- Al menos uno de `SubjectText`, `TeacherText` no vacío.
- `Difficulty ∈ [1, 5]`.
- `DocenteResenadoId` ∈ teachers asignados a la commission del enrollment (cross-aggregate, validado en app service vía `IAcademicQueryService.GetCommissionTeachers`).
- State machine `Status`: `published | under_review | removed`. Edit solo desde `published` ([ADR-0012](../../../decisions/0012-edicion-de-resena-solo-desde-published.md)).
- Como mucho **una** TeacherResponse por review (invariante interno + UNIQUE constraint en DB).
- TeacherResponse author = TeacherProfile verificado donde `teacher_id = DocenteResenadoId`.

### 4. Cómo se carga / identifica

- Root ID: `ReviewId`.
- Lookup primario: por ID.
- Lookup secundario: por `EnrollmentRecordId` (UNIQUE), por `AuthorId` (lista del autor), por `SubjectId` / `TeacherId` (corpus público).
- Carga eager de children: la `TeacherResponse` se carga junto con el aggregate.
- Persistencia: EF Core schema `reviews`. Tablas `reviews` y `teacher_responses`.

### 5. Boundary

- Quedan afuera: ReviewEmbedding (projection, BC Reviews pero fuera del aggregate), ReviewReport (Moderation BC), ReviewAuditLog (projection, Moderation BC).
- Cross-aggregate validations (author es member, docente reseñado pertenece a la commission, etc.) viven en application service.
- Cascade de reports al `Remove` lo gestiona Moderation, no Reviews.
- Pipeline de embedding consume `ReviewPublished` / `ReviewEdited` async, no afecta el lifecycle del aggregate.

## Value Objects propios

- `Difficulty`: wrapper sobre `int` con rango `[1, 5]`. Validado en ctor.
- `ReviewStatus`: enum `Published | UnderReview | Removed`. State del Review.
- `FilterVerdict`: result del domain service `IReviewContentFilter`. Sum type con dos variantes:
  - `Clean`: el filtro no detectó problemas; review puede publicarse directo.
  - `Triggered(reasons[])`: el filtro detectó algo; review pasa a `under_review` con razones documentadas.

## Refs

- BC: [Reviews](../../strategic/bounded-contexts.md#reviews)
- ADRs: [ADR-0005](../../../decisions/0005-reseña-anclada-al-enrollment.md), [ADR-0007](../../../decisions/0007-pgvector-implementado-ui-gated-off.md), [ADR-0009](../../../decisions/0009-anonimato-como-regla-de-presentacion.md), [ADR-0011](../../../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md), [ADR-0012](../../../decisions/0012-edicion-de-resena-solo-desde-published.md), [ADR-0013](../../../decisions/0013-embedding-gated-en-transiciones-a-published.md), [ADR-0028](../../../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md), [ADR-0032](../../../decisions/0032-edit-destructive-enrollment-invalida-review.md)
- User Stories: [US-050](../../user-stories/US-050.md), [US-051](../../user-stories/US-051.md), [US-052](../../user-stories/US-052.md), [US-053](../../user-stories/US-053.md), [US-067](../../user-stories/US-067.md), [US-068](../../user-stories/US-068.md)
