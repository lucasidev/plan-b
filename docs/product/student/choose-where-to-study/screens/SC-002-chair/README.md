# Ficha de cátedra (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: **el boceto [sketch.html](sketch.html) fue rehecho el 2026-08-25** al modelo de conteos ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)): fama por convergencia entre frases, tasa de finalización agregada y comparada contra las cátedras hermanas, dos bloques con la moda como badge y la distribución por opción (rojo solo la opción negativa), y la dispersión temporal en la línea de identidad; el cuerpo de esta ficha sigue esa misma dirección. Es la **versión mínima de R1** (issue #360): el detalle capa por capa, frase por frase, es dato del Método y del CSV, no algo que esta ficha tenga que repetir entero. Los bocetos anteriores quedaron en git. Revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); **hi-fi en la dirección Boletín** ([ADR-0071](../../../../../decisions/0071-the-visual-language-is-a-bulletin.md), 2026-08-19). Pantalla pública, se lee sin cuenta. Slug propuesto: `/chairs/[id]` (hoy el chasis es `/teachers/[id]`, la ficha del docente; la cátedra como entidad es US-196). Épicas que la componen: [Elegir dónde estudiar](../../README.md) (la lectura: los hechos, los dos bloques, la tasa de finalización), [Reseñar](../../../write-a-review/README.md) (llega desde acá y vuelve) y [Responder](../../../../reviewed/reply/README.md) (la respuesta firmada de la cátedra, o el estado del canal cuando no la hay).

## Quién la usa

- **Valentina** (elige): baja desde la Ficha de carrera para ver quién da la materia y si lo que traba es la materia o esta cátedra puntual.
- **Lucía** (cursa): compara las cátedras de la misma materia antes de anotarse; después vuelve para reseñar.
- **Matías** (ya aportó): entra a ver que lo suyo quedó reflejado en los conteos.
- **Claudia** (docente): la lee antes de responder; **Prof. Paredes** la lee y no responde.
- **Rocío** (investiga): la cita; baja a Método desde acá.
- **Nadie con cuenta obligatoria**: leer no pide cuenta; reseñar y responder sí.

## Qué stories resuelve

[US-129](../../stories/US-129-attribute-difficulty-to-career-or-institution/README.md) ("qué hizo la cátedra" es la mitad conductual de la atribución: la decide quien lee, comparando esto contra los datos oficiales de la Ficha de carrera), [US-131](../../stories/US-131-see-how-many-voices-support-it/README.md) (cada frase con su propia moda, su distribución y su "de N" voces), [US-132](../../stories/US-132-search-by-subject-career-or-teacher/README.md) (buscar el nombre de un docente lleva acá), [US-136](../../stories/US-136-understand-being-the-first-voice/README.md) (sin voces: arranca vacía, nunca un cero; bajo el piso de 10 reseñas: muestra el conteo hacia esa cifra, no un adelanto de conteos), [US-138](../../stories/US-138-understand-why-weight-differs-by-level/README.md) (por qué esta cátedra puede publicar y una hermana con menos reseñas todavía no: el piso), [US-150](../../../write-a-review/README.md) (declarar clases sin dar alimenta la frase "¿Se dictaron las clases?"), [US-172](../../../../reviewed/reply/README.md), [US-176](../../../../reviewed/reply/README.md) y [US-177](../../../../reviewed/reply/README.md) (la respuesta firmada de la cátedra a sus números agregados, o el estado del canal cuando no la hay), [US-196](../../../../team/sustain-the-catalog/README.md) (la cátedra existe como entidad propia: sin eso esta ficha no tiene de qué sostenerse), [US-139](../../../request-a-career/stories/US-139-tell-apart-the-three-empty-states/README.md) (los estados de vacía y bajo el piso de 10) y [US-187](../../../take-the-data/stories/US-187-declare-reprocessing-and-distilled-phrases/README.md) (el aviso de reproceso cuando el catálogo de frases cambia). La letra completa de cada una está en su propia carpeta o en el README de su propia épica.

## Qué muestra

La ficha de una **cátedra**: el equipo docente a cargo de una materia en una institución. Sus voces son las personas que reseñaron cursadas de esta cátedra, sin deduplicar entre períodos: la unidad es cuenta × materia × período. Solo publica desde las 10 reseñas: por debajo, no muestra un adelanto parcial ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md), que fija las dos cosas).

De arriba abajo:

