# US-132: Buscar por materia, carrera o docente

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: O1-6

## Historia

Como quien lee, quiero buscar por materia, carrera o docente, porque lo que me recomiendan es una persona, no una carrera.

## Listo cuando

- Una sola búsqueda devuelve los cuatro sujetos con ficha (materia, cátedra, carrera en una institución, institución), y buscar el nombre de un docente lleva a su cátedra.

## Dónde se resuelve

- [Buscar](../../screens/SC-006-search/README.md): la pantalla entera. Una sola búsqueda devuelve los cuatro sujetos con ficha.
- [Ficha de cátedra](../../screens/SC-002-chair/README.md): el destino cuando lo buscado es un docente, porque un docente no es una ficha, la cátedra sí.
- [Ficha de materia](../../screens/SC-007-subject/README.md): el destino cuando lo buscado es una materia.

## Notas

depende de US-196
