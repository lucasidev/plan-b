# US-214: Agrupar reclamos por objetivo y ventana

**Épica**: [Moderar sin romper el producto](../../README.md)
**Del mapa**: BO5-3

## Historia

Como quien modera, quiero ver los reclamos agrupados por objetivo, porque doce reclamos sobre el mismo dato de la misma institución son una estrategia, no doce objeciones sueltas.

## Listo cuando

- Los reclamos se agrupan por objetivo y ventana (los que apuntan al mismo dato o nota de la misma institución en 72 horas se ven juntos), y el grupo se resuelve con un criterio, no de a uno.
- El mail confirmado deduplica: dos del mismo mail cuentan uno (D05, [registro del 17](../../../../../history/reviews/2026-08-17-catalog-propagation.md)).

## Dónde se resuelve

- [Reportes](../../screens/SC-031-reports/README.md): los reclamos contra el mismo dato o nota de la misma institución en una ventana de 72 horas se ven y se resuelven juntos, con el mail confirmado deduplicando.

## Notas

P1; tema del mapa: BO5 · Cuando el corpus está bajo ataque
