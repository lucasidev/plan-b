# US-191: Ver qué falta antes de lo cargado

**Épica**: [Sostener el catálogo](../README.md)
**Del mapa**: BO1-1

## Historia

Como quien carga el catálogo, quiero ver qué le falta a cada ficha antes que lo que ya cargué, porque una oferta a medias miente más que una que no existe.

## Listo cuando

- La pantalla abre por huecos y cada oferta muestra cuántos campos le faltan.
- Entre los huecos están los dos que bloquean lo publicado: la duración nominal del plan (sin ella no hay brecha ni cohorte cerrada) y la carrera canónica (sin ella Dónde estudiarla no sabe qué compara).

## Dónde se resuelve

- [Catálogo](../screens/SC-027-catalog/README.md): abre listando las ofertas por huecos, con los dos que bloquean publicar (duración nominal y carrera canónica) marcados aparte; publicar queda bloqueado mientras falte alguno.
