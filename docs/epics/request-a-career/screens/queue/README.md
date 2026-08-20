# La cola (la pantalla)

> Ficha de pantalla, dueña: la épica [Pedir una carrera](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de sus estados; revisada el 2026-08-19 ([registro](../../../../reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Pública: se lee sin cuenta. Slug hoy: sin slug.

## Quién la usa

**Ana** (para saber si tiene alguna chance: cuánta gente más pidió lo mismo), **Rocío** (qué carreras están en cola, parte de lo que declara antes de citar un número). Del otro lado, **Sofía** carga por esta misma cola ([Sostener el catálogo](../../../sustain-the-catalog/README.md)). El flujo entero: [`flow.md`](../../flow.md).

## Qué stories resuelve

O2-3 (dueña: pública, ordenada por cantidad de pedidos confirmados), O2-4 (par: cuando una carrera se carga, el aviso sale a los que la pidieron), BO4-1 (cuánto se tarda en promedio y qué queda afuera del mes, sin fingir que se resuelve todo), BO4-5 (el criterio de arranque cuando todavía no hay pedidos), O8-2 (qué carreras están cargadas, en cola y pedidas: parte de lo que Rocío necesita declarado antes de citar un número). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra

La lista de carreras pedidas, ordenada por pedidos confirmados: institución, carrera, cuántos la pidieron. Las que ya se cargaron aparecen con el link a su ficha en lugar del conteo. Arriba, cuánto se tarda en promedio en cargar una carrera pedida y qué queda afuera del mes, dicho sin fingir que se resuelve todo (BO4-1).

**Estados**:
- **Cola vacía, primer día**: sin pedidos todavía; se explica el criterio con el que se carga igual (BO4-5).
- **Una carrera recién cargada**: pasa de la lista de pedidos a "ya está", con el link a la ficha.

## Lo que no muestra nunca

Quién pidió cada carrera (el mail no se publica, solo el conteo); ninguna fecha de entrega prometida para una carrera puntual.

## Adónde va

A la ficha de la carrera ya cargada; a [Pedir](../request/README.md) si todavía no la pediste. Llega desde el vacío explicado en Explorar, Buscar y la Ficha de carrera, y desde Pedir, después de confirmar el mail.

## Decisiones que aplica

[ADR-0066](../../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (nunca un cero: la cola explica el vacío en vez de mostrarlo vacío), los [tres planos](../../../../design/product-map.md#los-tres-planos) del mapa de producto (el pedido es un dato público; cuánta gente reclama dice dónde mirar).

## Lo que esta ficha deja abierto

- **Cómo se calcula "cuánto se tarda"**: sobre qué ventana se promedia (BO4-1 lo deja como diseño de esta pantalla).
- **Si se le avisa a quien pidió algo que queda afuera del mes**, o alcanza con que la cola lo muestre.
- **El copy exacto del criterio de arranque** el primer día (BO4-5).
