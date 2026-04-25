# ADR-0029: Bounded Context Planning separado de Enrollments

- **Estado**: aceptado
- **Fecha**: 2026-04-25

## Contexto

Discovery del dominio (ver `docs/domain/eventstorming.md`) introdujo features de planificación: guardar simulaciones, compartirlas al corpus público, recibir recomendaciones. Hasta ese punto, el modelo del proyecto tenía 5 BCs: Identity, Academic, Enrollments, Reviews, Moderation. La pregunta: ¿dónde ponemos `SimulationDraft`?

Dos opciones reales:

- **Dentro de Enrollments** — porque comparte data shape (StudentProfile + Subject + Plan).
- **BC propio "Planning"** — porque comparte data shape pero no semántica.

## Decisión

**Planning como BC separado.**

Aggregate único en MVP: `SimulationDraft`.

Razones:

1. **Lenguaje propio**:
   - Enrollments habla de **hechos pasados** ("cursé Programación II en 2025-1, aprobé con 8").
   - Planning habla de **intenciones futuras** ("estoy considerando cursar Programación II + Matemática III en 2026-1").
   - Mismo dato técnico (StudentProfile + Subject + Term), significado opuesto. La distinción Pasado vs Futuro es semántica, no técnica.

2. **Lifecycles distintos**:
   - EnrollmentRecord se crea, eventualmente se edita, prácticamente nunca se borra (es histórico).
   - SimulationDraft se crea, se itera, se comparte / se retira, se borra. Más volátil.

3. **Reglas de privacidad distintas**:
   - EnrollmentRecord es siempre privado (visible solo al alumno).
   - SimulationDraft tiene visibility toggle (privado / shared al corpus público anonimizado).

4. **Features futuras divergen**:
   - Enrollments crece hacia importers, integraciones con sistemas de inscripción reales.
   - Planning crece hacia algoritmos de recomendación, comparación de simulaciones, scoring.
   - Combinarlos hace que ambos lados se contaminen con responsabilidades del otro.

5. **Costo de la separación es bajo**: un módulo más en la modular monolith (`backend/modules/planning/`). No agrega complejidad de comunicación cross-BC porque Planning consume Academic + Enrollments + Reviews vía read APIs sync (no events).

## Alternativas consideradas

### Dentro de Enrollments

Pros: una carpeta menos en el monolith.

Contras (decisivos):
- Lenguaje contaminado: el Enrollment context tendría que hablar de "intentions" y "facts" simultáneamente.
- Privacy rules acopladas: cualquier flag de visibility en Enrollments rompe la regla de que todos los EnrollmentRecord son privados.
- Premium features de Planning (sharing, recommendations) no encajan con la responsabilidad de Enrollments (gestión del historial). Forzar el match volvería a Enrollments un BC tipo "todo lo del alumno".

### BC propio (elegido)

Costos: un módulo más, ergonomía similar al resto (Application + Domain + Infrastructure).

## Consecuencias

**Positivas**:

- Separación clara de "pasado" vs "futuro" en el modelo del alumno.
- Planning puede evolucionar sin tocar Enrollments. Recomendaciones, comparaciones, integración con embeddings — todo en su carpeta.
- Tests de Planning quedan focalizados sin necesidad de mocks del historial completo.
- El lenguaje hablado en `aggregates.md` y los nombres de namespaces son consistentes con el modelo mental.

**Negativas**:

- Un módulo más para mantener (`backend/modules/planning/`).
- Si Planning queda vacío durante MVP (ej. si las premium features se posponen), el módulo queda como skeleton. Aceptable — el módulo se llena al implementar Fase 4.
- Cross-BC reads: Planning consume Academic + Enrollments + Reviews. Bien acotado vía interfaces (`I<BC>QueryService`).

**Estructura física**:

```
backend/modules/planning/
├── src/
│   ├── Planb.Planning.Domain/            (SimulationDraft aggregate, VOs)
│   ├── Planb.Planning.Application/       (commands, handlers, endpoints, queries)
│   └── Planb.Planning.Infrastructure/    (repositorio EF, eventualmente recommendation services)
└── tests/
    └── Planb.Planning.Tests/
```

## Cuándo revisitar

- Si Planning permanece con un solo aggregate y no crece: re-evaluar si vale el módulo separado, podría volver a Enrollments.
- Si Planning crece a 3+ aggregates con sub-features distintos (drafts vs recommendations vs templates), considerar split en sub-BCs.

Refs: [ADR-0014](0014-arquitectura-modular-monolith.md) (modular monolith pattern), [ADR-0028](0028-resenas-opcionales-y-premium-features-como-reward.md) (premium features como reward).
