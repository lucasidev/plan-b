# Mi perfil (la pantalla)

> Ficha de pantalla, dueña: la épica [Deshacer](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la cuenta y sus estados; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Con cuenta: la propia. Slug hoy `/my-profile`. Épicas que la componen: [Avisos](../../../../notices/README.md) (dónde se apaga cada mail), [Deshacer](../../README.md) (la puerta a Baja), [Cuidar lo publicado](../../../care-for-what-is-published/README.md) (la señal de verificado).

## Quién la usa

Cualquier cuenta que quiere ver su mail y su situación, apagar un aviso, verificarse, o irse: **Matías**, **Lucía**, **Diego**, **Claudia**.

## Qué stories resuelve

[US-190](../../../care-for-what-is-published/README.md#stories) (verificarse suma una señal que se ve en la ficha y no cambia ninguna proporción: pesa, no habilita), [US-169](../../../../guarantees/README.md#stories) (lo único que puede volver a ofrecerse es el hecho que nunca respondiste, y responderlo lo apaga para siempre), [US-166](../../README.md) (la puerta a Baja: acá empieza, esa pantalla la completa con sus palabras exactas), [US-148](../../../write-a-review/README.md#stories) (nada de lo que aportaste se lista acá para que lo vea otra cuenta: eso vive sin tu nombre en la ficha de cada sujeto).

## Qué muestra

- **Tu cuenta**: el mail, la situación declarada en Registro (curso, cursé y dejé, me recibí, docente), la carrera declarada.
- **Los tres avisos**, todos con interruptor libre: cerró el período, cargamos lo que pediste, y el resumen para el reseñado verificado ("tu ficha juntó reseñas nuevas"). El apagado vive acá; la pantalla que dibuja cada mail es [Avisos](../../../../notices/README.md). (El aviso previo a una réplica y el reenganche anual de trayectoria murieron con el modelo del 2026-08-25: no hay testimonio que replicar ni trayectoria que declarar.)
- **La verificación**: si la hiciste, la señal con la fecha; si no, un link a Verificar.
- **La puerta a Baja**: un link a [Baja](../SC-016-delete-account/README.md), sin el detalle de qué implica (eso lo dice esa pantalla, con sus palabras exactas, antes de confirmar).

## Estados

**Sin verificar**: el link a Verificar, sin ninguna señal todavía. **Verificado**: la fecha de verificación, con la aclaración de que las voces se cuentan igual, verificadas o no.

## Lo que no muestra nunca

Nada público sale de acá: no hay perfil social, no se lista lo que aportaste para que lo vea otra cuenta (eso vive en la ficha de cada sujeto, sin tu nombre: US-148). Lo que ya respondiste no vuelve a ofrecerse (US-169: que no me molesten).

## Adónde va

Llega desde cualquier pantalla con cuenta, y desde los mails de [Avisos](../../../../notices/README.md) (todos apuntan también acá). Va a: Verificar y [Baja](../SC-016-delete-account/README.md).

## Decisiones que aplica

[ADR-0048](../../../../../decisions/0048-standing-is-opt-in-and-decoupled-from-email.md) (verificarse es opt-in, señal y no permiso), [ADR-0040](../../../../../decisions/0040-notifications-as-a-new-bounded-context.md) (Notifications como bounded context: acá se apaga lo que esa infraestructura manda), [ADR-0044](../../../../../decisions/0044-soft-delete-of-the-user-with-corpus-preservation.md) (lo que espera del otro lado de la puerta a Baja), [Que no me molesten](../../../../guarantees/README.md) (US-169).

## Lo que esta ficha deja abierto

- **Qué más muestra "por dónde vas"** sin volverse un perfil social: nada público sale de acá (US-148), pero el límite exacto de qué sí cabe no está escrito.
- **Si la situación declarada en Registro se puede editar desde acá**: la misma pregunta abierta de esa ficha.
