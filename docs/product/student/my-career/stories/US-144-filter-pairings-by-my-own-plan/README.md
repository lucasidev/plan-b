# US-144: Filtrar la co-cursada contra mi plan

**Épica**: [Mi carrera](../../README.md)
**Del mapa**: O3-2

## Historia

Como quien está cursando, quiero ver esas combinaciones contra lo que me falta, porque el promedio de todos no es mi caso.

## Listo cuando

- Entrando con cuenta, la co-cursada se filtra a las materias que todavía puedo cursar: lo que reseñé con cómo terminó cuenta como hecho, y lo que marqué en mi plan como que me falta o considero es preferencia privada que no se recaba ni se publica ([ADR-0069](../../../../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)).
- Resolver correlativas contra el plan es lo que hoy hace `SubjectAvailabilityEvaluator` en `planning`: se rescata a `academic` antes de podar, no se reescribe.

## Dónde se resuelve

- [Mi carrera](../../screens/SC-011-my-career/README.md): filtra la pestaña de co-cursada a las materias que todavía podés cursar, cruzando lo reseñado (hecho) con lo marcado (preferencia privada).

## Notas

depende de US-154
