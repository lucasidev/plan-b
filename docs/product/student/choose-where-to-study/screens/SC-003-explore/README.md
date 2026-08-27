# Explorar (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de las dos lentes y los tres estados del vacío; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública, se lee sin cuenta. Slug hoy `/universities` (la lente de carreras no existe todavía; hoy el browse rico es member-only: se adapta). Épicas que la componen: [Elegir dónde estudiar](../../README.md) (el home real: dos lentes, carreras y universidades), [Pedir una carrera](../../../request-a-career/README.md) (el vacío explicado, con Pedir al lado).

## Quién la usa

**Valentina** (compara antes de decidir cinco años; si ve un número redondo lo descarta), **Ana** (busca su facultad; si el vacío no se explica acá, ya sospechó del producto), **Silvia** (entra a mirar la carrera de su hija sin saber de planes ni correlativas), y quien lee, sin cuenta, en general.

## Qué stories resuelve

[US-171](../../../../guarantees/README.md#stories) (nunca un puntaje ni un orden por conveniencia; alfabético o por voces), [US-139](../../../request-a-career/README.md#stories) (el vacío se explica en tres estados y ninguno es un cero), [US-168](../../../../guarantees/README.md#stories) (sin cuenta).


[US-222](../../stories/US-222-browse-what-there-is-to-study/README.md) (la razón de que esta pantalla exista: ver qué hay para estudiar sin tener un nombre que buscar).
## Qué muestra

1. **Dos lentes**: Carreras / Universidades. Cuál abre por default queda abierto.
2. **Cada entrada con lo mínimo honesto**: nombre, la institución si es una carrera, sus voces y su cobertura. Nunca un puntaje ni un orden por conveniencia (US-171): el orden es alfabético o por voces.
3. **Sin cuenta** (US-168): explorar y abrir cualquier ficha desde acá no pide login.

## Estados

El vacío en sus tres estados (US-139), ninguno es un cero:
- **"No la cargamos todavía"**: no existe en el catálogo. Con el link a Pedir al lado.
- **"Cargada y todavía sin voces"**: existe, nadie reseñó todavía.
- **"Cargada, con cobertura parcial"**: tiene voces, pero todavía mide una parte de sus materias o cátedras; se ve la cobertura real a la vista ("22 de 40 materias con voces"), sin ocultar lo que ya se puede sostener.

## Lo que no muestra nunca

Ranking, puntaje ni orden por conveniencia (US-171); ninguna institución patrocinada, destacada ni remarcada; ninguna entrada mostrada como un cero cuando en realidad está cargada sin voces o cargada con cobertura parcial (US-139).

## Adónde va

Llega desde: [Inicio](../SC-004-home/README.md), un link, o vuelve desde [Buscar](../SC-006-search/README.md). Va a: [Ficha de carrera](../SC-001-career/README.md), [Ficha de institución](../../../../reviewed/reply/screens/SC-005-institution/README.md), [Dónde estudiarla](../SC-008-where-to-study/README.md), [Pedir](../../../request-a-career/screens/SC-010-request/README.md), [Buscar](../SC-006-search/README.md).

## Decisiones que aplica

[ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (los tres estados del vacío: sin voces, con voces y con cobertura parcial siempre a la vista, nunca oculta detrás de un umbral), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (lo mínimo honesto es voces y cobertura, nunca un puntaje). Las garantías de [Que no me molesten](../../../../guarantees/README.md) que se verifican acá: sin cuenta (US-168), sin orden por conveniencia (US-171).

## Lo que esta ficha deja abierto

- **El default de orden.**
- **Si hay filtros** (provincia, modalidad) **y cuáles.**
- **Qué lente abre por default**, Carreras o Universidades: ninguna fuente lo fija.
