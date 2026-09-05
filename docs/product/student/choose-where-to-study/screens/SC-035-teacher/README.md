# Docente (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: construida; la ficha se escribió el 2026-09-05 desde lo construido, con su [boceto mid-fi](sketch.html). Pública, se lee sin cuenta. Slug `/teachers/[id]`. Épicas que la componen: [Elegir dónde estudiar](../../README.md) (el nombre que te recomendaron, US-132), [Sostener el catálogo](../../../../team/sustain-the-catalog/README.md) (el equipo de cada cátedra, cargado en el backoffice, US-196).

## Quién la usa

Quien lee con un nombre suelto en la cabeza, porque lo que le recomendaron es una persona y no una carrera: **Valentina** o **Lucía** después de que alguien les nombró a un docente. Y **Claudia**, buscándose para ver qué cátedras le atribuye el catálogo.

## Qué stories resuelve

[US-132](../../stories/US-132-search-by-subject-career-or-teacher/README.md) (el nombre de un docente lleva acá, y de acá a las cátedras que integra), [US-196](../../../../team/sustain-the-catalog/README.md#stories) (lo que lista es el equipo que el backoffice cargó en cada cátedra, con su rol), [US-168](../../../../guarantees/README.md#stories) (sin cuenta).

## Qué muestra

1. **Quién es**: el rótulo "Docente", nombre y apellido, el cargo si está cargado, la foto o las iniciales, y la bio si la hay. Ningún número al lado del nombre.
2. **Sus cátedras**: cada cátedra que integra hoy, con el código y el nombre de la materia y su rol en el equipo (titular, adjunto, JTP, ayudante, invitado), cada una como link a su [Ficha de cátedra](../SC-002-chair/README.md), que es donde viven los conteos.
3. **Cátedras que integró antes**: aparte y marcadas, para no atribuirle lo que se dicta hoy sin ella ni borrar su historia.

## Estados

- **Con cátedras**: lo normal.
- **Sin ninguna cátedra**: solo la cabecera; el bloque de cátedras no se dibuja.
- **Dado de baja en el catálogo**: la pantalla dice que el docente ya no figura y que lo reseñado de sus cátedras se conserva, en vez de un 404.
- **Id inexistente**: 404.

## Lo que no muestra nunca

Ningún conteo, porcentaje, moda ni puntaje atribuido a la persona: lo que se reseña y se publica es la cátedra ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)), y esta pantalla es el camino del apellido a esas fichas, no un legajo. Ninguna reseña individual ni texto libre ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)). Nada dicho por el docente sobre sí mismo fuera de lo que el catálogo carga (US-196).

## Adónde va

Llega desde: [Buscar](../SC-006-search/README.md) (el resultado de tipo docente). Va a: [Ficha de cátedra](../SC-002-chair/README.md) (cada cátedra que integra), y a [Explorar](../SC-003-explore/README.md) y Buscar desde la barra del catálogo.

## Decisiones que aplica

[ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (los conteos son de la cátedra: ninguno se atribuye a la persona), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el texto libre no se publica en ninguna pantalla). La cátedra como entidad con su equipo la carga US-196 en [Sostener el catálogo](../../../../team/sustain-the-catalog/README.md#stories). La garantía de [Que no me molesten](../../../../guarantees/README.md) que se verifica acá: sin cuenta (US-168).

## Lo que esta ficha deja abierto

- **Si la Ficha de cátedra enlaza a esta pantalla** desde su equipo, o solo Buscar llega acá.
- **El hi-fi**: el boceto es el mid-fi de lo construido, no una identidad visual decidida.
