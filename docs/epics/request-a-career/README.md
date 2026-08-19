# Pedir una carrera

> Épica del grupo **O2 · Entender el vacío (cuando lo que busco no está)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Lo que pasa cuando lo que alguien busca no está. El vacío se explica en sus tres estados y ninguno es un cero ("no la cargamos todavía", "cargada y todavía sin voces", "cargada, con voces, todavía no derivamos la cabecera"); se puede pedir la carga sin cuenta, con el mail y nada más, y el pedido cuenta cuando ese mail se confirma por link; la cola es pública y ordenada por pedidos confirmados; y cuando se carga llega el aviso con el link a la ficha, que se lee sin cuenta. Es el único plano donde alguien sin cobertura tiene lugar: el pedido es un dato público, y cuánta gente reclama que se cargue algo dice dónde la comunidad quiere que se mire y no llegamos.

## Para quién

**Ana** (su facultad no está y sospecha del vacío: si no se explica no vuelve; si se explica, empuja para que se cargue). Del otro lado del mostrador, **Sofía**, que carga por pedidos ([Sostener el catálogo](../sustain-the-catalog/README.md)).

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O2-1 | Como quien no está cubierto, quiero saber si el vacío es de ustedes o de mi facultad, para no sospechar del producto. | La ficha distingue tres estados y ninguno es un cero: "no la cargamos todavía", "cargada y todavía sin voces", y "cargada, con voces, todavía no derivamos la cabecera" con su cobertura a la vista. |  |
| O2-2 | Como quien no está cubierto, quiero pedir la carga sin registrarme, porque todavía no me sirve de nada tener cuenta acá. | El pedido se manda con el mail y nada más, y entra a la cola cuando ese mail se confirma por link (la misma regla que el reporte); un mail cuenta una vez por carrera (D03, [registro del 17](../../reviews/2026-08-17-catalog-propagation.md)). |  |
| O2-3 | Como quien no está cubierto, quiero ver cuántos más la pidieron, para saber si tengo alguna chance. | La cola es pública y ordenada por cantidad de pedidos confirmados. |  |
| O2-4 | Como quien no está cubierto, quiero que me avisen cuando la carguen, para no tener que volver a probar cada tanto. | Llega un mail con el link a la ficha ya cargada, que se lee sin cuenta; si decide registrarse, el pedido precarga institución y carrera y no se las vuelve a preguntar. | depende de BO1-3, avisos por mail; par de BO1-3 |

## Decisiones que aplica

D03 ([registro del 17](../../reviews/2026-08-17-catalog-propagation.md): el pedido confirma el mail por link como el reporte; un mail cuenta una vez por carrera), [ADR-0066](../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (los tres estados del vacío salen del gate de cobertura: sin voces, con voces sin cabecera), los tres planos del [mapa](../../design/product-map.md) (el catálogo lo cargamos nosotros, entero o no está; no inventamos una ficha vacía), [Avisos](../notices/README.md) como infraestructura.

## Pantallas que compone

**Pedir** (pública, sin cuenta: solo el mail), **La cola** (pública: cuántos mails confirmados piden cada carrera, cuáles ya están, cuánto se tarda), el vacío explicado en **Explorar**, **Buscar** y la **Ficha de carrera**, el mail de **Avisos** (la cargamos), **Registro** (precargado si viene del pedido). En el backoffice, **Pedidos** (la cola ordenada por cuántos lo pidieron: [Sostener el catálogo](../sustain-the-catalog/README.md)).

## Bocetos

Por dibujar: Pedir (un campo, la confirmación por mail y el estado "tu pedido cuenta"), La cola (la lista pública con el conteo y el tiempo), y el vacío explicado como estado de una ficha.

## Lo que esta épica todavía no resuelve

- **Qué dice La cola sobre el tiempo**: BO4-1 pide "cuánto se tarda en promedio y qué queda afuera del mes, sin fingir"; cómo se calcula y se muestra es diseño de la pantalla.
- **Pedir algo ambiguo** ("la carrera de sistemas de la UTN de acá"): si Pedir ofrece elegir de una lista de instituciones conocidas o acepta texto libre que Sofía interpreta.
- **El pedido de una materia o una cátedra** (no una carrera): hoy el pedido es por carrera; la materia que no está se resuelve reseñándola igual, pendiente de vincular (T3-1, en [Reseñar](../write-a-review/README.md)).
