# Verificaciones (la pantalla)

> Ficha de pantalla, dueña: la épica [Moderar sin romper el producto](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de las dos colas originales y sus estados, pendiente de sumar el cargo institucional y la revalidación anual que suma esta revisión ([ADR-0073](../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)); revisada el 2026-08-19 ([registro](../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Backoffice, rol verificación (Camila). Sin slug hoy (no confundir con `/verify-teacher`, la pantalla pública donde se sube la constancia o la evidencia docente).

## Quién la usa

**Camila** (verifica: necesita ver lo mínimo para decidir, que quede registrado que lo vio, y que nadie más pueda). No puede tener el rol de moderación a la vez ([Cortar los accesos](../../../cut-the-access/README.md), US-217): es la persona que ve nombres reales, y por construcción no llega a Reportes.

## Qué stories resuelve

US-207 (constancia: se ve lo mínimo, se compara contra lo declarado, el documento se destruye al resolver), US-208 (sin camino a los aportes de esa cuenta, ni por acceso directo), US-211 (constancia rechazada con motivo, sin marcar a quien la subió), US-210 (identidad docente: se compara contra el equipo docente que el catálogo tiene cargado de esa cátedra, en su propia cola), US-225 (cargo institucional: se compara contra los cargos que el catálogo tiene cargados de esa institución, en su propia cola; si el catálogo todavía no lo tiene, el pedido pasa a cargarse, no se rechaza), US-226 (toda identidad verificada, docente o institucional, vence al año y vuelve acá para revisarse de nuevo, sin retirar lo ya publicado). De otras épicas: US-190 (de [Cuidar lo publicado](../../../care-for-what-is-published/README.md): verificarse es señal, no habilita), US-178 (de [Replicar](../../../reply/README.md): para el docente, verificar es el permiso de responder) y US-217 (de [Cortar los accesos](../../../cut-the-access/README.md): moderación y verificación son roles excluyentes, quien tiene este rol no puede tener también el de moderación). La letra completa: [README de la épica](../../README.md#stories); US-190 en [Cuidar lo publicado](../../../care-for-what-is-published/README.md#stories); US-178 en [Replicar](../../../reply/README.md#stories); US-217 en [Cortar los accesos](../../../cut-the-access/README.md#stories).

## Qué muestra

- **Constancias de alumno**: la cola trae lo mínimo para decidir (el dato declarado y la constancia), nunca el resto del perfil. Comparar es la única acción antes de decidir; no hay ningún link desde acá a las reseñas o votos de esa cuenta, ni por URL directa (US-208). Aprobar destruye el documento al resolver; rechazar pide un motivo y no marca a quien lo subió, que puede volver a intentar (US-211).
- **Identidad docente**: cola separada. Quien pide verificarse dice qué cátedra tiene; se compara contra lo que el catálogo ya sabe de esa cátedra (su titular, su equipo). Aprobar o rechazar queda con autor y fecha; rechazar no habilita la réplica y no marca a nadie (US-210).
- **Cargo institucional**: cola separada. Quien pide verificarse dice qué cargo tiene y en qué institución; se compara contra los cargos que el catálogo ya tiene cargados de esa institución. Si el catálogo todavía no lo tiene, el pedido pasa a cargarse como trabajo de catálogo, no se rechaza. Aprobar o rechazar queda con autor y fecha; rechazar no habilita la réplica y no marca a nadie (US-225).
- **Revalidación anual**: toda identidad verificada, docente o institucional, vence al año de aprobada y vuelve a su cola para revisarse de nuevo; lo ya publicado con ella no se retira, porque era cierto cuando se publicó (US-226).

## Estados

- **Constancia aprobada**: el documento ya no está en ningún lado; queda que se aprobó, con fecha.
- **Constancia rechazada**: motivo a la vista; la cuenta no queda marcada y puede volver a intentar.
- **Identidad docente pendiente**: todavía sin resolver; sin ella, esa cátedra no tiene ninguna réplica publicada.
- **Cargo institucional pendiente**: todavía sin resolver; sin él, esa institución no tiene ninguna réplica publicada.
- **Identidad vencida**: pasó un año desde que se aprobó; vuelve a esta cola para revisarse de nuevo, y lo que ya está publicado con ella sigue publicado (US-226).

## Lo que no muestra nunca

- Cualquier dato de la cuenta que no sea el necesario para esta decisión: ni reseñas, ni votos, ni otra constancia.
- Un camino, directo o por link, de la cola de constancias a los aportes de esa cuenta (US-208).
- Una marca sobre la cuenta cuando se rechaza una constancia adulterada (US-211).
- Que verificarse como alumno habilite algo: es señal, no permiso (US-190); en la cola docente y en la de cargo institucional sí es permiso (US-178, US-225), y la ficha distingue las tres.

## Adónde va

Llega desde la constancia o la evidencia que alguien sube en **Verificar** (pública, con cuenta; hoy `/verify-teacher` solo para docente). Aprobar una identidad docente o un cargo institucional habilita **Responder** en [Replicar](../../../reply/README.md), cada uno para lo suyo; aprobar una constancia de alumno solo suma la señal que se ve en la ficha, sin abrir ninguna puerta nueva. Una identidad vencida (US-226) no va a ninguna pantalla nueva: vuelve a esta cola, igual que cualquier pedido sin resolver.

## Decisiones que aplica

[ADR-0068](../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (la identidad docente como permiso de replicar, separada de la moderación), [ADR-0048](../../../../decisions/0048-oficializacion-de-condicion-opt-in.md) (verificarse es opcional y self-initiated, nunca por el email; pesa, no habilita), [ADR-0073](../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) (docente y cargo institucional se verifican contra el catálogo que carga el equipo, nunca contra la entidad; si el dato no está cargado, el pedido pasa a catálogo; revalidación anual sin retirar lo publicado), D09 y D06 ([registro del 17](../../../../history/reviews/2026-08-17-catalog-propagation.md): verificación y moderación excluyentes; el estado del canal se declara, nunca se presume "no quiso responder").

## Lo que esta ficha deja abierto

- **Qué evidencia sube exactamente el docente** para probar su cátedra: ADR-0048 dice "aporta evidencia", sin fijar el formato.
- **Cómo se cubre esta cola si Camila no está**: [Cortar los accesos](../../../cut-the-access/README.md) exige un segundo verificador, nunca un moderador supliendo, y no dice quién.
- **Qué pasa con una constancia que no es ni claramente válida ni claramente adulterada.**
- **Qué pasa con la réplica ya publicada cuando la revalidación vence y la persona no renueva** (US-226, [ADR-0073](../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) no lo decide).
