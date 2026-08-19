# Frases (la pantalla)

> Ficha de pantalla, dueña: la épica [Sostener el catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisión adversarial pendiente antes del hi-fi. Backoffice, rol curaduría de frases (editorial, sin persona propia entre las cuatro del equipo). Sin slug hoy.

## Quién la usa

**Quien cura las frases**: el catálogo de stories lo nombra como rol distinto del de Sofía, sin persona propia entre las cuatro del equipo; lo cumple quien el equipo asigne. El flujo entero: [`flow.md`](../../flow.md), sección BO-9.

## Qué stories resuelve

BO1-8 (dueña: el catálogo de frases se edita en un lugar, cada cambio con autor y fecha, corregir un eje reprocesa las fichas afectadas), BO1-9 (la cola de curaduría de destiladas, aprobar con sujeto y eje o descartar), O8-8 (recién aprobada se ofrece marcada como destilada, síntesis y no cita). La letra de cada una: [README de la épica](../../README.md#stories); la de O8-8, en la épica que la implementa.

## Qué muestra

El catálogo entero de [`phrases.md`](../../../../domain/phrases.md) en una sola tabla: redacción, sujeto, eje, sentido, y autor y fecha del último cambio de cada frase; se edita ahí mismo. Corregir el eje de una frase existente pide confirmar, porque reprocesa las fichas que la usan (BO1-8): la pantalla dice cuántas antes de aplicar.

Debajo, la cola de curaduría: cada candidata que la destilación propuso, con los comentarios de los que salió, y dos salidas. **Aprobar**, asignándole sujeto y eje: recién ahí se ofrece para marcar, marcada como destilada (BO1-9, O8-8). **Descartar**: no se ofrece nunca, y no queda rastro público.

**Estado "cola vacía"**: no hay candidatas esperando curaduría. **Estado "una destilada en revisión"**: la candidata con sus comentarios de origen, sin aprobar ni descartar todavía.

## Lo que no muestra nunca

Una destilada ofrecida para marcar antes de aprobarse con sujeto y eje (BO1-9); una descartada, en ningún lado, ni rastro de que existió; la cuenta de quién escribió cada comentario de origen (son extractos del texto, no el testimonio completo con su autor); dos frases que admiten la misma lectura sin partir en dos (regla 3 del catálogo).

## Adónde va

Lo que se aprueba acá alimenta Reseñar (las frases que se ofrecen para marcar), la [Ficha de cátedra](../../../../design/screens/chair/README.md) y las demás fichas (las listas por eje), y Método (publica el catálogo entero, [Llevarse el dato](../../../take-the-data/README.md)). Llega desde el pipeline de destilación, que no tiene pantalla propia: lee los comentarios de todas las reseñas, publicadas o no, retiradas o no (ADR-0068 punto 7).

## Decisiones que aplica

[ADR-0065](../../../../decisions/0065-attribution-is-the-axis-not-a-split.md) (la atribución la decide el eje: corregirlo es un error en todas las fichas que usan esa frase), [ADR-0064](../../../../decisions/0064-phrases-with-voices-not-scores.md) (frase semilla y frase destilada; la destilada es dato derivado, no cita), las seis reglas de [`phrases.md`](../../../../domain/phrases.md).

## Lo que esta ficha deja abierto

- **Si la destilación corre cada cuánto y con qué modelo**: decisión técnica pendiente; BO1-9 solo fija que hay una cola antes de ofrecer una frase.
- **Cuántos comentarios hacen falta para que la máquina proponga una candidata** (el flujo no lo dibuja).
- **Cómo se versiona el catálogo** para que una cita de Rocío se reproduzca: O8-8 pide la fecha de lectura, no cómo se guarda el corte.
- **Si "curar las frases" es un rol aparte** o lo cubre quien ya carga el catálogo: la épica lo nombra distinto sin decidirlo.
