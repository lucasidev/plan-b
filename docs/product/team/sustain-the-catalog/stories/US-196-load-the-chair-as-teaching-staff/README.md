# US-196: Cargar la cátedra como entidad propia

**Épica**: [Sostener el catálogo](../../README.md)
**Del mapa**: BO1-6

## Historia

Como quien carga el catálogo, quiero cargar la cátedra como el equipo docente a cargo de una materia, porque es lo que el alumno recuerda al reseñar y hoy en el catálogo no existe.

## Listo cuando

- La cátedra es una entidad propia (materia más equipo docente, con su titular), persiste entre períodos, y es la lista que Reseñar ofrece cuando el alumno la recuerda.
- Cada integrante del equipo se carga con su nombre, y ese dato nunca se completa a partir de lo que declara quien pide verificarse: es contra lo cargado que después se lo verifica ([ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)).

## Dónde se resuelve

- [Catálogo](../../screens/SC-027-catalog/README.md): la cátedra se carga como entidad propia, equipo docente y titular, y persiste entre períodos.
- [Ficha de cátedra](../../../../student/choose-where-to-study/screens/SC-002-chair/README.md): la ficha entera depende de que la cátedra exista como entidad, cargada acá.
- [Docente](../../../../student/choose-where-to-study/screens/SC-035-teacher/README.md): lo que la pantalla lista es el equipo cargado acá, con su rol; el nombre de un docente llega a sus cátedras porque la cátedra existe como entidad.
- [Buscar](../../../../student/choose-where-to-study/screens/SC-006-search/README.md): una cátedra aparece como resultado propio porque existe como entidad, cargada acá.

## Notas

se parte al planificar
