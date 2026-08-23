# US-192: Ordenar la cola por demanda

**Épica**: [Sostener el catálogo](../../README.md)
**Del mapa**: BO1-2

## Historia

Como quien carga el catálogo, quiero que la cola se ordene por cuántos lo pidieron, porque cargar por orden de llegada deja afuera a los que más lo necesitan.

## Listo cuando

- Los pedidos se ordenan por cantidad y muestran de qué institución vienen.

## Dónde se resuelve

- [Pedidos](../../screens/SC-030-requests/README.md): la cola se ordena por pedidos confirmados, nunca por orden de llegada, con la institución de origen en cada fila.
