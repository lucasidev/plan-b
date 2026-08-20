# Responder (la pantalla)

> Ficha de pantalla, dueña: la épica [Replicar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Con identidad verificada (docente o institucional): sin eso no hay campo de respuesta. Sin slug (del inventario).

## Quién la usa

**Claudia** (da bien su materia; le conviene que se publique y le da miedo que se publique). La institución, cuando responde con identidad verificada (el mecanismo todavía no está definido). **Prof. Paredes** nunca entra acá: su silencio se lee en la Ficha de cátedra, no en esta pantalla. El flujo completo: [`flow.md`](../../flow.md).

## Qué stories resuelve

O7-1 (dueña): la réplica se publica al lado del testimonio, con nombre y rol, solo desde identidad verificada; no baja el testimonio ni mueve conteos. O7-8 (sin verificar primero, no hay Responder). T2-2 (el chequeo previo, el plazo, y lo que el autor puede hacer mientras tanto). O7-6 (por qué existe esta pantalla: si nadie la usa, la ficha declara el estado del canal, nunca "no quiso responder"). La letra completa: [README de la épica](../../README.md#stories).

## Qué muestra, paso por paso

1. **El testimonio, a la vista**: período, cátedra, el comentario entre comillas, las frases que marcó. La parte que el autor dejó marcada como identificante se ve resaltada, con el aviso de que la respuesta no la puede citar.
2. **Tu respuesta**: un campo con tope, con el mismo chequeo previo que corre sobre un comentario (T2-2, ADR-0068 punto 5): si cita la parte marcada, se avisa antes de mandarla; si habla de una persona fuera de su acto, queda retenida para que alguien la mire.
3. **El plazo**: al mandarla, la pantalla dice cuándo se publica si nadie hace nada: "se publica el <fecha> si quien lo escribió no lo edita ni lo borra". Nunca dice quién es esa persona.

**Al publicarse**: la respuesta queda al lado del testimonio, con tu nombre, tu rol e "identidad verificada"; no baja el testimonio ni mueve ningún conteo (así se ve en la Ficha de cátedra, no en esta pantalla).

## Estados

- **Identidad no verificada todavía**: en vez del campo de respuesta, un aviso para ir primero a Verificar (BO2-6, O7-8); sin eso no hay Responder.
- **Retenida por el chequeo**: la respuesta habla de alguien fuera de su acto; queda en la cola de Reportes hasta que alguien la mire (BO2-5), y se dice acá.
- **El autor borró el testimonio**: la respuesta que ibas a mandar, o ya mandaste, no se publica: ya no hay a qué responder.
- **Publicada**: se ve cómo queda, igual que en la Ficha de cátedra.

## Lo que no muestra nunca

Quién escribió el testimonio, en ningún estado; un botón para bajar el testimonio o para que la réplica cuente como voto; fecha u hora de cuándo se aportó el testimonio (lo mismo que el resumen al docente tampoco dice, ADR-0068).

## Adónde va

Llega desde el resumen periódico de [Avisos](../../../notices/README.md) o desde la Ficha de cátedra. Si la identidad no está verificada, deriva a Verificar. Publicada, vuelve a la Ficha de cátedra, al lado del testimonio.

## Decisiones que aplica

[ADR-0068](../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 5: la réplica pasa el mismo chequeo, no cita lo marcado, retenida el plazo desde el aviso, solo identidad verificada, queda al lado sin bajar ni mover conteos), D06 ([registro del 17](../../../../reviews/2026-08-17-catalog-propagation.md): el estado del canal, nunca "no quiso responder").

## Lo que esta ficha deja abierto

- **Cuánto dura el plazo**: T2-2 dice "un plazo desde el aviso"; el número falta en toda la épica.
- **Cómo se verifica la identidad institucional**: BO2-6 solo describe la cola del docente contra la cátedra.
- **Qué resuelve "pedir revisión"** cuando el autor lo elige en el plazo: el flujo lo deja sin escribir.
- **Qué pasa con la réplica ya publicada si el testimonio se borra después** del plazo.
