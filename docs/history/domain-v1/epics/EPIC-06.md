# EPIC-06: Claim e identidad docente

**Status**: Not started
**BCs involved**: Identity primario, Reviews (TeacherResponse), Academic (Teacher entity)

## Capability

Un member que también es docente puede reclamar su identidad docente, verificarla (vía email institucional o evidencia manual), y entonces responder reseñas sobre sí mismo.

## User Stories

- [US-030](../stories/US-030.md): Iniciar claim de docente
- [US-031](../stories/US-031.md): Verificar docente por email institucional
- [US-032](../stories/US-032.md): Solicitar verificación manual
- [US-040](../stories/US-040.md): Responder reseña
- [US-041](../stories/US-041.md): Editar respuesta docente
- [US-069](../stories/US-069.md): Verificar TeacherProfile manual (admin)

## Decisiones que la condicionan

- [ADR-0008](../../../decisions/0008-exclusive-roles-with-profiles-as-capability-unlockers.md): roles exclusivos, profiles como capacidades
- [ADR-0033](../../../decisions/0033-verification-token-as-a-child-entity.md): VerificationToken como child entity
