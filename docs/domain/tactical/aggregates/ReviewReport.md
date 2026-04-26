# ReviewReport (Moderation)

**Tipo**: lean
**BC**: Moderation
**Root ID**: `ReviewReportId`
**Child entities**: ninguna

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Open(reviewId, reporterId, reason, details?, clock)` | Member desde UI sobre una review | Factory; crea report en `Status='open'`. Valida `ReporterId != Review.AuthorId` (en app service) y unicidad `(ReviewId, ReporterId)`. Si `Reason='Other'`, requiere `details` no vacío. Emite `ReviewReported`. |
| `Uphold(moderatorId, resolutionNote, clock)` | Moderator desde cola | Pasa a `Status='upheld'`. Emite `ReportUpheld`. Cross-BC: Reviews recibe el integration event y aplica policy `RemoveReviewOnReportUpheld` ([ADR-0011](../../../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md)). |
| `Dismiss(moderatorId, resolutionNote, clock)` | Moderator desde cola | Pasa a `Status='dismissed'`. Emite `ReportDismissed`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `ReviewReported` | Tras `Open` | Moderation (audit log, threshold de auto-quarantine en Reviews via [ADR-0010](../../../decisions/0010-threshold-auto-hide-configurable-por-env-var.md)) |
| `ReportUpheld` | Tras `Uphold` | Moderation local + traducido a `ReportUpheldIntegrationEvent` para Reviews (policy `RemoveReviewOnReportUpheld`); audit log |
| `ReportDismissed` | Tras `Dismiss` | Moderation (audit log) |

### 3. Invariantes que protege

- `(ReviewId, ReporterId)` UNIQUE: un user solo puede reportar una vez la misma review.
- `ReporterId != Review.AuthorId`: el autor no puede reportarse a sí mismo (validado en app service).
- State machine `Status`: `open → upheld | dismissed`. Terminal.
- `Status='upheld'` requiere `ResolutionNote NOT NULL`, `ModeratorId NOT NULL`, `ResolvedAt NOT NULL`.
- `Reason='Other'` requiere `details` no vacío.

### 4. Cómo se carga / identifica

- Root ID: `ReviewReportId`.
- Lookup primario: por ID.
- Lookup secundario: por `ReviewId` (cuántos reports tiene una review, para el threshold), por `Status='open'` (cola del moderador).
- Persistencia: EF Core schema `moderation`. Tabla `review_reports`.

### 5. Boundary

- El cascade al `Uphold` (cerrar otros reports abiertos sobre la misma review) lo gestiona Moderation orchestrator, no el aggregate solo.
- Reviews remueve la review como reacción al integration event, no escribe directo en su aggregate desde Moderation.

## Value Objects propios

- `ReportReason`: enum `Spam | Insult | OffTopic | PersonalAttack | Other`. Cuando es `Other`, requiere `details` no vacío.
- `ReportStatus`: enum `Open | Upheld | Dismissed`.

## Refs

- BC: [Moderation](../../strategic/bounded-contexts.md#moderation)
- ADRs: [ADR-0010](../../../decisions/0010-threshold-auto-hide-configurable-por-env-var.md), [ADR-0011](../../../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md), [ADR-0031](../../../decisions/0031-review-audit-log-como-projection.md)
- User Stories: [US-053](../../user-stories/US-053.md)
