# Mis aportes (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la lista y sus estados; revisión adversarial pendiente antes del hi-fi. Con cuenta: solo lo tuyo. Slug hoy `/reviews` (del inventario). Épicas que la componen: [Reseñar](../../../epics/write-a-review/README.md) (qué sumó cada frase, lo pendiente de vincular, lo a medias), [Deshacer](../../../epics/undo/README.md) (la puerta a Editar, de a uno), [Replicar](../../../epics/reply/README.md) (el aviso de que va a salir una réplica, con su plazo).

## Quién la usa

**Matías** (ya aportó: entra a ver que lo suyo quedó, y qué se movió), **Lucía** (revisa una materia que quedó pendiente de vincular), **Diego** (corrige en qué año se fue, desde acá va a Editar).

## Qué stories resuelve

[T3-4](../../../epics/write-a-review/README.md#stories) (las voces que sumó cada frase que marcaste, y cuántos la leyeron: es lo único que trae de vuelta), [T3-1](../../../epics/write-a-review/README.md#stories) junto con [D08](../../../reviews/2026-08-17-catalog-propagation.md) (lo pendiente de vincular no cuenta en ninguna ficha hasta que se vincula, y se ve pendiente acá mientras tanto), [T3-3](../../../epics/write-a-review/README.md#stories) (lo a medias queda guardado y aparece para retomar), [T2-2](../../../epics/reply/README.md#stories) (el aviso de que va a salir una réplica llega también acá, con su plazo), [O5-1](../../../epics/undo/README.md#stories) (la puerta a editar o borrar, de a uno).

## Qué muestra

Una lista de tus aportes, cada uno con su estado, y tu situación declarada debajo:

- **Publicado**: la materia o el evento, el período, la cátedra si la diste, y por cada frase que marcaste, cuántas voces suma ahora ("ahora 22 de 42 voces") y cuántas lecturas tuvo tu testimonio. Cómo terminaste esa cursada se ve acá, aunque nunca se publique con la reseña (O4-4): es tu propio registro, no lo público.
- **Pendiente de vincular**: la materia que nombraste y el catálogo todavía no tiene, marcada como tal; no cuenta en ninguna ficha ni en la cobertura. Cuando el equipo la vincula, esta fila muestra qué cambió (D08).
- **Comentario retenido**: tu comentario todavía lo está mirando alguien del equipo antes de publicarse; se dice acá, sin fecha de cuándo termina.
- **Con réplica en plazo**: la cátedra va a responder a tu testimonio; se publica en la fecha que se muestra si no hacés nada, con las mismas tres salidas del mail (editar, borrar, pedir revisión: T2-2).
- **A medias**: lo que empezaste a reseñar y no terminaste, con el paso donde quedó; retomar o descartar (T3-3).

Cada aporte tiene **Editar** y **Borrar** (→ [Editar](../../../epics/undo/screens/edit/README.md)). Debajo de la lista, **tu situación declarada** (seguís, te recibiste, te fuiste, o todavía no dijiste) con el link para corregirla en Mi situación.

**Estado "sin aportes todavía"**: la pantalla explica qué es esta lista y ofrece Reseñar. **Estado "uno pendiente"** y **estado "uno con réplica en plazo"**: como se describen arriba, mezclados con el resto de la lista, no en una cola aparte.

## Lo que no muestra nunca

Los votos que diste (abierto, más abajo); ningún aporte de otra cuenta; ninguna acción sobre lo que otro escribió.

## Adónde va

Llega desde: "Quedó registrada" al terminar de reseñar (de ahí T3-4 trae de vuelta), Mi perfil, el mail de [Avisos](../../../epics/notices/README.md) que avisa una réplica. Va a: [Editar](../../../epics/undo/screens/edit/README.md) (de a uno), Mi situación (corregir un hecho de trayectoria), Reseñar (otra materia), la ficha de la cátedra o de la materia de cada aporte.

## Decisiones que aplica

[D08](../../../reviews/2026-08-17-catalog-propagation.md) (lo pendiente de vincular no cuenta hasta vincularse), [ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el chequeo previo, el plazo de la réplica), [ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (los hechos de trayectoria, de a uno).

## Lo que esta ficha deja abierto

- **El orden de la lista**: por fecha o por actividad (qué cambió más recientemente).
- **Si muestra los votos que diste**, además de lo que reseñaste.
