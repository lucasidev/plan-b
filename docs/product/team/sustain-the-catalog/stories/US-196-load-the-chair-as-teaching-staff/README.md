# US-196: Cargar la cátedra como entidad propia

**Épica**: [Sostener el catálogo](../../README.md)
**Del mapa**: BO1-6

## Historia

Como quien carga el catálogo, quiero mantener la cátedra y su equipo docente dentro de una materia, porque permiten identificar la cursada y conservar su historial.

## Listo cuando

- La cátedra persiste entre períodos. Su alta, detalle y edición del equipo muestran materia, plan, carrera y universidad; se llega desde la materia o un acceso directo y se vuelve conservando el contexto.
- El backoffice permite agregar integrantes y cerrar sus tramos con nombre, rol y períodos coherentes de la misma universidad. El nombre nunca se completa a partir de lo que declara quien pide verificarse: se verifica contra lo cargado ([ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)).
- Archivar conserva la ficha pública y sus reseñas, con el estado archivada visible. Un alumno puede aportar después una cursada anterior al cierre efectivo; una cursada posterior no es elegible. La acción administrativa de archivar no determina cuándo se dictó la última cursada.

## Dónde se resuelve

- [Catálogo](../../screens/SC-027-catalog/README.md): la cátedra se carga como entidad propia, equipo docente y titular, y persiste entre períodos.
- [Ficha de cátedra](../../../../student/choose-where-to-study/screens/SC-002-chair/README.md): la ficha entera depende de que la cátedra exista como entidad, cargada acá.
- [Docente](../../../../student/choose-where-to-study/screens/SC-035-teacher/README.md): lo que la pantalla lista es el equipo cargado acá, con su rol; el nombre de un docente llega a sus cátedras porque la cátedra existe como entidad.
- [Buscar](../../../../student/choose-where-to-study/screens/SC-006-search/README.md): una cátedra aparece como resultado propio porque existe como entidad, cargada acá.

## Notas

El cambio de titular no define por sí solo si continúa la misma identidad: ese caso sigue pendiente. La representación del cierre efectivo, su frontera por período, el tratamiento de archivos sin fecha y la reactivación deben precisarse antes de implementar el archivo. Los [escenarios](scenarios.md) conservan los casos decididos y sus límites.
