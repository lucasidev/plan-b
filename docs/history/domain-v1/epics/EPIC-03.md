# EPIC-03: Historial académico

**Status**: Not started
**BCs involved**: Enrollments primario, Academic (lectura para validación), Identity (lectura para owner check)

## Capability

El alumno carga y mantiene su historial: qué cursó, cuándo, con qué resultado. Habilita el simulador (que computa "available" / "blocked" desde el historial) y las reseñas (que se anclan a entradas del historial).

## User Stories

- [US-013](../stories/US-013.md): Cargar historial manual
- [US-014](../stories/US-014.md): Importar historial desde PDF/texto
- [US-015](../stories/US-015.md): Editar entrada del historial

## Decisiones que la condicionan

- [ADR-0004](../../../decisions/0004-enrollment-record-stores-facts-not-derived-state.md): enrollment guarda hechos
- [ADR-0006](../../../decisions/0006-jsonb-only-where-the-shape-is-variable.md): JSONB solo donde el shape es variable
- [ADR-0032](../../../decisions/0032-destructive-enrollment-edit-invalidates-its-review.md): edit destructive enrollment invalida review
