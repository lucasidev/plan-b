# Explorar (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de las dos lentes y los tres estados del vacío; revisión adversarial pendiente antes del hi-fi. Pública, se lee sin cuenta. Slug hoy `/careers`, `/universities` (hoy el browse rico es member-only: se adapta). Épicas que la componen: [Elegir dónde estudiar](../../../epics/choose-where-to-study/README.md) (el home real: dos lentes, carreras y universidades), [Pedir una carrera](../../../epics/request-a-career/README.md) (el vacío explicado, con Pedir al lado).

## Quién la usa

**Valentina** (compara antes de decidir cinco años; si ve un número redondo lo descarta), **Ana** (busca su facultad; si el vacío no se explica acá, ya sospechó del producto), **Silvia** (entra a mirar la carrera de su hija sin saber de planes ni correlativas), y quien lee, sin cuenta, en general.

## Qué stories resuelve

[O6-4](../../../epics/do-not-bother-me/README.md#stories) (nunca un puntaje ni un orden por conveniencia; alfabético o por voces), [O2-1](../../../epics/request-a-career/README.md#stories) (el vacío se explica en tres estados y ninguno es un cero), [O6-1](../../../epics/do-not-bother-me/README.md#stories) (sin cuenta).

## Qué muestra

1. **Dos lentes**: Carreras / Universidades. Cuál abre por default queda abierto.
2. **Cada entrada con lo mínimo honesto**: nombre, la institución si es una carrera, sus voces y su cobertura. Nunca un puntaje ni un orden por conveniencia (O6-4): el orden es alfabético o por voces.
3. **El vacío en sus tres estados** (O2-1), ninguno es un cero:
   - **"No la cargamos todavía"**: no existe en el catálogo. Con el link a Pedir al lado.
   - **"Cargada y todavía sin voces"**: existe, nadie reseñó todavía.
   - **"Cargada, todavía no derivamos"**: tiene voces pero no pasó la mitad de las materias canónicas; se ve la cobertura a la vista ("22 de 40 materias con voces").
4. **Sin cuenta** (O6-1): explorar y abrir cualquier ficha desde acá no pide login.

## Lo que no muestra nunca

Ranking, puntaje ni orden por conveniencia (O6-4); ninguna institución patrocinada, destacada ni remarcada; ninguna entrada mostrada como un cero cuando en realidad está cargada sin voces o cargada sin cabecera todavía (O2-1).

## Adónde va

Llega desde: [Inicio](../home/README.md), un link, o vuelve desde [Buscar](../search/README.md). Va a: [Ficha de carrera](../career/README.md), [Ficha de institución](../institution/README.md), [Dónde estudiarla](../../../epics/choose-where-to-study/screens/where-to-study/README.md), [Pedir](../../../epics/request-a-career/screens/request/README.md), [Buscar](../search/README.md).

## Decisiones que aplica

[ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (los tres estados del vacío salen del gate de cobertura: sin voces, con voces y sin cabecera), [ADR-0064](../../../decisions/0064-phrases-with-voices-not-scores.md) (lo mínimo honesto es voces y cobertura, nunca un puntaje). Las garantías de [Que no me molesten](../../../epics/do-not-bother-me/README.md) que se verifican acá: sin cuenta (O6-1), sin orden por conveniencia (O6-4).

## Lo que esta ficha deja abierto

- **El default de orden.**
- **Si hay filtros** (provincia, modalidad) **y cuáles.**
- **Qué lente abre por default**, Carreras o Universidades: ninguna fuente lo fija.
