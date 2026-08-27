# US-136: Entender la ficha vacía cuando llego primero

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: T2-3

## Historia

Como quien lee, quiero entender qué hago acá si llego primero y casi no hay nada cargado todavía, porque si no entiendo por qué está vacío, no tengo razón para ser de las primeras voces.

## Listo cuando

- Con cero voces, la ficha dice que arranca vacía y que se puede ser la primera persona en reseñarla: nunca un 0 % ni "0 de 0".
- Con voces pero todavía debajo del piso de 10 reseñas, la ficha muestra cuántas ya juntó y cuántas faltan para publicar ("junta 3 reseñas: con 7 más se publica"), sin adelantar ningún conteo.
- Ninguno de los dos estados se confunde con un cero ni con la ficha ya publicada.

## Dónde se resuelve

- [Ficha de cátedra](../../screens/SC-002-chair/README.md): sin voces, dice que arranca vacía; bajo el piso, muestra el conteo hacia las 10 reseñas.
- [Ficha de carrera](../../screens/SC-001-career/README.md): sin ninguna cátedra que haya pasado el piso todavía, dice que arranca vacía.
- [Ficha de materia](../../screens/SC-007-subject/README.md): mismo comportamiento; y cuando alguna de sus cátedras está bajo el piso, se lista igual en "sus cátedras", con su cuenta y cuánto le falta.

## Notas

P1; tema del mapa: T2 · Cuando el riesgo es real. Hasta [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) esta story pedía que la primera voz ya publicara, sin piso. ADR-0082 introdujo el piso de 10 reseñas por cátedra, por privacidad del que reseña: ahora hay un tramo intermedio (bajo el piso) que esta story también explica, siempre con el conteo real a la vista, nunca oculto.
