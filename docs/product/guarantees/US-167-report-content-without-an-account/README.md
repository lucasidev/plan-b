# US-167: Reportar algo sin registrarme

> **Concepto rebasado el 2026-08-25**: esta garantía depende de que haya testimonios publicados para reportar. [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) retira la publicación de texto libre (el campo libre no se publica nunca) y declara que "el módulo de moderación se achica a casi nada: sin texto publicado no hay reportes de contenido que arbitrar". Falta decidir si esta garantía sigue viva sobre otro contenido publicado (la respuesta del reseñado firmada, una nota editorial) o se retira.

**Épica**: [Deshacer](../README.md)
**Del mapa**: O5-4

## Historia

Como quien lee, quiero reportar algo sin registrarme, porque no me voy a hacer cuenta en el sitio que me difama.

## Listo cuando

- El reporte se manda sin cuenta, confirma el mail por link antes de entrar a la cola, y lo resuelve una persona: nada baja solo por cantidad de reportes.

## Dónde se resuelve

- [Ficha de cátedra](../../student/choose-where-to-study/screens/SC-002-chair/README.md): la acción "Reportar" inline, sin cuenta, con mail confirmado por link.
- [Ficha de materia](../../student/choose-where-to-study/screens/SC-007-subject/README.md): la misma acción inline, sobre lo publicado en esa ficha.
- [Reportes](../../team/moderate-without-breaking-the-product/screens/SC-031-reports/README.md): donde una persona resuelve el reporte; nada baja solo por cantidad.

Reportar no tiene pantalla propia: es una acción inline sobre la ficha del sujeto reportado, como ya lo dice el [README de la épica](../README.md).

## Notas

par de US-206
