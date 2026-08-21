# US-158: Avisar si el comentario me delata

**Épica**: [Reseñar](../README.md)
**Del mapa**: T2-1

## Historia

Como quien reseña, quiero que me avisen si lo que escribí me delata, porque "los tres que cursamos con Pérez en el turno noche" no tiene nombres y aun así soy yo.

## Listo cuando

- Antes de publicar, el chequeo marca lo que puede identificarme por contexto y decido yo si lo dejo, sabiendo que la réplica no va a poder citarlo.
- Lo que habla de una persona fuera de su acto queda retenido hasta que alguien lo mire, y me lo dicen ([ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)).

## Dónde se resuelve

- [Reseñar](../screens/SC-015-write-review/README.md): el chequeo previo corre en el paso 6, antes de publicar el comentario.
- [Anonimato](../screens/SC-013-anonymity/README.md): explica las dos salidas del chequeo antes de que el usuario llegue a escribir.
- [Editar](../../undo/screens/SC-017-edit/README.md): el mismo chequeo vuelve a correr si el comentario editado cambió.

## Notas

P1; se parte al planificar; tema del mapa: T2 · Cuando el riesgo es real
