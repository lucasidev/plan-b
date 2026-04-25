# ADR-0031: ReviewAuditLog como projection (no aggregate)

- **Estado**: aceptado
- **Fecha**: 2026-04-25

## Contexto

`ReviewAuditLog` registra el historial completo de eventos sobre una review: publicación, ediciones, reports, removals, restores, respuestas docentes. El moderador lo consulta (UC-053) para tener contexto al resolver casos.

El data model original (`docs/architecture/data-model.md`) lo lista junto a otras entidades de Moderation. La pregunta es: ¿es un aggregate con su propio comportamiento, o una proyección / read model derivado de events?

## Decisión

**ReviewAuditLog es una projection / read model**, no un aggregate.

- **No tiene comportamiento de dominio**. Solo se le agregan rows.
- **No protege invariantes** que abarquen múltiples rows (cada entry es independiente).
- **Append-only**. Nunca se modifica una entry existente.
- **Se construye reactivamente** desde integration events de Reviews, ReviewReport, TeacherResponse y eventos relevantes de Identity (UserDisabled, etc.).

### Implementación

Un handler en `Moderation.Application.EventHandlers.AuditLogProjector` escucha:

- `ReviewPublished` → entry con action='published'.
- `ReviewQuarantined` → entry con action='quarantined' + reason.
- `ReviewEdited` → entry con action='edited' + before/after diff.
- `ReviewInvalidated` → entry con action='invalidated' + triggering_event_id.
- `ReviewRemoved` → entry con action='removed' + report_id (cuando aplica).
- `ReviewRestored` → entry con action='restored' + moderator_id.
- `TeacherResponsePublished` → entry con action='response_added' + response_author_id.
- `TeacherResponseEdited` → entry con action='response_edited'.
- `ReviewReported` → entry con action='reported' + reporter_id + reason.
- `ReportUpheld`, `ReportDismissed` → entry con action='report_resolved' + resolution + moderator_id.
- `UserDisabledIntegrationEvent` → entry con action='author_disabled' (si afecta una review).

Cada entry persiste a tabla `moderation.review_audit_log`:

```
id            UUID PK
review_id     UUID NOT NULL    -- FK lógica a reviews.review (cross-schema, sin FK constraint)
at            TIMESTAMPTZ NOT NULL
action        TEXT NOT NULL    -- discriminated by enum-like values
actor_id      UUID NULL        -- quien generó el event (User si aplica)
context       JSONB NULL       -- payload variable según action
```

Read APIs:

- `IReviewAuditLogQueryService.GetForReview(reviewId)` retorna entries ordenadas por `at DESC`.
- Acceso restricto: solo moderators y admins pueden consultar.

## Alternativas consideradas

### ReviewAuditLog como aggregate

Un aggregate `ReviewAuditLog` que encapsula la lógica de "registrar entries". Cada vez que sucede un event, llama a `auditLog.Record(action, context)`.

Contras (decisivos):

- **No hay invariantes que proteger**. La regla "append-only" se enforce con DB constraints (no UPDATE permitido) o convención del handler. No requiere aggregate behavior.
- **No tiene state machine**. Solo crece. El root no decide nada.
- **Llamarlo "aggregate" infla el concepto**. Aggregates protegen invariantes que cruzan objetos; una tabla de log no lo hace.

### Hardcoded en cada handler

Cada handler de event que afecta a Reviews escribe directamente a `review_audit_log`. Sin proyector centralizado.

Contras: lógica esparcida, fácil olvidar agregar entry cuando se agrega event nuevo. Centralizar en un projector hace una sola lugar para mantener el mapping event → entry.

## Consecuencias

**Positivas**:

- Modelo simple. Una tabla, un handler, una API de lectura.
- Append-only se respeta naturalmente porque el projector solo INSERT-ea.
- Se puede reconstruir totalmente desde el log de events (en teoría — práctica requiere que los events estén durables, lo cual está garantizado por el outbox de Wolverine, [ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md)).
- Si en futuro queremos features como "exportar audit log a SIEM", el projector se enchufa a otro destino.

**Negativas**:

- El audit log es un single point of failure de auditoría. Si el projector falla por un bug, faltan entries (aunque los events siguen en el outbox para reprocessing).
- Mitigación: el projector es código simple (insert por event). Tests unitarios cubren cada mapping. Si un event nuevo no tiene mapping, queda sin entry — flag-able con CI rule "todo event de Reviews debe estar mapeado en el projector".

**No-decisión explícita**:

- No decidimos si las entries del audit log son **inmutables a nivel DB** (sin UPDATE, sin DELETE) o solo por convención. Inicialmente convención. Si en futuro hay riesgo de tampering, agregar Postgres rules para forbidder UPDATE/DELETE.

## Cuándo revisitar

- Si crece la cantidad de events que afectan al log y el projector se vuelve un blob enorme: split por categoría (ej. `ReviewLifecycleProjector`, `TeacherResponseProjector`).
- Si necesitamos rebuild del log desde eventos en el outbox (porque un event no se mapeó): plan de replay, podría requerir storage del payload completo.

Refs: [ADR-0011](0011-cascade-on-uphold-sin-reversion-on-restore.md), [ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md).
