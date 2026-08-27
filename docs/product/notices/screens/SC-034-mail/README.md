# Avisos (la pantalla)

> Ficha de pantalla, dueña: la épica [Avisos](../../README.md). **Estado**: cuerpo reescrito el 2026-08-26 al modelo de [ADR-0084](../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md): el mail 4 (aviso antes de que salga una respuesta sobre un testimonio) se retira, porque no existe testimonio individual al que responder ni autor que proteger con un plazo; el resumen al docente pasa a avisar que su ficha juntó reseñas nuevas. **El [boceto](sketch.html) todavía dibuja los cinco mails del modelo anterior** (incluido el mail 4 y las líneas "Frases marcadas" y "Testimonios nuevos" del mail 3) y queda pendiente de su propio rehecho. No es una pantalla del sitio con cuenta o pública: es el contenido de varios mails distintos; la sección donde cada uno se apaga vive en Mi perfil, con cuenta. Sin slug.

## Quién la usa

Todos los que reciben un mail: **Ana** (avisan que cargaron lo que pidió), **Lucía** (cerró el período), **Diego y los egresados** (¿te recibiste?), **Claudia** (el aviso de que su ficha juntó reseñas nuevas). El flujo completo: [`flow.md`](../../flow.md).

## Qué stories resuelve

No tiene requisitos propios: sostiene US-142, US-193 y US-201 ([Pedir una carrera](../../../student/request-a-career/README.md#stories) y [Sostener el catálogo](../../../team/sustain-the-catalog/README.md#stories)), US-149, US-152 y US-156 ([Reseñar](../../../student/write-a-review/README.md#stories)), US-228 ([Entrar](../../../student/enter/README.md#stories)) y US-169 ([Que no me molesten](../../../guarantees/README.md#stories)). El aviso al reseñado (que su ficha juntó reseñas nuevas, la fecha que queda en "avisada el [fecha]" del estado del canal de [Responder](../../../reviewed/reply/README.md)) no tiene story dueña hoy: hueco declarado, ver el README de la épica. La letra de cada uno vive en su épica; esta pantalla es la infraestructura que los cumple.

## Qué muestra

Los mails, cada uno con su asunto, su cuerpo y su acción:

1. **Cerró el período**: nombra una materia concreta para reseñar (US-149), con el link directo a Reseñar.
2. **Cargamos lo que pediste**: el link a la ficha ya cargada, que se lee sin cuenta (US-142, US-193); si te registrás desde acá, institución y carrera quedan precargadas y no se preguntan de nuevo (US-169).
3. **Tu ficha juntó reseñas nuevas**: al reseñado (docente o institución con identidad verificada) le avisa que hay conteos nuevos publicados sobre su ficha, sin fecha ni hora por reseña: ningún aviso permite inferir cuándo aportó alguien.
4. **El reenganche anual**: una sola pregunta (¿te recibiste? ¿cuándo?), respondible con un click desde el mail, sin entrar a la app (US-156); responderla la apaga para siempre (US-169), no responderla la vuelve a mandar el año que viene.

Por el mismo canal sale otro mail que no es aviso de cuenta y no se apaga: el aviso de qué cambió a quienes tienen marcada una oferta corregida (US-201).

**En Mi perfil**: la lista de los mails de cuenta, que se prenden y apagan; y el aviso de que lo único que puede volver a ofrecerse es el hecho que nunca se contestó.

## Estados

No aplica en el sentido de vacío, cargando o con error: esta ficha describe el contenido de varios mails, no una pantalla interactiva. Cada mail llega o no llega; el único lugar con estados propios (prendido, apagado) es el bloque que se apaga en [Mi perfil](../../../student/undo/screens/SC-019-my-profile/README.md).

## Lo que no muestra nunca

El mail de confirmación de un pedido (el link que hay que clickear para que ese mail cuente): eso no es un aviso, es la prueba de que el mail existe (D03); vive en Pedir, no acá. Ninguna pregunta que la cuenta ya contestó (US-169). Nada del campo libre de nadie, ni quién escribió qué, en ningún mail: el campo libre no se publica ([ADR-0084](../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)).

## Adónde va

Cada mail lleva a su destino: Reseñar, la ficha de la carrera pedida, Responder, Mi situación (desde el reenganche). Todos apuntan también a Mi perfil, donde se apagan.

## Decisiones que aplica

[ADR-0084](../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (no existe el aviso previo a una respuesta, porque no hay testimonio individual al que responder ni autor que proteger con un plazo), [ADR-0040](../../../../decisions/0040-notifications-as-a-new-bounded-context.md) (Notifications como bounded context, infraestructura del primer bloque), D03 ([registro del 17](../../../../history/reviews/2026-08-17-catalog-propagation.md): la confirmación de pedido no es un aviso). El reenganche anual, uno de los caminos para preguntar trayectoria, es regla del producto y hoy no la fija ningún ADR vigente.

## Lo que esta ficha deja abierto

- **Qué evento o cadencia dispara el aviso al reseñado**: la story que lo explicaba (el resumen periódico al docente, antes US-175) se retiró con este viraje.
- **Qué pasa si el mail rebota**: si se reintenta, y si una cuenta con el mail roto queda marcada de alguna forma.
- **Si hay avisos dentro de la app además del mail**: el flujo solo dibuja mail; el panel queda como deuda sin fecha.
