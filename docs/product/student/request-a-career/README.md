# Pedir una carrera

> Épica del grupo **O2 · Entender el vacío (cuando lo que busco no está)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y sus pantallas propias con ficha y boceto mid-fi (Pedir, La cola); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Lo que pasa cuando lo que alguien busca no está. El vacío se explica en sus tres estados y ninguno es un cero ("no la cargamos todavía", "cargada y todavía sin voces", "cargada, con voces, todavía no derivamos la cabecera"); se puede pedir la carga sin cuenta, con el mail y nada más, y el pedido cuenta cuando ese mail se confirma por link; la cola es pública y ordenada por pedidos confirmados; y cuando se carga llega el aviso con el link a la ficha, que se lee sin cuenta. Es el único plano donde alguien sin cobertura tiene lugar: el pedido es un dato público, y cuánta gente reclama que se cargue algo dice dónde la comunidad quiere que se mire y no llegamos.

## Para quién

**Ana** (su facultad no está y sospecha del vacío: si no se explica no vuelve; si se explica, empuja para que se cargue). Del otro lado del mostrador, **Sofía**, que carga por pedidos ([Sostener el catálogo](../../team/sustain-the-catalog/README.md)).

## Stories

Las 4 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-139](stories/US-139-tell-apart-the-three-empty-states/README.md) | Distinguir si el vacío es del producto o de la facultad |
| [US-140](stories/US-140-request-a-career-without-an-account/README.md) | Pedir la carga de una carrera sin registrarse |
| [US-141](stories/US-141-see-how-many-others-asked/README.md) | Ver cuántos más pidieron la misma carrera |
| [US-142](stories/US-142-get-notified-when-its-loaded/README.md) | Recibir el aviso cuando la carguen |


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

D03 ([registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md): el pedido confirma el mail por link como el reporte; un mail cuenta una vez por carrera), [ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (los tres estados del vacío salen del gate de cobertura: sin voces, con voces sin cabecera), los tres planos del [mapa](../../map.md) (el catálogo lo cargamos nosotros, entero o no está; no inventamos una ficha vacía), [Avisos](../../notices/README.md) como infraestructura.

## Pantallas

Las dos que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Pedir**](screens/SC-010-request/README.md) (pública, sin cuenta): el mail y la carrera, la confirmación por link y el pedido que cuenta; [boceto mid-fi](screens/SC-010-request/sketch.html) de sus estados.
- [**La cola**](screens/SC-009-queue/README.md) (pública): qué falta cargar, ordenada por pedidos confirmados, cuánto se tarda; [boceto mid-fi](screens/SC-009-queue/sketch.html) de sus estados.

Las que comparte con otras épicas: el vacío explicado en [**Explorar**](../choose-where-to-study/screens/SC-003-explore/README.md), [**Buscar**](../choose-where-to-study/screens/SC-006-search/README.md) y la [**Ficha de carrera**](../choose-where-to-study/screens/SC-001-career/README.md), y [**Registro**](../enter/screens/SC-026-sign-up/README.md) (precargado si viene del pedido). El mail de **Avisos** (la cargamos) y, en el backoffice, **Pedidos** (la cola ordenada por cuántos lo pidieron), viven cada uno en la épica que los tiene por dueña.

## Lo que esta épica todavía no resuelve

- **Qué dice La cola sobre el tiempo**: US-200 pide "cuánto se tarda en promedio y qué queda afuera del mes, sin fingir"; cómo se calcula y se muestra es diseño de la pantalla.
- **Pedir algo ambiguo** ("la carrera de sistemas de la UTN de acá"): si Pedir ofrece elegir de una lista de instituciones conocidas o acepta texto libre que Sofía interpreta.
- **El pedido de una materia o una cátedra** (no una carrera): hoy el pedido es por carrera; la materia que no está se resuelve reseñándola igual, pendiente de vincular (US-160, en [Reseñar](../write-a-review/README.md)).
