# Avisos

> Épica **infraestructura transversal** del [catálogo](../README.md): no tiene requisitos propios, sostiene US-142, US-149, US-156, US-193 y US-201. **Estado**: reescrita el 2026-08-26 al modelo de [ADR-0084](../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (no existe testimonio ni réplica a un testimonio: el resumen al reseñado pasa a avisar que su ficha juntó reseñas nuevas, y el mail que retenía la respuesta hasta que el autor de un testimonio pudiera reaccionar se retira, porque no hay autor individual que proteger); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

No es una épica con requisitos propios: es la infraestructura que otras épicas necesitan para cumplir su promesa. Cuatro caminos de mail sostienen otros tantos requisitos: el aviso al cerrar el período (US-149), el aviso de que se cargó lo que alguien pidió (US-142, US-193), el aviso al reseñado de que su ficha juntó reseñas nuevas (deja la fecha en "avisada el [fecha]" del estado del canal de [Responder](../reviewed/reply/README.md); qué story lo dispara es un hueco declarado, ver abajo) y el reenganche anual a cuentas inactivas (US-156). Por el mismo canal sale otro mail que no es aviso de cuenta y no se apaga: el aviso de qué cambió a quienes declararon la carrera de una oferta corregida (US-201). Por eso el mapa la pasó de "diseñada, sin construir" a infraestructura del primer bloque el 2026-08-16 (hallazgo [M05 del registro del mapa](../../history/reviews/2026-08-16-product-map.md) y [ADR-0040](../../decisions/0040-notifications-as-a-new-bounded-context.md)).

El mail que retenía la respuesta hasta que el autor de un testimonio pudiera editarlo, borrarlo o pedir revisión (antes US-179) se retiró con el viraje a [ADR-0084](../../decisions/0084-free-text-feeds-curation-and-is-never-published.md): sin testimonio individual al que responder, no hay a quién avisar antes de publicar, y la respuesta se publica directo.

Arranca solo por mail, que es lo que el mapa dibuja; si hace falta un panel de avisos dentro de la app es una pregunta abierta, no una decisión. Todo lo que llega se apaga desde un solo lugar, Mi perfil. Nada se pregunta dos veces: lo único que puede volver a ofrecerse es el hecho que nunca se respondió, y responderlo lo apaga para siempre.

## Para quién

Todos los que reciben un mail: **Ana** (avisan que cargaron lo que pidió), **Lucía** (cerró el período), **Diego y los egresados** (¿te recibiste?), **Claudia** (el aviso de que su ficha juntó reseñas nuevas). Del lado de adentro, **Sofía** (avisa a los que esperaban cuando termina de cargar).

## Requisitos

No tiene requisitos propios: sostiene [US-142](../student/request-a-career/README.md) y [US-193](../team/sustain-the-catalog/README.md) (el aviso cuando cargan lo pedido), [US-149](../student/write-a-review/README.md) (el aviso al cerrar el período), [US-156](../student/write-a-review/README.md) (el reenganche anual) y el aviso al reseñado de [Responder](../reviewed/reply/README.md) (qué story lo dispara es un hueco declarado, ver "Lo que esta épica todavía no resuelve"). Cada uno vive en su épica; esta carpeta es la infraestructura que los cumple.

## Decisiones que aplica

[ADR-0084](../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (no existe el aviso previo a una respuesta, porque no hay testimonio individual al que responder), [ADR-0040](../../decisions/0040-notifications-as-a-new-bounded-context.md) y [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md) (Notifications como bounded context, revalidado como infraestructura del primer bloque), D03 ([registro del 17](../../history/reviews/2026-08-17-catalog-propagation.md): el pedido confirma el mail por link para poder contarse; es una prueba de que ese mail existe, no un aviso de que algo pasó, y por eso no vive en esta infraestructura). El reenganche anual por mail, con una sola pregunta respondible sin entrar a la app, es regla del producto y hoy no la fija ningún ADR vigente.

Además, regla propia de esta infraestructura: el aviso al reseñado no dice fecha ni hora por reseña, porque ningún aviso puede permitir inferir cuándo aportó alguien.

## Pantallas

La que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Avisos**](screens/SC-034-mail/README.md) (los mails; no es una pantalla del sitio con cuenta o pública): cerró el período, cargamos lo que pediste, tu ficha juntó reseñas nuevas, el reenganche anual; [boceto mid-fi](screens/SC-034-mail/sketch.html), con el apagado en Mi perfil.

Sus destinos son pantallas de otras épicas: [Reseñar](../student/write-a-review/README.md) y [Mi situación](../student/write-a-review/screens/SC-014-my-status/README.md) (las dos de Reseñar), [Responder](../reviewed/reply/README.md) y [Registro](../student/enter/screens/SC-026-sign-up/README.md) (cuando alguien se registra por primera vez desde "cargamos lo que pediste"). Donde cada aviso se apaga, [**Mi perfil**](../student/undo/screens/SC-019-my-profile/README.md).

## Lo que esta épica todavía no resuelve

- **Qué evento dispara el aviso al reseñado**: la story que lo explicaba (el resumen periódico al docente, antes US-175) se retiró con el viraje a este modelo; falta decidir qué evento o cadencia genera ese mail y la fecha de "avisada el [fecha]".
- **Qué pasa si el mail rebota**: si se reintenta, y si una cuenta con el mail roto queda marcada de alguna forma.
- **Si hay avisos dentro de la app además del mail**: el mapa solo dibuja mail; el panel en la app queda como deuda explícita, sin fecha.
