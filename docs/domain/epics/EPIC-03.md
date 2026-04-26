# EPIC-03: Historial académico

**Status**: Not started
**BCs involved**: Enrollments primario, Academic (lectura para validación), Identity (lectura para owner check)

## Capability

El alumno carga y mantiene su historial: qué cursó, cuándo, con qué resultado. Habilita el simulador (que computa "available" / "blocked" desde el historial) y las reseñas (que se anclan a entradas del historial).

## User Stories

- [US-013](../user-stories/US-013.md): Cargar historial manual
- [US-014](../user-stories/US-014.md): Importar historial desde PDF/texto
- [US-015](../user-stories/US-015.md): Editar entrada del historial

## Decisiones que la condicionan

- [ADR-0004](../../decisions/0004-enrollment-guarda-hechos.md): enrollment guarda hechos
- [ADR-0006](../../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md): JSONB solo donde el shape es variable
- [ADR-0032](../../decisions/0032-edit-destructive-enrollment-invalida-review.md): edit destructive enrollment invalida review
