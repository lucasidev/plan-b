# US-209: Revisar el campo libre que el filtro retuvo

**Épica**: [Moderar sin romper el producto](../../README.md)
**Del mapa**: BO2-8

## Historia

Como quien modera, quiero revisar el campo libre que el filtro grueso retuvo antes de la curaduría, porque una agresión dirigida o el dato personal de un tercero no debe llegar al equipo y una señal útil no debe perderse por una decisión automática.

## Listo cuando

- La cola muestra el campo libre retenido sin identificar a quien lo escribió y señala qué parte disparó el filtro.
- Quien modera puede liberarlo hacia la curaduría o descartarlo; la decisión queda registrada con categoría, responsable y fecha, y el paso del tiempo no resuelve nada solo.
- Retener o descartar el campo libre no altera las respuestas cerradas de la reseña, que siguen contando como una voz en los agregados.

## Dónde se resuelve

- [Reportes](../../screens/SC-031-reports/README.md): muestra el campo libre retenido y permite liberarlo hacia la curaduría o descartarlo sin revelar la identidad de quien lo escribió.

## Notas

[ADR-0055](../../../../../decisions/0055-content-filter-is-a-coarse-first-pass-not-a-verdict.md) hace del filtro un primer paso grueso que deriva a una persona; [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) impide publicar el campo libre. US-212 cubre la capacidad de la cola cuando se acumula trabajo; esta story cubre la resolución de un elemento retenido.
