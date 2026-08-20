# Verificaciones (la pantalla)

> Ficha de pantalla, dueña: la épica [Moderar sin romper el producto](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de las dos colas y sus estados; revisada el 2026-08-19 ([registro](../../../../reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Backoffice, rol verificación (Camila). Sin slug hoy (no confundir con `/verify-teacher`, la pantalla pública donde se sube la constancia o la evidencia docente).

## Quién la usa

**Camila** (verifica: necesita ver lo mínimo para decidir, que quede registrado que lo vio, y que nadie más pueda). No puede tener el rol de moderación a la vez ([Cortar los accesos](../../../cut-the-access/README.md), BO3-3): es la persona que ve nombres reales, y por construcción no llega a Reportes.

## Qué stories resuelve

BO2-3 (constancia: se ve lo mínimo, se compara contra lo declarado, el documento se destruye al resolver), BO2-4 (sin camino a los aportes de esa cuenta, ni por acceso directo), BO4-4 (constancia rechazada con motivo, sin marcar a quien la subió), BO2-6 (identidad docente: se prueba contra la cátedra que dice tener, en su propia cola). De otras épicas: T1-3 (de [Cuidar lo publicado](../../../care-for-what-is-published/README.md): verificarse es señal, no habilita) y O7-8 (de [Replicar](../../../reply/README.md): para el docente, verificar es el permiso de responder). La letra completa: [README de la épica](../../README.md#stories); T1-3 en [Cuidar lo publicado](../../../care-for-what-is-published/README.md#stories); O7-8 en [Replicar](../../../reply/README.md#stories).

## Qué muestra

- **Constancias de alumno**: la cola trae lo mínimo para decidir (el dato declarado y la constancia), nunca el resto del perfil. Comparar es la única acción antes de decidir; no hay ningún link desde acá a las reseñas o votos de esa cuenta, ni por URL directa (BO2-4). Aprobar destruye el documento al resolver; rechazar pide un motivo y no marca a quien lo subió, que puede volver a intentar (BO4-4).
- **Identidad docente**: cola separada. Quien pide verificarse dice qué cátedra tiene; se compara contra lo que el catálogo ya sabe de esa cátedra (su titular, su equipo). Aprobar o rechazar queda con autor y fecha; rechazar no habilita la réplica y no marca a nadie (BO2-6).

## Estados

- **Constancia aprobada**: el documento ya no está en ningún lado; queda que se aprobó, con fecha.
- **Constancia rechazada**: motivo a la vista; la cuenta no queda marcada y puede volver a intentar.
- **Identidad docente pendiente**: todavía sin resolver; sin ella, esa cátedra no tiene ninguna réplica publicada.

## Lo que no muestra nunca

- Cualquier dato de la cuenta que no sea el necesario para esta decisión: ni reseñas, ni votos, ni otra constancia.
- Un camino, directo o por link, de la cola de constancias a los aportes de esa cuenta (BO2-4).
- Una marca sobre la cuenta cuando se rechaza una constancia adulterada (BO4-4).
- Que verificarse como alumno habilite algo: es señal, no permiso (T1-3); en la cola docente sí es permiso (O7-8), y la ficha distingue las dos.

## Adónde va

Llega desde la constancia o la evidencia que alguien sube en **Verificar** (pública, con cuenta; hoy `/verify-teacher` solo para docente). Aprobar una identidad docente habilita **Responder** en [Replicar](../../../reply/README.md); aprobar una constancia de alumno solo suma la señal que se ve en la ficha, sin abrir ninguna puerta nueva. No tiene "siguiente pantalla": vuelve a la cola.

## Decisiones que aplica

[ADR-0068](../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (la identidad docente como permiso de replicar, separada de la moderación), [ADR-0048](../../../../decisions/0048-oficializacion-de-condicion-opt-in.md) (verificarse es opcional y self-initiated, nunca por el email; pesa, no habilita), D09 y D06 ([registro del 17](../../../../reviews/2026-08-17-catalog-propagation.md): verificación y moderación excluyentes; el estado del canal se declara, nunca se presume "no quiso responder").

## Lo que esta ficha deja abierto

- **Qué evidencia sube exactamente el docente** para probar su cátedra: ADR-0048 dice "aporta evidencia", sin fijar el formato.
- **Cómo se cubre esta cola si Camila no está**: [Cortar los accesos](../../../cut-the-access/README.md) exige un segundo verificador, nunca un moderador supliendo, y no dice quién.
- **Qué pasa con una constancia que no es ni claramente válida ni claramente adulterada.**
