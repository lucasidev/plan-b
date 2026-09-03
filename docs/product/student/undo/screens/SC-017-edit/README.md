# Editar (la pantalla)

> Ficha de pantalla, dueña: la épica [Deshacer](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Con cuenta: solo entra el dueño del aporte. Sin slug.

## Quién la usa

Quien ya aportó y quiere sacar o corregir lo que dijo antes de que le pese: **Matías** (se expuso más de lo que quería), **Lucía** (corrige una respuesta apurada), **Diego** (corrige cómo terminó una cursada). El flujo completo: [`flow.md`](../../flow.md).

## Qué stories resuelve

US-165 (dueña): el aporte se puede modificar y borrar desde Mis aportes: la reseña entera, o una respuesta de a una; el campo libre se edita directo, sin chequeo. La letra completa: [README de la épica](../../README.md). [US-160](../../../write-a-review/stories/US-160-review-a-subject-not-in-plan/README.md) (una reseña pendiente de vincular se edita igual, con el aviso de que todavía no cuenta en ninguna ficha) y [US-162](../../../write-a-review/stories/US-162-see-the-impact-of-my-review/README.md) (parte del mismo dato que ya mostró Mis aportes antes de llegar a editar): las dos en la letra de [Reseñar](../../../write-a-review/README.md#stories).

## Qué muestra

- **Editar un aporte**: llega desde Mis aportes con la materia, el período, cómo terminó y la cátedra a la vista, como contexto. Las respuestas de las capas de conducta observable y de vivencia, cada una con su propio control para cambiarla o volverla a "sin responder". El campo libre, editable, sin ningún tope ni chequeo: la pantalla recuerda que nunca se publica. Guardar actualiza al instante lo que cambiaste: los conteos de cada frase tocada se recalculan, y la reseña lo confirma en pantalla.
- **Borrar este aporte**: una confirmación aparte ("esto no se puede deshacer"); al confirmar, la reseña entera deja de contar y sus voces bajan de cada frase que había respondido.

## Estados

- **Reseña de una cátedra con respuesta del reseñado**: la ficha de esa cátedra ya tiene una respuesta a sus números agregados; editar o borrar esta reseña puntual solo mueve esos números, nunca retira ni cambia esa respuesta.
- **Reseña pendiente de vincular**: se edita igual, con el aviso de que todavía no cuenta en ninguna ficha.

## Lo que no muestra nunca

Ningún aporte de otra cuenta; borrado en bloque de reseñas (se borran de a una); ningún chequeo ni retención sobre el campo libre, porque nunca se publica.

## Adónde va

Llega desde Mis aportes, por cada aporte. Guardar o borrar vuelve a Mis aportes.

## Decisiones que aplica

[ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (la reseña de tres capas: se edita o borra entera, o una respuesta de a una), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre se edita sin chequeo, porque nunca se publica), [ADR-0044](../../../../../decisions/0044-soft-delete-of-the-user-with-corpus-preservation.md) (lo que se saca acá, antes de la baja de cuenta).

## Lo que esta ficha deja abierto

- **Qué campos se pueden tocar**: ¿el período, la cátedra o el modo de cursada se vuelven editables, o solo las respuestas y el campo libre? El boceto los muestra como contexto fijo; si algún día se pueden editar es lo que queda abierto.
