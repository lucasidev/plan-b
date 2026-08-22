# Avisos (la pantalla)

> Ficha de pantalla, dueña: la épica [Avisos](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de los cinco mails y el apagado en Mi perfil; revisada el 2026-08-19 ([registro](../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. No es una pantalla del sitio con cuenta o pública: es el contenido de cinco mails distintos; la sección donde cada uno se apaga vive en Mi perfil, con cuenta. Sin slug.

## Quién la usa

Todos los que reciben un mail: **Ana** (avisan que cargaron lo que pidió), **Lucía** (cerró el período), **Diego y los egresados** (¿te recibiste?), **Claudia** (el resumen de lo que se publicó sobre su cátedra), **quien aportó** (el aviso de que va a salir una réplica, antes de que salga). El flujo completo: [`flow.md`](../../flow.md).

## Qué stories resuelve

No tiene requisitos propios: sostiene US-142, US-193 y US-201 ([Pedir una carrera](../../../request-a-career/README.md#stories) y [Sostener el catálogo](../../../sustain-the-catalog/README.md#stories)), US-149, US-152 y US-156 ([Reseñar](../../../write-a-review/README.md#stories)), US-175 y US-179 ([Replicar](../../../reply/README.md#stories)), US-228 ([Entrar](../../../enter/README.md#stories)), US-169 ([Que no me molesten](../../../do-not-bother-me/README.md#stories)) y US-206 ([Moderar sin romper el producto](../../../moderate-without-breaking-the-product/README.md#stories)). La letra de cada uno vive en su épica; esta pantalla es la infraestructura que los cumple.

## Qué muestra

Cinco mails, cada uno con su asunto, su cuerpo y su acción:

1. **Cerró el período**: nombra una materia concreta para reseñar (US-149), con el link directo a Reseñar.
2. **Cargamos lo que pediste**: el link a la ficha ya cargada, que se lee sin cuenta (US-142, US-193); si te registrás desde acá, institución y carrera quedan precargadas y no se preguntan de nuevo (US-169).
3. **El resumen periódico al docente verificado**: cuántas frases nuevas se marcaron sobre su cátedra, sin fecha ni hora por reseña (US-175): ningún aviso permite inferir cuándo aportó alguien.
4. **Va a salir una réplica sobre tu testimonio**: el plazo con su fecha, y tres salidas desde el mail: editar, borrar o pedir revisión (US-179).
5. **El reenganche anual**: una sola pregunta (¿te recibiste? ¿cuándo?), respondible con un click desde el mail, sin entrar a la app (US-156); responderla la apaga para siempre (US-169), no responderla la vuelve a mandar el año que viene.

Por el mismo canal salen otros dos mails que no son avisos de cuenta y no se apagan: el criterio aplicado al mail de quien reportó (US-206) y el aviso de qué cambió a quienes tienen marcada una oferta corregida (US-201).

**En Mi perfil**: la lista de los cinco; los otros cuatro se prenden y apagan, el aviso de la réplica queda siempre prendido, es la palanca del plazo (protección P1); y el aviso de que lo único que puede volver a ofrecerse es el hecho que nunca se contestó.

## Estados

No aplica en el sentido de vacío, cargando o con error: esta ficha describe el contenido de cinco mails, no una pantalla interactiva. Cada mail llega o no llega; el único lugar con estados propios (prendido, apagado, fijo) es el bloque que se apaga en [Mi perfil](../../../undo/screens/SC-019-my-profile/README.md).

## Lo que no muestra nunca

El mail de confirmación de un pedido o de un reporte (el link que hay que clickear para que ese mail cuente): eso no es un aviso, es la prueba de que el mail existe (D03); vive en Pedir y en Reportar, no acá. Ninguna pregunta que la cuenta ya contestó (US-169). Quién escribió un testimonio, en el resumen al docente.

## Adónde va

Cada mail lleva a su destino: Reseñar, la ficha de la carrera pedida, Responder, Mi situación (desde el reenganche). Todos apuntan también a Mi perfil, donde se apagan.

## Decisiones que aplica

[ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (el reenganche anual, uno de los cuatro caminos para preguntar trayectoria), [ADR-0068](../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el resumen sin fecha ni hora por reseña; el aviso antes de la réplica, con su plazo), [ADR-0040](../../../../decisions/0040-notifications-as-a-new-bounded-context.md) (Notifications como bounded context, infraestructura del primer bloque), D03 ([registro del 17](../../../../history/reviews/2026-08-17-catalog-propagation.md): la confirmación de pedido o de reporte no es un aviso).

## Lo que esta ficha deja abierto

- **La cadencia del resumen al docente**: US-175 dice "periódico", sin fijar semanal, mensual u otra frecuencia.
- **Qué pasa si el mail rebota**: si se reintenta, y si una cuenta con el mail roto queda marcada de alguna forma.
- **Si hay avisos dentro de la app además del mail**: el flujo solo dibuja mail; el panel queda como deuda sin fecha.
