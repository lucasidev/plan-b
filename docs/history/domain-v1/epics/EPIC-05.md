# EPIC-05: Sistema de reseñas

**Status**: Not started
**BCs involved**: Reviews primario, Moderation (para reports), Identity (lectura para anonimización), Enrollments (lectura para ancla)

## Capability

Alumno publica su experiencia de cursada, otros leen, autor edita, terceros reportan si hay abuso, autor ve estado de reports. Es el motor de contenido de la plataforma.

## User Stories

- [US-017](../stories/US-017.md): Publicar reseña
- [US-018](../stories/US-018.md): Editar reseña propia
- [US-019](../stories/US-019.md): Reportar reseña
- [US-020](../stories/US-020.md): Ver mis reports

## Decisiones que la condicionan

- [ADR-0005](../../../decisions/0005-review-anchored-to-the-enrollment-record.md): reseña anclada al enrollment
- [ADR-0007](../../../decisions/0007-pgvector-deferred-until-there-is-a-real-consumer.md): pgvector diferido hasta que exista consumidor real (revisión 2026-07-26)
- [ADR-0009](../../../decisions/0009-review-anonymity-is-a-presentation-rule.md): anonimato como regla de presentación
- [ADR-0011](../../../decisions/0011-cascade-on-uphold-with-no-reversal-on-restore.md): cascade on uphold, sin reversión on restore
- [ADR-0012](../../../decisions/0012-review-editing-blocked-while-a-report-moderates-it.md): edición de reseña bloqueada mientras la modera un reporte
- [ADR-0013](../../../decisions/0013-embedding-generation-gated-on-transitions-to-published.md): embedding gated en transiciones a published
- [ADR-0028](../../../decisions/0028-optional-reviews-with-premium-features-as-reward.md): reseñas opcionales
