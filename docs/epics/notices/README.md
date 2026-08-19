# Avisos

> Épica **infraestructura transversal** del [catálogo](../../domain/user-stories.md): no tiene stories propias, sostiene O2-4, O4-5, O4-12, O7-5, BO1-3 y T2-2. **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y su pantalla propia con ficha y boceto mid-fi ([Avisos](screens/mail/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

No es una épica con stories propias: es la infraestructura que otras cuatro épicas necesitan para cumplir su promesa. Cinco caminos de mail sostienen otras tantas stories: el aviso al cerrar el período (O4-5), el aviso de que se cargó lo que alguien pidió (O2-4, BO1-3), el resumen periódico al docente verificado (O7-5), el aviso al autor de un testimonio antes de que salga la réplica (T2-2) y el reenganche anual a cuentas inactivas (O4-12): sostiene seis stories de cinco épicas. Por el mismo canal salen otros dos mails que no son avisos de cuenta y no se apagan: el criterio aplicado al mail de quien reportó (BO2-2) y el aviso de qué cambió a quienes tienen marcada una oferta corregida (BO4-2). Por eso el mapa la pasó de "diseñada, sin construir" a infraestructura del primer bloque el 2026-08-16 (hallazgo [M05 del registro del mapa](../../reviews/2026-08-16-product-map.md) y [ADR-0040](../../decisions/0040-notifications-como-bounded-context.md)): T2-2 es P1 de la promesa central (quien aportó se entera antes de que se publique la réplica), y esa promesa no se cumple sin un canal de aviso.

Arranca solo por mail, que es lo que el mapa dibuja; si hace falta un panel de avisos dentro de la app es una pregunta abierta, no una decisión. Todo lo que llega se apaga desde un solo lugar, Mi perfil, salvo el aviso de la réplica: apagarlo dejaría salir la réplica sin que el autor pueda editar ni borrar. Nada se pregunta dos veces: lo único que puede volver a ofrecerse es el hecho que nunca se respondió, y responderlo lo apaga para siempre.

## Para quién

Todos los que reciben un mail: **Ana** (avisan que cargaron lo que pidió), **Lucía** (cerró el período), **Diego y los egresados** (¿te recibiste?), **Claudia** (el resumen de lo que se publicó sobre su cátedra), **quien aportó** (el aviso de que va a salir una réplica, antes de que salga). Del lado de adentro, **Sofía** (avisa a los que esperaban cuando termina de cargar).

## Stories

No tiene stories propias: sostiene [O2-4](../request-a-career/README.md) y [BO1-3](../sustain-the-catalog/README.md) (el aviso cuando cargan lo pedido), [O4-5](../write-a-review/README.md) (el aviso al cerrar el período), [O4-12](../write-a-review/README.md) (el reenganche anual), [O7-5](../reply/README.md) (el resumen al docente) y [T2-2](../reply/README.md) (el aviso al autor antes de la réplica). Cada una vive en su épica; esta carpeta es la infraestructura que las cumple.

## Decisiones que aplica

[ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (el reenganche anual por mail, una sola pregunta respondible sin entrar a la app, es uno de los cuatro caminos para preguntar si te recibiste o te fuiste), [ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el resumen al docente sin fecha ni hora por reseña: ningún aviso permite inferir cuándo aportó alguien; el aviso al autor antes de que salga la réplica, con su plazo), [ADR-0040](../../decisions/0040-notifications-como-bounded-context.md) y [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md) (Notifications como bounded context, revalidado como infraestructura del primer bloque: sostiene cinco stories del producto nuevo aunque arranque solo por mail), D03 ([registro del 17](../../reviews/2026-08-17-catalog-propagation.md): el pedido y el reporte confirman el mail por link para poder contarse; es una prueba de que ese mail existe, no un aviso de que algo pasó, y por eso no vive en esta infraestructura).

## Pantallas

La que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Avisos**](screens/mail/README.md) (los cinco mails; no es una pantalla del sitio con cuenta o pública): cerró el período, cargamos lo que pediste, el resumen al docente, el aviso antes de la réplica, el reenganche anual; [boceto mid-fi](screens/mail/sketch.html), con los cinco y el apagado en Mi perfil.

Sus destinos son pantallas de otras épicas: [Reseñar](../write-a-review/README.md) y [Mi situación](../write-a-review/screens/my-status/README.md) (las dos de Reseñar), [Responder](../reply/README.md) (de Replicar) y Empezar (de Mi carrera, cuando alguien se registra por primera vez desde "cargamos lo que pediste"). Donde cada aviso se apaga, **Mi perfil**, vive en [`docs/design/screens/`](../../design/screens/README.md).

## Lo que esta épica todavía no resuelve

- **La cadencia del resumen al docente**: O7-5 dice "periódico" y no fija si es semanal, mensual o de otra frecuencia.
- **Qué pasa si el mail rebota**: si se reintenta, y si una cuenta con el mail roto queda marcada de alguna forma.
- **Si hay avisos dentro de la app además del mail**: el mapa solo dibuja mail; el panel en la app queda como deuda explícita, sin fecha.
