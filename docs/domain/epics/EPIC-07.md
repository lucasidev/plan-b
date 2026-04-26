# EPIC-07: Moderación

**Status**: Not started
**BCs involved**: Moderation primario, Reviews (operaciones cross-BC vía events)

## Capability

Moderadores ven cola de reseñas pendientes, resuelven reports (upheld / dismissed), restauran reseñas removidas, consultan audit log de cualquier reseña. Va junto con el sistema de reseñas: sin moderación, las reseñas son un riesgo.

## User Stories

- [US-050](../user-stories/US-050.md): Ver cola de reseñas under_review
- [US-051](../user-stories/US-051.md): Resolver report
- [US-052](../user-stories/US-052.md): Restaurar reseña removida
- [US-053](../user-stories/US-053.md): Ver audit log

## Decisiones que la condicionan

- [ADR-0010](../../decisions/0010-threshold-auto-hide-configurable-por-env-var.md): threshold auto-hide configurable por env var
- [ADR-0011](../../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md): cascade on uphold, sin reversión on restore
- [ADR-0030](../../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md): cross-BC consistency vía Wolverine outbox
- [ADR-0031](../../decisions/0031-review-audit-log-como-projection.md): review audit log como projection
