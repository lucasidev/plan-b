# Mis aportes (la pantalla)

> Ficha de pantalla, dueña: la épica [Deshacer](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la lista y sus estados; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Con cuenta: solo lo tuyo. Slug hoy `/reviews`. Épicas que la componen: [Reseñar](../../../write-a-review/README.md) (qué sumó cada respuesta, lo pendiente de vincular, lo a medias), [Deshacer](../../README.md) (la puerta a Editar, de a uno), [Responder](../../../../reviewed/reply/README.md) (el aviso de una respuesta del reseñado).

## Quién la usa

**Matías** (ya aportó: entra a ver que lo suyo quedó, y qué se movió), **Lucía** (revisa una materia que quedó pendiente de vincular), **Diego** (revisa sus reseñas y corrige lo que hizo falta).

## Qué stories resuelve

[US-165](../../README.md) (la puerta a editar o borrar, de a uno), [US-189](../../../care-for-what-is-published/README.md#stories) (tus correcciones de datos duros quedan acá, con qué corregiste y si ya se aplicó), [US-148](../../../write-a-review/stories/US-148-publish-without-revealing-the-author/README.md) (cómo terminó cada cursada se ve acá como registro propio, nunca público), [US-160](../../../write-a-review/stories/US-160-review-a-subject-not-in-plan/README.md) (lo pendiente de vincular no cuenta en ninguna ficha hasta que se vincula, y se ve pendiente acá mientras tanto), [US-161](../../../write-a-review/stories/US-161-resume-a-draft-review/README.md) (lo a medias queda guardado y aparece para retomar) y [US-162](../../../write-a-review/stories/US-162-see-the-impact-of-my-review/README.md) (por cada frase que respondiste, la opción elegida y las voces que suma ahora). Lo que trae de vuelta de [Responder](../../../../reviewed/reply/README.md#stories) (el aviso de una respuesta del reseñado) se describe abajo; su letra vive en la épica dueña.

## Qué muestra

Una lista de tus aportes, cada uno con su estado:

- **Publicado**: la materia, el período, la cátedra si la diste, y por cada frase que respondiste, cuántas voces suma ahora esa opción ("ahora 22 de 42 voces"). Cómo terminaste esa cursada se ve acá, aunque nunca se publique con la reseña: es tu propio registro, no lo público.
- **Pendiente de vincular**: la materia que nombraste y el catálogo todavía no tiene, marcada como tal; no cuenta en ninguna ficha ni en la cobertura. Cuando el equipo la vincula, esta fila muestra qué cambió.
- **Con respuesta del reseñado**: la cátedra o la institución respondió a los números agregados de esa ficha; se avisa acá, sin que eso cambie nada de tu reseña.
- **A medias**: lo que empezaste a reseñar y no terminaste, con el paso donde quedó; retomar o descartar.
- **Corrección de dato**: cuando corregiste un dato duro de una ficha (US-189), aparece acá con qué corregiste y si ya se aplicó ("corregiste la correlativa de Análisis Matemático II, aplicada").

Cada aporte tiene **Editar** y **Borrar** (→ [Editar](../SC-017-edit/README.md)).

## Estados

**Sin aportes todavía**: la pantalla explica qué es esta lista y ofrece Reseñar. **Uno pendiente** y **uno con respuesta del reseñado**: como se describen arriba, mezclados con el resto de la lista, no en una cola aparte.

## Lo que no muestra nunca

Ningún aporte de otra cuenta; ninguna acción sobre lo que otro escribió.

## Adónde va

Llega desde: "Quedó registrada" al terminar de reseñar, Mi perfil, el mail de [Avisos](../../../../notices/README.md) que avisa una respuesta del reseñado. Va a: [Editar](../SC-017-edit/README.md) (de a uno), Reseñar (otra materia), la ficha de la cátedra o de la materia de cada aporte.

## Decisiones que aplica

[D08](../../../../../history/reviews/2026-08-17-catalog-propagation.md) (lo pendiente de vincular no cuenta hasta vincularse), [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (la reseña de tres capas: se edita o borra entera, o una respuesta de a una), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre se edita sin chequeo, porque nunca se publica).

## Lo que esta ficha deja abierto

- **El orden de la lista**: por fecha o por actividad (qué cambió más recientemente).