1. **Identidad**: la materia, la cátedra, la institución y la carrera con links a sus fichas; y la línea de sustento: "N voces repartidas de 2023 a 2026, sin picos de carga · lo último es de hace 2 meses" (dispersión temporal, [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)).
2. **Los hechos que la marcan**: la fama por convergencia. Cuando varias frases distintas apuntan al mismo lado, la ficha lo dice arriba, como predicado del sujeto ("Acá no se aprende preguntando"), con el sustento como metadato ("el 63 % casi nunca salía entendiendo, el 66 % no podía preguntar sin quedar mal, y al 59 % casi nunca le contestaban en clase"). Tres frases convergentes valen más que quinientas marcas en una.
3. **Cómo termina la cursada acá**: la tasa de finalización agregada ("de cada 10 que la cursan, llegan 4"), como barra de dos tramos, comparada contra las cátedras hermanas de la misma materia cuando la diferencia es real ("en González llegan 9 de cada 10; en Ruiz, 7"). Ninguna reseña muestra cómo terminó nadie: esto es el conteo.
4. **Qué hizo la cátedra**, con sus voces: cada frase de conducta observable ("¿Contestaba las preguntas en clase?", "¿Se dictaron las clases?", "¿El práctico daba lo mismo que el teórico?", y el resto del catálogo) con su moda como badge ("Casi nunca · 59 %"), su distribución completa por opción como barra segmentada (rojo solo en la opción negativa) y el conteo crudo de cada opción con su "de N".
5. **Qué les pasó a los que cursaron**, con sus voces: las frases de vivencia ("¿Salías de la clase entendiendo?", "¿El material alcanzaba para el parcial?", "¿Pudiste seguir el ritmo?", "¿Podías preguntar sin quedar mal?"), con el mismo formato de moda y distribución. Este bloque y el anterior no se suman entre sí ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)).
6. **Qué respondió la cátedra**: la respuesta firmada, con nombre y cargo, a los números agregados de esta ficha (no a un testimonio puntual: no existe uno publicado, [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)); mientras no llega, "Sin respuesta" con la fecha en que se avisó.
7. **Pie**: "¿Cómo calculamos esto?" (a Método), "Bajar los datos" (el CSV) y el llamado a reseñar (a Reseñar, con cuenta).

## Estados

- **Cargada, sin voces**: arranca vacía y se puede ser la primera persona en reseñarla; nunca un cero ([US-136](../../stories/US-136-understand-being-the-first-voice/README.md)).
- **Bajo el piso**: tiene reseñas pero todavía no llega a 10; la ficha dice cuántas lleva y cuántas faltan ("junta 3 reseñas: con 7 más se publica"), sin mostrar un adelanto de sus conteos ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md), [US-138](../../stories/US-138-understand-why-weight-differs-by-level/README.md)).
- **Sin base para comparar**: si es la única cátedra de su materia, la sección de "cómo termina la cursada" no muestra contraste contra hermanas.
- **Sin respuesta**: el bloque 6 declara el estado del canal ("Sin respuesta", con la fecha en que se avisó), nunca "no quiso responder".

## Lo que no muestra nunca

Ningún puntaje ni promedio ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)); ninguna cabecera de dos proporciones sumadas por eje (retirada: la atribución la hace quien lee, [US-129](../../stories/US-129-attribute-difficulty-to-career-or-institution/README.md)); ningún testimonio ni cita textual publicada ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)); ningún desenlace individual, solo la tasa de finalización agregada; ninguna comparación contra una cátedra que no sea de la misma materia, ni una comparación publicada cuando los intervalos se tocan ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)); nunca "no quiso responder" como estado del canal.

## Adónde va

Llega desde: Ficha de materia (las cátedras de la materia), Buscar (el nombre de un docente lleva a su cátedra), Ficha de carrera. Va a: Método, Ficha de materia, Ficha de carrera, Reseñar, Responder.

## Decisiones que aplica

[ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (moda, distribución, convergencia, comparación entre hermanas, tasa de finalización, dispersión temporal, los dos bloques que no se suman), [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (piso de 10 reseñas; la unidad de la voz, cuenta × materia × período, que es la razón de que las cursadas no se dedupliquen entre períodos), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (no hay testimonio al que responder: la respuesta es a los números agregados).

## Lo que esta ficha deja abierto

- **Cuántos hechos entran en "los hechos que la marcan"** antes de "ver todos", y qué pasa si ninguna frase converge todavía.
- **Cuántas frases por bloque entran antes de "ver todos"** en "qué hizo la cátedra" y "qué les pasó a los que cursaron".
- **Acciones inline que no están en el R1 mínimo**: corregir un dato (de Cuidar lo publicado) todavía no están bocetadas en esta ficha.
- **El color de alarma**: hoy solo la opción negativa de cada distribución lo lleva; si algún bloque completo (por ejemplo, la barra de finalización) necesita su propia regla de cuándo alarmar queda para cuando haya más de un ejemplo bocetado.
- **Lo que necesita del sistema para existir**: la cátedra como entidad (US-196); los conteos por frase, opción y período de las cursadas de la cátedra; el piso (ADR-0082) y la comparación con intervalos (ADR-0083); la respuesta firmada con su verificación (Responder).
