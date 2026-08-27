# Responder (la pantalla)

> Ficha de pantalla, dueña: la épica [Responder](../../README.md). **Estado**: cuerpo reescrito el 2026-08-26 al modelo de [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (no existe testimonio ni chequeo previo ni plazo de retención: la respuesta apunta a los números agregados de la ficha y se publica al mandarla). **El [boceto](sketch.html) todavía dibuja el modelo anterior** (responder a un testimonio puntual, con la parte marcada como no citable, un chequeo previo y un plazo de retención antes de publicarse): queda desactualizado hasta su propio rehecho; esta pasada corrige vocabulario y afirmaciones en el texto, no el boceto. Con identidad verificada (docente o institucional): sin eso no hay campo de respuesta. Sin slug.

## Quién la usa

**Claudia** (da bien su materia; le conviene que se publique y le da miedo que se publique). La institución, con identidad verificada sobre un cargo normalizado. **Prof. Paredes** nunca entra acá: su silencio se lee en la Ficha de cátedra, no en esta pantalla. El flujo completo: [`flow.md`](../../flow.md).

## Qué stories resuelve

US-172 (dueña): la respuesta se publica al mandarla, con nombre y rol (o cargo), solo desde identidad verificada; no mueve ningún conteo. US-178 (sin verificar primero, no hay Responder). US-176 (por qué existe esta pantalla incluso cuando nadie la usa: si nadie respondió, la ficha declara el estado del canal, nunca "no quiso responder"). [US-227](../../stories/US-227-claim-an-institutional-position-to-reply/README.md) (sin cargo verificado no hay campo de respuesta, y la respuesta se firma con nombre y cargo). US-210 (de [Moderar sin romper el producto](../../../../team/moderate-without-breaking-the-product/README.md): sin identidad docente verificada, en vez del campo de respuesta hay un aviso para ir primero a Verificar). La letra completa: [README de la épica](../../README.md#stories).

## Qué muestra

1. **Los números a los que se responde**: los conteos ya publicados de la ficha (moda y distribución por ítem, la comparación con las hermanas si la hay), a la vista mientras se escribe. No hay ningún comentario ni testimonio individual que mostrar: no existe ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)).
2. **Tu respuesta**: un campo con tope. Se publica apenas se manda: no hay chequeo previo ni plazo de retención, porque no hay ningún testimonio que citar ni ningún autor anónimo que proteger.

**Al publicarse**: la respuesta queda en la ficha con tu nombre, tu rol o cargo, "identidad verificada" y la fecha; no mueve ningún conteo (así se ve en la Ficha de cátedra, no en esta pantalla).

## Estados

- **Identidad no verificada todavía**: en vez del campo de respuesta, un aviso para ir primero a Verificar (US-178, US-227); sin eso no hay Responder.
- **Publicada**: se ve cómo queda, igual que en la ficha correspondiente.

## Lo que no muestra nunca

Ningún testimonio ni comentario individual al que responder, en ningún estado: no existe ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)); un botón para bajar o mover ningún conteo, ni para que la respuesta cuente como voto; fecha u hora de cuándo se cargó cada reseña.

## Adónde va

Llega desde la Ficha de cátedra o de institución (o desde un aviso, cuyo disparador exacto es un hueco declarado en el README de la épica). Si la identidad no está verificada, deriva a Verificar. Publicada, vuelve a la ficha correspondiente.

## Decisiones que aplica

[ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el texto libre no se publica nunca: no hay testimonio al que responder, ni chequeo previo, ni plazo), D06 ([registro del 17](../../../../../history/reviews/2026-08-17-catalog-propagation.md): el estado del canal, nunca "no quiso responder").

## Lo que esta ficha deja abierto

- **El layout completo de esta pantalla**: el boceto vigente todavía dibuja el modelo anterior (pasos con testimonio, chequeo y plazo); esta ficha corrige vocabulario y afirmaciones en el texto, no el boceto, que espera su propio rehecho.
- **Si hay un tope de longitud para la respuesta.**
- **Qué evento dispara el aviso que deja la fecha en "avisada el [fecha]"**: hueco declarado en el README de la épica.
