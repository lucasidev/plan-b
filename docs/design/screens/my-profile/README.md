# Mi perfil (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la cuenta y sus estados; revisión adversarial pendiente antes del hi-fi. Con cuenta: la propia. Slug hoy `/my-profile` (del inventario). Épicas que la componen: [Avisos](../../../epics/notices/README.md) (dónde se apaga cada mail), [Deshacer](../../../epics/undo/README.md) (la puerta a Baja), [Cuidar lo publicado](../../../epics/care-for-what-is-published/README.md) (la señal de verificado).

## Quién la usa

Cualquier cuenta que quiere ver su mail y su situación, apagar un aviso, verificarse, o irse: **Matías**, **Lucía**, **Diego**, **Claudia**.

## Qué stories resuelve

[T1-3](../../../epics/care-for-what-is-published/README.md#stories) (verificarse suma una señal que se ve en la ficha y no cambia ninguna proporción: pesa, no habilita), [O6-2](../../../epics/do-not-bother-me/README.md#stories) (lo único que puede volver a ofrecerse es el hecho que nunca respondiste, y responderlo lo apaga para siempre), [O5-2](../../../epics/undo/README.md#stories) (la puerta a Baja: acá empieza, esa pantalla la completa con sus palabras exactas).

## Qué muestra

- **Tu cuenta**: el mail, la situación declarada en Registro (curso, cursé y dejé, me recibí, docente), la carrera declarada.
- **Tu situación**: un link a Mi situación (seguís, te recibiste, te fuiste, o todavía no dijiste).
- **Los cinco avisos, cada uno con su interruptor**: cerró el período, cargamos lo que pediste, el resumen para docentes verificados, el aviso antes de una réplica, el reenganche anual. El apagado vive acá; la pantalla que dibuja cada mail es [Avisos](../../../epics/notices/README.md).
- **La verificación**: si la hiciste, la señal con la fecha; si no, un link a Verificar.
- **La puerta a Baja**: un link a [Baja](../../../epics/undo/screens/delete-account/README.md), sin el detalle de qué implica (eso lo dice esa pantalla, con sus palabras exactas, antes de confirmar).

**Estado "sin verificar"**: el link a Verificar, sin ninguna señal todavía. **Estado "verificado"**: la fecha de verificación, con la aclaración de que las voces se cuentan igual, verificadas o no.

## Lo que no muestra nunca

Nada público sale de acá: no hay perfil social, no se lista lo que aportaste para que lo vea otra cuenta (eso vive en la ficha de cada sujeto, sin tu nombre: O4-4). El reenganche anual, una vez contestado, no vuelve a ofrecerse (O6-2): ese interruptor en particular queda fijo, no es un toggle libre como los otros cuatro.

## Adónde va

Llega desde cualquier pantalla con cuenta, y desde los mails de [Avisos](../../../epics/notices/README.md) (todos apuntan también acá). Va a: Mi situación, Verificar, [Baja](../../../epics/undo/screens/delete-account/README.md).

## Decisiones que aplica

[ADR-0048](../../../decisions/0048-oficializacion-de-condicion-opt-in.md) (verificarse es opt-in, señal y no permiso), [ADR-0040](../../../decisions/0040-notifications-como-bounded-context.md) (Notifications como bounded context: acá se apaga lo que esa infraestructura manda), [ADR-0044](../../../decisions/0044-soft-delete-del-user-con-preservacion-de-corpus.md) (lo que espera del otro lado de la puerta a Baja), [Que no me molesten](../../../epics/do-not-bother-me/README.md) (O6-2).

## Lo que esta ficha deja abierto

- **Qué más muestra "por dónde vas"** sin volverse un perfil social: nada público sale de acá (O4-4), pero el límite exacto de qué sí cabe no está escrito.
- **Si la situación declarada en Registro se puede editar desde acá**: la misma pregunta abierta de esa ficha.
