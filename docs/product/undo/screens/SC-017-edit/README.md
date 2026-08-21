# Editar (la pantalla)

> Ficha de pantalla, dueña: la épica [Deshacer](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Con cuenta: solo entra el dueño del aporte. Sin slug.

## Quién la usa

Quien ya aportó y quiere sacar o corregir lo que dijo antes de que le pese: **Matías** (se expuso más de lo que quería), **Lucía** (corrige un dato apurado), **Diego** (corrige en qué año se fue). El flujo completo: [`flow.md`](../../flow.md).

## Qué stories resuelve

US-165 (dueña): el aporte se puede modificar y borrar desde Mis aportes, y el comentario editado vuelve a pasar el chequeo previo antes de publicarse. La letra completa: [README de la épica](../../README.md). US-158 (el mismo chequeo que corre al reseñar), US-162 (lo que Mis aportes ya mostró antes de llegar acá: qué sumó cada frase), US-150 (destildar «Hay clases que no se dan» retira también el número declarado, porque la pregunta cuelga de esa frase) y US-160 (una reseña pendiente de vincular se edita igual, con el aviso de que todavía no cuenta en ninguna ficha): las cuatro en la letra de [Reseñar](../../../write-a-review/README.md#stories).

## Qué muestra

- **Editar un aporte**: llega desde Mis aportes con la materia, el período, cómo terminó y la cátedra a la vista, como contexto. Las frases marcadas, con toggle para sacarlas o agregar otras; destildar «Hay clases que no se dan» retira también el número de clases declarado, porque esa pregunta solo existe colgada de esa frase (US-150, D02). El comentario, editable, con el mismo tope y la misma advertencia que al reseñar ("se lee; no suma a los conteos"). Guardar dispara el chequeo previo otra vez solo si el comentario cambió (US-158); si no lo tocaste, no vuelve a pasar por ahí.
- **Borrar este aporte**: una confirmación aparte ("esto no se puede deshacer"); al confirmar, la reseña entera deja de contar y sus voces bajan de cada frase que había marcado.
- **Borrar un hecho de trayectoria**: el mismo camino, de a uno ("dijiste que te fuiste en 2023", con su borrar al lado); nunca en bloque (ADR-0067).

## Estados

- **Reseña con réplica publicada**: avisa que ya hay una respuesta de la cátedra al lado de esta reseña; qué pasa con esa respuesta si editás o borrás es una pregunta abierta.
- **Reseña pendiente de vincular**: se edita igual, con el aviso de que todavía no cuenta en ninguna ficha (US-160).
- **Comentario retenido**: el comentario de esta reseña todavía lo está mirando alguien del equipo; se puede editar o borrar igual mientras tanto.

## Lo que no muestra nunca

Ningún aporte de otra cuenta; borrado en bloque de hechos de trayectoria (ADR-0067: de a uno); ninguna certeza sobre qué pasa con una réplica ya publicada si tocás el testimonio que la motivó (es pregunta abierta, no se inventa una respuesta acá).

## Adónde va

Llega desde Mis aportes, por cada aporte. Guardar o borrar vuelve a Mis aportes; si el comentario cambia, corre el mismo chequeo previo del paso 6 de [Reseñar](../../../write-a-review/screens/SC-015-write-review/README.md). Es también el camino para corregir lo que se contestó en [Mi situación](../../../write-a-review/screens/SC-014-my-status/README.md), como esa ficha ya aclara.

## Decisiones que aplica

[ADR-0068](../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el comentario editado vuelve al chequeo previo), [ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (los hechos de trayectoria se borran de a uno), [ADR-0044](../../../../decisions/0044-soft-delete-of-the-user-with-corpus-preservation.md) (lo que se saca acá, antes de la baja de cuenta).

## Lo que esta ficha deja abierto

- **Qué campos se pueden tocar**: ¿el período, la materia, cómo terminó o la cátedra se vuelven editables, o solo frases y comentario? El boceto los muestra como contexto fijo; si algún día se pueden editar es lo que queda abierto.
- **Qué pasa con una réplica ya publicada** si el autor edita o borra el testimonio que la motivó: ni ADR-0068 ni el flujo de Replicar lo dicen.
- **Cuánto tiempo queda "retenido" un comentario** antes de que alguien del equipo lo mire.
