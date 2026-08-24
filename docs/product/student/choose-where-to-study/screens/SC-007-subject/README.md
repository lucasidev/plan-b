# Ficha de materia (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: **el boceto [sketch.html](sketch.html) fue rehecho el 2026-08-24 a la dirección por temas** (la ficha muestra inteligencia sobre lo recolectado: prevalencia, retrato, serie y lo propio de su sujeto; nunca la lista de lo que respondieron), y **el cuerpo de esta ficha de pantalla describe el modelo anterior a ADR-0078** hasta la spec completa de la ficha; el boceto anterior quedó en git. Borrador escrito el 2026-08-19 con su boceto mid-fi de las frases por eje, los testimonios y dónde se cae; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública, se lee sin cuenta. Slug hoy `/subjects/[id]`. Épicas que la componen: [Elegir dónde estudiar](../../README.md) (frases, testimonios, correlativas, dónde se cae), [Mi carrera](../../../my-career/screens/SC-011-my-career/README.md) (las correlativas contra tu plan declarado), [Cuidar lo publicado](../../../care-for-what-is-published/README.md) (votar, reportar, corregir un dato duro), [Deshacer](../../../undo/README.md) (reportar), [Reseñar](../../../write-a-review/README.md) (llega desde acá y vuelve) y [Llevarse el dato](../../../take-the-data/README.md) (el CSV y Método salen de lo que esta ficha publica).

## Quién la usa

**Valentina** (compara materias sueltas antes de fijarse en la institución entera), **Lucía** (antes de anotarse: correlativas, cátedras, dónde se cae), **Matías** (vuelve a ver qué sumó su reseña y lee los demás testimonios), **Rocío** (cita un dato de aprobación o abandono en una reunión). Votar, reportar y corregir piden cuenta; leer, no.

## Qué stories resuelve

[US-135](../../README.md) (el testimonio debajo de las frases, ordenado por votos, con la réplica al lado si la hay), [US-137](../../README.md) (el período que sostiene la ficha y el aviso si lo último es viejo), [US-138](../../README.md) (de qué voces está hecha, y por qué una frase pesa distinto acá que en la carrera), [US-136](../../README.md) (vacía: la primera voz ya se publica), [US-154](../../../write-a-review/README.md#stories) (cómo terminó la cursada, de donde salen aprobación y abandono), [US-152](../../../write-a-review/README.md#stories) (dónde se cae, por materia y período), [US-188](../../../care-for-what-is-published/README.md#stories) (votar: "a mí también me pasó" ordena los testimonios), [US-189](../../../care-for-what-is-published/README.md#stories) (corregir un dato duro inline, con cuenta) y [US-167](../../../undo/README.md#stories) (reportar sin cuenta, con el mail confirmado por link). La letra completa de cada uno está en el README de su propia épica.

## Qué muestra

- **Frases por eje**, con voces y encogimiento, ordenadas por proporción: las de sujeto materia del [catálogo](../../../../phrases.md) (F01 a F11), exigencia neutra y gestión con el color de alarma.
- **Testimonios**, debajo de las frases, ordenados por votos; cada uno con período, la cátedra si la dio y las frases que marcó, con la réplica adentro del mismo bloque si la hay ([US-135](../../README.md)).
- **Las cátedras que dan la materia**, cada una con link a su [Ficha de cátedra](../SC-002-chair/README.md) y sus dos proporciones, para comparar antes de anotarse.
- **Correlativas**: qué pide para cursarla y qué abre al aprobarla, con link a Mi carrera para verlas contra tu propio plan.
- **Dónde se cae**: abandono de cursada (dejé sobre los que terminaron de alguna forma) y aprobación (aprobé sobre aprobé más desaprobé), por período, desde cómo terminó la cursada; la serie de cada proporción por el período en que pasó, sin suavizar ([US-154](../../../write-a-review/README.md#stories), [US-152](../../../write-a-review/README.md#stories)).
- **El período que sostiene la ficha**, con el aviso cuando lo último es de hace más de dos años, y de qué voces está hecha ([US-137](../../README.md), [US-138](../../README.md)).
- **Acciones inline**: votar ("a mí también me pasó", con cuenta), reportar (sin cuenta, mail confirmado por link) y corregir un dato duro (con cuenta, sin aporte previo, queda registrado quién) ([US-188](../../../care-for-what-is-published/README.md#stories), [US-167](../../../undo/README.md#stories), [US-189](../../../care-for-what-is-published/README.md#stories)).

## Estados

- **Vacía**: la materia está cargada pero ninguna cursada la sostiene; la ficha dice que arranca vacía y que la primera voz ya se publica ([US-136](../../README.md)).
- **Una frase que pesa distinto acá y en la carrera**: la misma frase puede tener una proporción en esta materia y otra bien distinta en la carrera entera, porque la carrera suma todas las cursadas de todo el plan y esta ficha solo las de esta materia; se explica en vez de dejarlo como una contradicción ([US-138](../../README.md)).

## Lo que no muestra nunca

Ningún puntaje ni escala 1 a 5 ([ADR-0064](../../../../../decisions/0064-phrases-with-voices-not-scores.md)); ningún texto que el chequeo previo retuvo, y ninguna réplica que cite la parte que el autor marcó como identificante ([ADR-0068](../../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)); ninguna cátedra remarcada como "mejor" entre las que se comparan; nunca infiere aprobación o abandono fuera de lo declarado como cómo terminó ([ADR-0067](../../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)).

## Adónde va

Llega desde: la [Ficha de carrera](../SC-001-career/README.md) (el plan), Buscar, Mi carrera (correlativas) y Reseñar (para ver qué sumó tu reseña). Va a: la [Ficha de cátedra](../SC-002-chair/README.md) de cada cátedra que la da, la Ficha de carrera, Mi carrera, Reseñar (con cuenta) y [Método](../../../take-the-data/screens/SC-021-method/README.md) (cómo se calcula).

## Decisiones que aplica

[ADR-0064](../../../../../decisions/0064-phrases-with-voices-not-scores.md) (frases con voces por eje, sin puntaje), [ADR-0065](../../../../../decisions/0065-attribution-is-the-axis-not-a-split.md) (el eje decide la atribución; el sujeto materia son F01 a F11 del catálogo), [ADR-0067](../../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (aprobación y abandono de cursada desde cómo terminó, la serie por el período en que pasó), [ADR-0068](../../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el testimonio debajo de las frases, la réplica al lado, se baja el texto y nunca la voz), D07 (corregir un dato pide cuenta, no aporte previo, [registro del 17](../../../../../history/reviews/2026-08-17-catalog-propagation.md)).

## Lo que esta ficha deja abierto

- **Si muestra co-cursada propia** (los pares de materias donde participa esta materia) o eso queda solo en la Ficha de carrera.
- **Cuántos testimonios entran por página**, y qué pasa con el resto.
- **Cuántas cátedras se listan** cuando son muchas, y si se ordenan por voces o alfabético.
