# Buscar (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la búsqueda y sus estados; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública, se lee sin cuenta. Sin slug hoy (el topbar tiene buscador y no lleva a ninguna pantalla). Épicas que la componen: [Elegir dónde estudiar](../../README.md) (la búsqueda que entiende que lo que te recomiendan es una persona, US-132), [Pedir una carrera](../../../request-a-career/README.md) (el vacío explicado, con Pedir al lado).

## Quién la usa

Quien lee, con un nombre suelto en la cabeza y no una carrera ("lo que me recomiendan es una persona"), **Ana** (busca su facultad y quiere saber si el vacío es de ella o de plan-b), y **Valentina** o **Lucía** buscando a un docente del que ya escucharon hablar.

## Qué stories resuelve

[US-132](../../README.md) (una sola búsqueda devuelve los cuatro sujetos con ficha, y el nombre de un docente lleva a su cátedra), [US-139](../../../request-a-career/README.md#stories) (si no está, se explica con los tres estados del vacío), [US-168](../../../../guarantees/README.md#stories) (sin cuenta), [US-196](../../../../team/sustain-the-catalog/README.md#stories) (el nombre de un docente resuelve a su cátedra porque la cátedra existe como entidad propia, no como ficha del docente).

## Qué muestra

1. **Una sola búsqueda**: un campo de texto que devuelve los cuatro sujetos con ficha (materia, cátedra, carrera en una institución, institución), mezclados y cada uno con su tipo a la vista.
2. **El nombre de un docente lleva directo a su cátedra**: un docente no es una ficha, la cátedra sí (depende de que la cátedra exista como entidad, US-196).
3. **Sin cuenta** (US-168): buscar y abrir cualquier resultado desde acá no pide login.

## Estados

- **"Resultados mezclados por sujeto"**: cada fila dice de qué sujeto es (materia, cátedra, carrera, institución) para no confundir una materia con la carrera que la contiene.
- **"Sin resultados"**: si de verdad no hay nada cargado con ese nombre, la causa es una de dos, nunca un cero (US-139): no la cargamos todavía (con [Pedir](../../../request-a-career/screens/SC-010-request/README.md)) o hay un error de tipeo. Si estuviera cargada, sin voces o con cobertura parcial, la búsqueda la devuelve igual, como resultado con su propio estado a la vista.

## Lo que no muestra nunca

Ninguna ficha de "docente": no existe como entidad con ficha propia, siempre resuelve a su cátedra; ningún resultado mostrado como un cero cuando en realidad está cargado sin voces o con cobertura parcial todavía (US-139); ningún orden entre resultados por conveniencia.

## Adónde va

Llega desde: el buscador del topbar de cualquier pantalla (hoy no lleva a ninguna pantalla propia: es lo que esta ficha empieza a fijar), [La entrada](../SC-004-entrance/README.md). Va a: [Ficha de materia](../SC-007-subject/README.md), [Ficha de cátedra](../SC-002-chair/README.md), [Ficha de carrera](../SC-001-career/README.md), [Ficha de institución](../../../../reviewed/reply/screens/SC-005-institution/README.md), [Pedir](../../../request-a-career/screens/SC-010-request/README.md).

## Decisiones que aplica

[ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (los tres estados del vacío: sin voces, con voces y con cobertura parcial siempre a la vista). La cátedra como entidad de la que depende US-132 la carga US-196, en [Sostener el catálogo](../../../../team/sustain-the-catalog/README.md#stories). La garantía de [Que no me molesten](../../../../guarantees/README.md) que se verifica acá: sin cuenta (US-168).

## Lo que esta ficha deja abierto

- **El orden entre sujetos** cuando una búsqueda devuelve varios tipos a la vez.
- **Búsqueda con errores de tipeo.**
- **Si esta pantalla existe aparte o los resultados aparecen inline en el topbar**: hoy el buscador no lleva a ningún lado.
