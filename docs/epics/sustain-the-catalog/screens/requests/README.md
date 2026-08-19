# Pedidos (la pantalla)

> Ficha de pantalla, dueña: la épica [Sostener el catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisión adversarial pendiente antes del hi-fi. Backoffice, rol catálogo (hoy Sofía). Sin slug hoy: el endpoint de la cola existe, la pantalla no (del inventario).

## Quién la usa

**Sofía** (carga el catálogo por prioridad, no por orden de llegada: necesita ver los huecos antes que los logros y avisar a quien esperaba cuando termina). El rol catálogo no llega a las colas de moderación ni de verificación, ni por acceso directo (BO3-1, [Cortar los accesos](../../../cut-the-access/README.md)). El flujo entero, con la cola cuando desborda: [`flow.md`](../../flow.md).

## Qué stories resuelve

BO1-2 (dueña: la cola se ordena por cuántos lo pidieron y muestra la institución de origen), BO4-1 (cuánto se tarda en promedio y qué queda afuera del mes, sin fingir que se resuelve todo), BO4-5 (el primer día, sin pedidos, arranca con un criterio explícito), BO1-3 (marcar una oferta como cargada dispara el aviso a todos los que la pidieron). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra

Una lista ordenada por pedidos confirmados, nunca por orden de llegada (BO1-2): cada fila es una carrera pedida, con su institución de origen, cuántos mails confirmados la piden y hace cuánto está en la cola. Arriba, dos números que se muestran siempre: cuánto se tarda en promedio en cargar una oferta desde que entra a la cola, y qué queda afuera del mes al ritmo actual (BO4-1). Cada fila abre esa oferta en [Catálogo](../catalog/README.md); terminada la carga, "Marcar como cargada" dispara el aviso a todos los que la pidieron y saca la fila de la cola (BO1-3).

**Estado "vacía, primer día"**: sin pedidos todavía, la cola no se queda esperando demanda: muestra el criterio explícito de arranque (BO4-5; el boceto lo ejemplifica, la épica todavía no decidió cuál es). **Estado "doscientos pendientes"**: la lista no se trunca, se pagina entera, y los dos números de arriba siguen la cuenta de lo que no entra en el mes.

## Lo que no muestra nunca

Los mails ni ningún otro dato de quienes pidieron (solo el conteo y la institución de la carrera pedida); un pedido que no confirmó el mail por link, ese no cuenta (D03); una fecha puntual prometida por fila, el número de arriba es un promedio, no un compromiso.

## Adónde va

Cada fila abre [Catálogo](../catalog/README.md) para cargar esa oferta. "Marcar como cargada" dispara el mail de [Avisos](../../../notices/README.md) y actualiza **La cola**, la vista pública de los mismos pedidos confirmados sin el detalle operativo (sin ficha propia todavía; vive en [Pedir una carrera](../../../request-a-career/README.md)). El pedido nace en **Pedir**, sin ficha propia todavía, de la misma épica.

## Decisiones que aplica

Los tres planos del [mapa de producto](../../../../design/product-map.md) (el catálogo lo cargamos nosotros, a mano y completo; una carrera está cargada entera o no está), D03 ([registro del 17](../../../../reviews/2026-08-17-catalog-propagation.md): el pedido cuenta cuando el mail se confirma por link).

## Lo que esta ficha deja abierto

- **Cómo se calcula "cuánto se tarda en promedio"** (sobre qué ventana) y **qué pasa con lo que queda afuera del mes**: si se avisa a quien pidió o alcanza con que la pantalla lo muestre (BO4-1, abierto también en el README de la épica).
- **El criterio de arranque del primer día**: si es una lista escrita (las carreras del equipo, las más pedidas en otro lado) o una decisión que se toma cada vez (BO4-5); el boceto muestra un ejemplo, no una decisión tomada.
- **Si la cola se puede reordenar a mano** (adelantar una carrera con pocos pedidos pero urgente) o el orden por cantidad es siempre estricto.
