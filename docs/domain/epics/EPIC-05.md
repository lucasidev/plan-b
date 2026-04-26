# EPIC-05: Sistema de reseñas

**Status**: Not started
**BCs involved**: Reviews primario, Moderation (para reports), Identity (lectura para anonimización), Enrollments (lectura para ancla)

## Capability

Alumno publica su experiencia de cursada, otros leen, autor edita, terceros reportan si hay abuso, autor ve estado de reports. Es el motor de contenido de la plataforma.

## User Stories

- [US-017](../user-stories/US-017.md): Publicar reseña
- [US-018](../user-stories/US-018.md): Editar reseña propia
- [US-019](../user-stories/US-019.md): Reportar reseña
- [US-020](../user-stories/US-020.md): Ver mis reports

## Decisiones que la condicionan

- [ADR-0005](../../decisions/0005-reseña-anclada-al-enrollment.md): reseña anclada al enrollment
- [ADR-0007](../../decisions/0007-pgvector-implementado-ui-gated-off.md): pgvector implementado, UI gated off
- [ADR-0009](../../decisions/0009-anonimato-como-regla-de-presentacion.md): anonimato como regla de presentación
- [ADR-0011](../../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md): cascade on uphold, sin reversión on restore
- [ADR-0012](../../decisions/0012-edicion-de-resena-solo-desde-published.md): edición de reseña solo desde published
- [ADR-0013](../../decisions/0013-embedding-gated-en-transiciones-a-published.md): embedding gated en transiciones a published
- [ADR-0028](../../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md): reseñas opcionales
