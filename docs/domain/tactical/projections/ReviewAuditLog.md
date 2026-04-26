# ReviewAuditLog (Moderation)

**Tipo**: projection / read model
**BC**: Moderation
**Source**: events de Reviews y de Identity (UserDisabled)

## Estructura

Append-only. Cada row: `(at, review_id, action, actor_id, before?, after?)`.

| Field | Tipo | Notas |
|---|---|---|
| `at` | timestamptz | Cuando ocurrió el event de origen (`OccurredAt`) |
| `review_id` | UUID | Review afectada |
| `action` | string enum | Tipo de event: `Published`, `Edited`, `Quarantined`, `Removed`, `Restored`, `TeacherResponsePublished`, `TeacherResponseEdited`, `AuthorDisabled` |
| `actor_id` | UUID? | Quién disparó la acción (puede ser sistema en quarantines automáticos) |
| `before` | JSONB? | Snapshot relevante pre-cambio (en edits) |
| `after` | JSONB? | Snapshot relevante post-cambio |

## Cómo se construye

Handlers en Moderation que escuchan integration events y escriben rows. No hay escrituras directas a la tabla desde otro lado.

| Event | Origen | Acción registrada |
|---|---|---|
| `ReviewPublished` | Reviews | `Published` |
| `ReviewEdited` | Reviews | `Edited` (con before/after) |
| `ReviewQuarantined` | Reviews | `Quarantined` (con reason) |
| `ReviewRemoved` | Reviews | `Removed` |
| `ReviewRestored` | Reviews | `Restored` |
| `TeacherResponsePublished` | Reviews | `TeacherResponsePublished` |
| `TeacherResponseEdited` | Reviews | `TeacherResponseEdited` |
| `UserDisabledIntegrationEvent` | Identity | `AuthorDisabled` (para reviews del user disabled, vía soft-flag) |

## Quién la consume

- Moderator UI: timeline completo de la vida de una review (cola de moderación, detalle).
- Endpoints internos para audit y soporte.

## Refs

- ADRs: [ADR-0031](../../../decisions/0031-review-audit-log-como-projection.md)
- BC: [Moderation](../../strategic/bounded-contexts.md#moderation)
