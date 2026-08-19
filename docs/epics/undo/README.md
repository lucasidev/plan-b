# Deshacer

> Épica del grupo **O5 · Poder deshacer (se construye: las pantallas Editar y Baja, y el reporte sin cuenta)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Poder sacar lo que aportaste, y poder reportar lo que otro publicó sobre vos, sin hacerte cuenta en el sitio que te difama. Editar o borrar un aporte desde Mis aportes, con el comentario editado volviendo a pasar el chequeo previo antes de republicarse; dar de baja la cuenta, que anonimiza la identidad y preserva lo que dejaste aportado (hechos de trayectoria incluidos, exactos): lo que querés sacar lo borrás antes, de a uno, y lo que queda publicado sigue siendo corpus; y reportar algo publicado con el mail y nada más, confirmado por link, resuelto por una persona. A diferencia de O6, esta no es una garantía: se construye. Las pantallas Editar y Baja todavía no existen, y sin ellas reseñar algo incómodo es irreversible.

## Para quién

Quien ya aportó (Matías, Lucía, Diego): quiere poder sacar lo que dijo antes de que le pese. Quien lee, incluido el que una reseña difama sin nombrarlo: puede reportar sin registrarse en el sitio que lo difama (O5-4).

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

> O6 es una **garantía**: cada pantalla nueva la tiene que cumplir y se verifica como parte del Definition of Done del producto nuevo. O5 no: deshacer se construye (las pantallas Editar y Baja, y el reporte sin cuenta con mail confirmado por link). Recuperar la contraseña (la que era O5-3) sí es garantía y no una story: la cuenta con todo adentro vuelve con un link al mail.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O5-1 | Como quien ya aportó, quiero editar o borrar lo que conté, porque me expuse más de lo que quería. | El aporte se puede modificar y borrar desde Mis aportes, y el comentario editado vuelve a pasar el chequeo previo antes de publicarse ([ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)). | depende de T2-1 |
| O5-2 | Como quien ya aportó, quiero poder sacar lo mío y después irme, porque prometieron que era mío, y eso incluye poder sacarlo. | Los aportes se borran de a uno antes (O5-1); la baja de cuenta anonimiza la identidad y preserva lo que quedó aportado, incluidos los hechos de trayectoria, exactos ([ADR-0044](../../decisions/0044-soft-delete-del-user-con-preservacion-de-corpus.md); D10, [registro del 17](../../reviews/2026-08-17-catalog-propagation.md)), y la pantalla lo dice con esas palabras antes de confirmar. |  |
| O5-4 | Como quien lee, quiero reportar algo sin registrarme, porque no me voy a hacer cuenta en el sitio que me difama. | El reporte se manda sin cuenta, confirma el mail por link antes de entrar a la cola, y lo resuelve una persona: nada baja solo por cantidad de reportes. | par de BO2-2 |

## Decisiones que aplica

[ADR-0044](../../decisions/0044-soft-delete-del-user-con-preservacion-de-corpus.md) (la baja anonimiza y preserva lo aportado), D10 (los hechos de trayectoria sobreviven exactos y ya anónimos, [registro del 17](../../reviews/2026-08-17-catalog-propagation.md)), [ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el comentario editado vuelve al chequeo previo; reportar sin cuenta confirma el mail; nada baja solo por cantidad de reportes; se baja el texto, nunca la voz), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) ("quien quiera sacar algo lo borra antes, de a uno"), D05 (los reportes se agrupan por objetivo y ventana de 72 horas; el mail confirmado deduplica).

## Pantallas que compone

- **Mis aportes** (con cuenta): lo que diste, con el camino a Editar.
- **Editar** (diseñada sin construir, con cuenta): modificar o borrar un aporte; el comentario editado vuelve al chequeo previo.
- **Baja** (diseñada sin construir, con cuenta): dar de baja la cuenta, con las palabras exactas de qué pasa.
- **Reportar** (acción inline sobre la ficha, sin cuenta): motivo y mail.
- **Mi perfil** (con cuenta): de donde se llega a Baja.

## Bocetos

Por dibujar: Editar (qué campos de una reseña publicada se pueden tocar y cuáles no), Baja (el texto exacto de qué pasa con la identidad y con lo aportado), Reportar (el modal: motivo, mail, la confirmación).

## Lo que esta épica todavía no resuelve

- **Qué pasa con una réplica ya publicada si el autor borra el testimonio después del plazo**: ADR-0068 solo cubre el plazo de aviso, no lo que pasa después.
- **Cuánto tiempo se guarda un aporte a medias** antes de descartarlo (T3-3).
- **Si Editar permite cambiar el período o la materia de una reseña publicada**, o solo las frases y el comentario.
