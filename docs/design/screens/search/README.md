# Buscar (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la búsqueda y sus estados; revisada el 2026-08-19 ([registro](../../../reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública, se lee sin cuenta. Sin slug hoy (del inventario: el topbar tiene buscador y no lleva a ninguna pantalla). Épicas que la componen: [Elegir dónde estudiar](../../../epics/choose-where-to-study/README.md) (la búsqueda que entiende que lo que te recomiendan es una persona, O1-6), [Pedir una carrera](../../../epics/request-a-career/README.md) (el vacío explicado, con Pedir al lado).

## Quién la usa

Quien lee, con un nombre suelto en la cabeza y no una carrera ("lo que me recomiendan es una persona"), **Ana** (busca su facultad y quiere saber si el vacío es de ella o de plan-b), y **Valentina** o **Lucía** buscando a un docente del que ya escucharon hablar.

## Qué stories resuelve

[O1-6](../../../epics/choose-where-to-study/README.md#stories) (una sola búsqueda devuelve los cuatro sujetos con ficha, y el nombre de un docente lleva a su cátedra), [O2-1](../../../epics/request-a-career/README.md#stories) (si no está, se explica con los tres estados del vacío), [O6-1](../../../epics/do-not-bother-me/README.md#stories) (sin cuenta).

## Qué muestra

1. **Una sola búsqueda**: un campo de texto que devuelve los cuatro sujetos con ficha (materia, cátedra, carrera en una institución, institución), mezclados y cada uno con su tipo a la vista.
2. **El nombre de un docente lleva directo a su cátedra**: un docente no es una ficha, la cátedra sí (depende de que la cátedra exista como entidad, BO1-6).
3. **Estado "resultados mezclados por sujeto"**: cada fila dice de qué sujeto es (materia, cátedra, carrera, institución) para no confundir una materia con la carrera que la contiene.
4. **Estado "sin resultados"**: si de verdad no hay nada cargado con ese nombre, la causa es una de dos, nunca un cero (O2-1): no la cargamos todavía (con [Pedir](../../../epics/request-a-career/screens/request/README.md)) o hay un error de tipeo. Si estuviera cargada, sin voces o sin cabecera, la búsqueda la devuelve igual, como resultado con su propio estado a la vista.
5. **Sin cuenta** (O6-1): buscar y abrir cualquier resultado desde acá no pide login.

## Lo que no muestra nunca

Ninguna ficha de "docente": no existe como entidad con ficha propia, siempre resuelve a su cátedra; ningún resultado mostrado como un cero cuando en realidad está cargado sin voces o sin cabecera todavía (O2-1); ningún orden entre resultados por conveniencia.

## Adónde va

Llega desde: el buscador del topbar de cualquier pantalla (hoy no lleva a ninguna pantalla propia: es lo que esta ficha empieza a fijar), [Inicio](../home/README.md). Va a: [Ficha de materia](../subject/README.md), [Ficha de cátedra](../chair/README.md), [Ficha de carrera](../career/README.md), [Ficha de institución](../institution/README.md), [Pedir](../../../epics/request-a-career/screens/request/README.md).

## Decisiones que aplica

[ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (los tres estados del vacío salen del gate de cobertura). La cátedra como entidad de la que depende O1-6 la carga BO1-6, en [Sostener el catálogo](../../../epics/sustain-the-catalog/README.md#stories). La garantía de [Que no me molesten](../../../epics/do-not-bother-me/README.md) que se verifica acá: sin cuenta (O6-1).

## Lo que esta ficha deja abierto

- **El orden entre sujetos** cuando una búsqueda devuelve varios tipos a la vez.
- **Búsqueda con errores de tipeo.**
- **Si esta pantalla existe aparte o los resultados aparecen inline en el topbar**: hoy el buscador no lleva a ningún lado.
