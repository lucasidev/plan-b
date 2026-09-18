# Mis aportes (la pantalla)

> Ficha de pantalla, dueña: la épica [Deshacer](../../README.md). **Estado**: borrador del 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); reescrita el 2026-09-14 con el catálogo adentro de planb ([#536](https://github.com/lucasidev/plan-b/issues/536)): absorbe [Inicio](../../../enter/screens/SC-011-home/README.md), que se retira, y es adonde entra una cuenta de alumno. Con cuenta: solo lo tuyo. Slug `/reviews/mine`. Épicas que la componen: [Entrar](../../../enter/README.md) (ver si lo que reseñé sirvió de algo), [Reseñar](../../../write-a-review/README.md) (qué sumó cada respuesta, lo pendiente de vincular, lo a medias), [Deshacer](../../README.md) (la puerta a Editar, de a uno), [Responder](../../../../reviewed/reply/README.md) (el aviso de una respuesta del reseñado).

## Quién la usa

**Matías** (ya aportó: entra a ver que lo suyo quedó, y qué se movió), **Lucía** (tiene más para decir que nadie y menos tiempo que nadie: lo que la pantalla le ponga adelante es lo que va a hacer), **Diego** (revisa sus reseñas y corrige lo que hizo falta).

## Qué stories resuelve

[US-231](../../../enter/stories/US-231-see-whether-what-i-reviewed-did-anything/README.md) (ver si lo que reseñé sirvió de algo), [US-134](../../../choose-where-to-study/stories/US-134-check-the-coverage-behind-the-card/README.md) (la cobertura de la carrera, leída para la carrera de esta cuenta), [US-165](../../README.md) (la puerta a editar o borrar, de a uno), [US-189](../../../care-for-what-is-published/README.md#stories) (tus correcciones de datos duros quedan acá, con qué corregiste y si ya se aplicó), [US-148](../../../write-a-review/stories/US-148-publish-without-revealing-the-author/README.md) (cómo terminó cada cursada se ve acá como registro propio, nunca público), [US-160](../../../write-a-review/stories/US-160-review-a-subject-not-in-plan/README.md) (lo pendiente de vincular no cuenta en ninguna ficha hasta que se vincula, y se ve pendiente acá mientras tanto), [US-161](../../../write-a-review/stories/US-161-resume-a-draft-review/README.md) (lo a medias queda guardado y aparece para retomar) y [US-162](../../../write-a-review/stories/US-162-see-the-impact-of-my-review/README.md) (por cada pregunta que respondiste, la opción elegida y las voces que suma ahora). Lo que trae de vuelta de [Responder](../../../../reviewed/reply/README.md#stories) (el aviso de una respuesta del reseñado) se describe abajo; su letra vive en la épica dueña.

## Qué muestra

Cuatro bloques, de arriba abajo, adentro del shell de planb (la barra lateral con Explorar y Mis aportes, el topbar con el buscador y Escribir reseña):

1. **Lo que reseñaste.** Una fila por reseña, por la reseña más reciente: la materia y la cátedra, el período, cuántas reseñas junta hoy esa cátedra ("junta 12 reseñas"), y las acciones **Editar** y **Borrar**, de a una (→ [Editar](../SC-017-edit/README.md)). Borrar se ve como lo que es, en alarma, y confirma diciendo que los conteos de la ficha se mueven hacia atrás. Cada reseña muestra, por cada pregunta que respondiste, la opción elegida y las voces que suma ahora ("ahora 22 de 42 voces"); cómo terminaste esa cursada se ve acá aunque nunca se publique. Un aporte lleva además su estado cuando no es el común: **pendiente de vincular** (la materia que nombraste y el catálogo todavía no tiene; no cuenta en ninguna ficha hasta que el equipo la vincula), **a medias** (lo que empezaste y no terminaste, con el paso donde quedó), **con respuesta del reseñado** (la cátedra o la institución respondió a los números agregados de esa ficha, sin que eso cambie nada de tu reseña) y **corrección de dato** (qué corregiste y si ya se aplicó, US-189).
2. **Tu reseña la publica.** Las cátedras de tu carrera a una reseña del piso ("junta 9 reseñas: con la tuya se publica"), cada una con Reseñar. Aparece solo cuando hay alguna, y nunca lista las que ya reseñaste.
3. **Tu carrera.** El plan de la carrera declarada, por año, cada materia con lo que junta ("28 reseñas en 3 cátedras", contando las cátedras que juntaron alguna, o "sin reseñas") y link a su ficha. Es el mismo plan que la ficha de la carrera, mirado desde la cuenta.
4. **Cuánto de tu carrera está medido.** La cobertura de [US-134](../../../choose-where-to-study/stories/US-134-check-the-coverage-behind-the-card/README.md), leída para la carrera de esta cuenta: cuántas materias del plan tienen alguna cátedra publicando y cuántas no llegan al piso.

La acción principal, reseñar una cursada, vive en el topbar del shell.

## Estados

**Sin ninguna reseña todavía**: el primer bloque dice qué hace falta para que una cátedra publique y ofrece Reseñar; los bloques de la carrera se muestran igual, porque leer no depende de que reseñes. **Carrera sin ninguna cátedra publicando**: la cobertura dice cuántas materias tiene el plan y que ninguna llegó al piso. **Perfil sin carrera vigente**: los bloques de la carrera no se dibujan. **Uno pendiente** y **uno con respuesta del reseñado**: en la lista, con su estado, no en una cola aparte.

## Lo que no muestra nunca

Ningún aporte de otra cuenta y ninguna acción sobre lo que otro escribió. Ningún puntaje, promedio, racha ni progreso personal ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)): la cobertura es del plan, no un marcador de la cuenta. Ningún ranking de quién aportó más. Ninguna respuesta concreta ajena. Materias sugeridas para cursar, horarios ni orden de cursada ([ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)).

## Adónde va

Llega desde: entrar con una cuenta de alumno (es su destino), "Quedó registrada" al terminar de reseñar, Mi perfil, el mail de [Avisos](../../../../notices/README.md) que avisa una respuesta del reseñado. Va a: [Editar](../SC-017-edit/README.md) (de a uno), [Reseñar una cursada](../../../write-a-review/screens/SC-015-write-review/README.md) (desde el topbar y desde cada cátedra a una del piso), la [ficha de la cátedra](../../../choose-where-to-study/screens/SC-002-chair/README.md), de la [materia](../../../choose-where-to-study/screens/SC-007-subject/README.md) o de la [carrera](../../../choose-where-to-study/screens/SC-001-career/README.md).

## Decisiones que aplica

[D08](../../../../../history/reviews/2026-08-17-catalog-propagation.md) (lo pendiente de vincular no cuenta hasta vincularse), [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (la reseña de tres capas: se edita o borra entera, o una respuesta de a una; el piso de 10 y su razón), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre se edita sin chequeo, porque nunca se publica), [ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) (el producto informa y no lleva tu carrera: el plan se muestra, ningún avance se marca), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (conteos, nunca puntajes, también llevado a la cuenta).

## Lo que esta ficha deja abierto

- **El orden de la lista** es por la reseña más reciente (lo pone el backend). Inicio había cerrado "por la cursada más reciente", que es el orden en que la persona lo tiene en la cabeza, pero la reseña no lleva una fecha de cursada ordenable, solo la etiqueta del período; se revisita cuando la lleve.
