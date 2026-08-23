# Deshacer

> Épica del grupo **O5 · Poder deshacer (se construye: las pantallas Editar y Baja, y el reporte sin cuenta)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y sus pantallas propias con ficha y boceto mid-fi ([Editar](screens/SC-017-edit/README.md), [Baja](screens/SC-016-delete-account/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Poder sacar lo que aportaste, y poder reportar lo que otro publicó sobre vos, sin hacerte cuenta en el sitio que te difama. Editar o borrar un aporte desde Mis aportes, con el comentario editado volviendo a pasar el chequeo previo antes de republicarse; dar de baja la cuenta, que anonimiza la identidad y preserva lo que dejaste aportado (hechos de trayectoria incluidos, exactos): lo que querés sacar lo borrás antes, de a uno, y lo que queda publicado sigue siendo corpus; y reportar algo publicado con el mail y nada más, confirmado por link, resuelto por una persona. A diferencia de O6, esta no es una garantía: se construye. Las pantallas Editar y Baja todavía no existen, y sin ellas reseñar algo incómodo es irreversible.

## Para quién

Quien ya aportó (Matías, Lucía, Diego): quiere poder sacar lo que dijo antes de que le pese. Quien lee, incluido el que una reseña difama sin nombrarlo: puede reportar sin registrarse en el sitio que lo difama ([US-167](../../guarantees/US-167-report-content-without-an-account/README.md), que por eso es una garantía del producto y no una story de este tramo).

## Stories

Las 3 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

> O6 es una **garantía**: cada pantalla nueva la tiene que cumplir y se verifica como parte del Definition of Done del producto nuevo. O5 no: deshacer se construye (las pantallas Editar y Baja, y el reporte sin cuenta con mail confirmado por link). Recuperar la contraseña (la que era O5-3) sí es garantía y no un requisito: la cuenta con todo adentro vuelve con un link al mail.

| ID | De qué trata |
|---|---|
| [US-165](stories/US-165-edit-or-delete-what-i-said/README.md) | Editar o borrar un aporte propio |
| [US-166](stories/US-166-delete-my-account-anonymized-not-erased/README.md) | Dar de baja la cuenta y preservar el corpus anonimizado |


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0044](../../../decisions/0044-soft-delete-of-the-user-with-corpus-preservation.md) (la baja anonimiza y preserva lo aportado), D10 (los hechos de trayectoria sobreviven exactos y ya anónimos, [registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md)), [ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el comentario editado vuelve al chequeo previo; reportar sin cuenta confirma el mail; nada baja solo por cantidad de reportes; se baja el texto, nunca la voz), [ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) ("quien quiera sacar algo lo borra antes, de a uno"), D05 (los reportes se agrupan por objetivo y ventana de 72 horas; el mail confirmado deduplica).

## Pantallas

Las dos que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Editar**](screens/SC-017-edit/README.md) (con cuenta): modificar o borrar un aporte, de a uno, con sus estados; [boceto mid-fi](screens/SC-017-edit/sketch.html).
- [**Baja**](screens/SC-016-delete-account/README.md) (con cuenta): dar de baja la cuenta, con las palabras exactas de qué pasa; [boceto mid-fi](screens/SC-016-delete-account/sketch.html).

Las que comparte con otras épicas: [**Mis aportes**](screens/SC-018-my-contributions/README.md) (con cuenta: de donde se llega a Editar) y [**Mi perfil**](screens/SC-019-my-profile/README.md) (con cuenta: de donde se llega a Baja). **Reportar** es una acción inline sobre la ficha, sin cuenta, sin carpeta propia: el flujo la dibuja en [`flow.md`](flow.md).

## Lo que esta épica todavía no resuelve

- **Qué pasa con una réplica ya publicada si el autor borra el testimonio después del plazo**: ADR-0068 solo cubre el plazo de aviso, no lo que pasa después.
- **Cuánto tiempo se guarda un aporte a medias** antes de descartarlo (US-161).
- **Si Editar permite cambiar el período o la materia de una reseña publicada**, o solo las frases y el comentario.
