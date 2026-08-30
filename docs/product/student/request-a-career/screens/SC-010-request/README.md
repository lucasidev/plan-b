# Pedir (la pantalla)

> Ficha de pantalla, dueña: la épica [Pedir una carrera](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de sus estados; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Pública, sin cuenta: pedir no pide registrarse. Slug hoy: sin slug (no hay implementación en el código todavía).

## Quién la usa

**Ana** (su facultad no está y sospecha del vacío: si no se explica no vuelve; si se explica, empuja para que se cargue). Del otro lado, **Sofía** carga por esta cola ([Sostener el catálogo](../../../../team/sustain-the-catalog/README.md)). El flujo entero: [`flow.md`](../../flow.md).

## Qué stories resuelve

US-140 (dueña: el pedido se manda con el mail y nada más, y entra a la cola cuando ese mail se confirma por link), US-142 (el aviso cuando la carguen, y si te registrás, el pedido precarga institución y carrera), US-139 (el estado del vacío que trae hasta acá: "no la cargamos todavía" no es un cero). La letra de cada una: [README de la épica](../../README.md).

## Qué muestra

Un campo de institución, uno de carrera (cómo se elige o se escribe queda abierto) y el mail. Debajo, el aviso: "te mandamos un link para confirmar; el pedido cuenta cuando lo confirmás; un mail cuenta una vez por carrera" (US-140, D03).

## Estados

- **Mail enviado**: pide confirmar desde ese mail; si no confirmás, el pedido no entra a la cola ni cuenta como reclamo.
- **Confirmado**: "tu pedido cuenta: sos el 23° que la pide", con el link a [La cola](../SC-009-queue/README.md).
- **La carrera ya está cargada**: "está: acá la ficha", sin pedir nada; Explorar y Buscar ya la muestran.
- **El mismo mail ya la pidió**: se le dice que ya cuenta, sin duplicarlo.

## Lo que no muestra nunca

Nada más que institución, carrera y mail: no pide contraseña ni ningún otro dato de cuenta (pedir no es registrarse); ninguna fecha de entrega prometida.

## Adónde va

Al mail de confirmación (el link) y de ahí al estado "el pedido cuenta"; a la ficha de la carrera cuando ya estaba cargada; a [La cola](../SC-009-queue/README.md). Llega desde el vacío explicado en Explorar, Buscar y la Ficha de carrera (US-139).

## Decisiones que aplica

D03 ([registro del 17](../../../../../history/reviews/2026-08-17-catalog-propagation.md): el pedido confirma el mail por link, igual que el reporte; un mail cuenta una vez por carrera), los [tres planos](../../../../map.md#los-tres-planos) del mapa de producto (el pedido es el único plano donde alguien sin cobertura tiene lugar; cuánta gente reclama dice dónde mirar).

## Lo que esta ficha deja abierto

- **Cómo se elige o se escribe la carrera**: texto libre que Sofía interpreta después, o una lista de instituciones conocidas (la épica lo deja abierto; ejemplo del propio README: "la carrera de sistemas de la UTN de acá").
- **Qué pasa con un mail que rebota**: si se le avisa de otra forma o el pedido queda mudo.
- **El copy exacto de los cuatro estados** más allá de lo que muestra el boceto.
