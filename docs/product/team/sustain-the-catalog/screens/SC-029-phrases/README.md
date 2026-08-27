# Frases (la pantalla)

> Ficha de pantalla, dueña: la épica [Sostener el catálogo](../../README.md). **Estado**: cuerpo reescrito el 2026-08-26 al modelo de ítems ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)): editar texto sin cambiar significado mantiene la misma serie, cambiar significado abre un código nuevo con su corte declarado; la curaduría suma la lectura del campo libre y las notas editoriales. El [boceto mid-fi](sketch.html) queda pendiente de su propio rehecho. Backoffice, rol curaduría de ítems (editorial, sin persona propia entre las cuatro del equipo). Sin slug hoy.

## Quién la usa

**Quien cura los ítems**: el catálogo de requisitos lo nombra como rol distinto del de Sofía, sin persona propia entre las cuatro del equipo; lo cumple quien el equipo asigne. El flujo entero: [`flow.md`](../../flow.md), sección BO-9.

## Qué stories resuelve

US-198 (dueña: el catálogo de ítems se edita en un lugar, cada cambio con autor y fecha; editar el texto sin cambiar el significado mantiene la misma serie, cambiar el significado abre un código nuevo con su corte declarado), US-199 (la cola de curaduría de destilados, aprobar con capa, opciones y código, o descartar), US-187 (recién aprobado se ofrece marcado como destilado, síntesis y no cita). La letra de cada una: [README de la épica](../../README.md#stories); la de US-187, en la épica que la implementa.

## Qué muestra

- **El catálogo entero** de [`phrases.md`](../../../../phrases.md) en una sola tabla: texto, capa (contexto, qué hizo la cátedra, o qué te pasó a vos), opciones con la negativa marcada, código, y autor y fecha del último cambio; se edita ahí mismo. Editar el texto de un ítem sin cambiar su significado guarda en el mismo código, misma serie. Si el cambio altera el significado, pide confirmar que abre un código nuevo: la pantalla dice que la serie va a declarar un corte antes de aplicar (US-198).
- **La cola de curaduría**: cada candidata que la destilación propuso, con los comentarios del campo libre de los que salió, y dos salidas. **Aprobar**, asignándole capa, opciones y un código estable: recién ahí se ofrece para responder, marcado como destilado (US-199, US-187). **Descartar**: no se ofrece nunca, y no queda rastro público.
- **Notas editoriales**: la lectura del campo libre también alimenta síntesis a nivel carrera o institución, nunca cátedra, sin nombres y con su procedencia dicha ("leída de comentarios que no se publican"), fechadas ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)).

## Estados

**Estado "cola vacía"**: no hay candidatas esperando curaduría. **Estado "un destilado en revisión"**: la candidata con sus comentarios de origen, sin aprobar ni descartar todavía.

## Lo que no muestra nunca

Un destilado ofrecido para responder antes de aprobarse con capa, opciones y código (US-199); uno descartado, en ningún lado, ni rastro de que existió; la cuenta de quién escribió cada comentario de origen (son extractos del campo libre, sin autor); dos ítems que preguntan lo mismo sin fusionarse en uno.

## Adónde va

Lo que se aprueba acá alimenta Reseñar (los ítems que se ofrecen para responder), la [Ficha de cátedra](../../../../student/choose-where-to-study/screens/SC-002-chair/README.md) y las demás fichas, y Método (publica el catálogo entero, [Llevarse el dato](../../../../student/take-the-data/README.md)). Llega desde el pipeline de destilación, que no tiene pantalla propia: lee el campo libre de todas las reseñas, se hayan contado sus respuestas o no ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)).

## Decisiones que aplica

[ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (el catálogo versionado: código estable, texto que puede afinarse, significado que si cambia corta la serie), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre alimenta la destilación siempre; las notas editoriales sin nombres, a nivel carrera o institución), las siete reglas de [`phrases.md`](../../../../phrases.md).

## Lo que esta ficha deja abierto

- **Si la destilación corre cada cuánto y con qué modelo**: decisión técnica pendiente; US-199 solo fija que hay una cola antes de ofrecer un ítem.
- **Cuántos comentarios hacen falta para que la máquina proponga una candidata** (el flujo no lo dibuja).
- **Cómo se versiona el catálogo** para que una cita de Rocío se reproduzca: US-187 pide la fecha de lectura, no cómo se guarda el corte.
- **Si "curar los ítems" es un rol aparte** o lo cubre quien ya carga el catálogo: la épica lo nombra distinto sin decidirlo.
