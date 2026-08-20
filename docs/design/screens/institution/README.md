# Ficha de institución (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de las tres cosas que no se mezclan, la serie y la comparación; revisada el 2026-08-19 ([registro](../../../reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública, se lee sin cuenta. Slug hoy `/universities/[slug]/careers` (el chasis; la ficha se rehace; del inventario). Épicas que la componen: [Elegir dónde estudiar](../../../epics/choose-where-to-study/README.md) (la lectura: qué se dice de ella como sujeto, la serie, la comparación frase por frase), [Replicar](../../../epics/reply/README.md) (la réplica institucional al lado del testimonio del evento) y [Reseñar](../../../epics/write-a-review/README.md) (el evento institucional llega acá).

## Quién la usa

**Claudia** y la institución (leen la serie para saber si mejoraron desde que se publicó algo), **Prof. Paredes** (no responde, pero la ficha declara su estado igual), **Valentina** y **Silvia** (comparan instituciones antes de elegir), **Rocío** (cita un evento institucional en una reunión).

## Qué stories resuelve

[O4-13](../../../epics/write-a-review/README.md#stories) (el evento institucional se reseña aparte, sin materia, y sus frases van acá), [O7-7](../../../epics/reply/README.md#stories) (la serie por el período en que pasó, con la publicación y la réplica marcadas), [O7-3](../../../epics/reply/README.md#stories) (la comparación frase por frase contra las demás instituciones cargadas, sin puesto), [O7-1](../../../epics/reply/README.md#stories) (la réplica institucional al lado del testimonio, con nombre e identidad verificada) y D06 (el estado del canal cuando no hay réplica, nunca "no quiso responder"). La letra completa de cada una está en el README de su propia épica.

## Qué muestra

- **Tres cosas que nunca se mezclan en un número** ([ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)): (a) lo que se dice de ella **como sujeto**, las frases de institución, administración y centro de estudiantes del [catálogo](../../../domain/phrases.md) (F30 a F46) con sus voces; acá entran los eventos institucionales, con sus propios testimonios y votos ([O4-13](../../../epics/write-a-review/README.md#stories)); (b) **sus cursadas**, las carreras que da, cada una con link a su propia [Ficha de carrera](../career/README.md); (c) **el estado de su catálogo**, qué está cargado.
- **La serie**, por el período en que pasó, sin suavizar, con la publicación y la réplica marcadas ([O7-7](../../../epics/reply/README.md#stories): "si mejoré desde que lo publicaron").
- **La comparación**, frase por frase contra las demás instituciones cargadas, lado a lado, sin puesto ni orden por valor ([O7-3](../../../epics/reply/README.md#stories)).
- **La réplica institucional**, al lado del testimonio del evento, con nombre e identidad verificada; cuando no hay, el estado del canal, nunca el silencio ([O7-1](../../../epics/reply/README.md#stories), D06).

**Estados**:
- **Vacía**: cargada, sin voces ni eventos todavía; arranca vacía y la primera voz ya se publica.
- **Sin eventos todavía**: hay carreras con voces (sus cursadas) pero nadie reseñó un evento institucional; lo que se dice de ella como sujeto está vacío y lo dice, sin inventar un cero.

## Lo que no muestra nunca

Ningún número que mezcle sujeto, cursadas y cobertura ([ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)); ningún puesto, compuesto ni orden por valor en la comparación entre instituciones ([ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)); nunca "no quiso responder": el silencio es el estado del canal (D06); ninguna réplica que cite la parte del testimonio marcada como identificante ([ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)).

## Adónde va

Llega desde: Explorar, Buscar, la [Ficha de carrera](../career/README.md) (la institución que la da) y Reseñar (al reseñar un evento institucional). Va a: la Ficha de carrera de cada carrera que ofrece, [Responder](../../../epics/reply/screens/respond/README.md) (identidad institucional verificada), las demás instituciones comparadas y [Método](../../../epics/take-the-data/screens/method/README.md) (cómo se calcula).

## Decisiones que aplica

[ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (las tres cosas separadas, nunca un número que las mezcle), [ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la serie por el período en que pasó; la comparación lado a lado sin ordenar por valor), [ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (la réplica pasa el mismo chequeo, no cita lo marcado, queda al lado sin bajar el testimonio), D06 (el estado del canal, [registro del 17](../../../reviews/2026-08-17-catalog-propagation.md)).

## Lo que esta ficha deja abierto

- **Cómo se agrupan los eventos institucionales**: por tipo (trámites, mesas, título) o en una sola lista cronológica.
- **Si la comparación frase por frase es una sección de esta ficha o una pantalla aparte**, como Dónde estudiarla lo es para las carreras.
- **Si "sus cursadas" (b) muestra también un número agregado propio** (los dos ejes sumando todas las cursadas de todas sus carreras, como lo define ADR-0066 punto 2) o solo la lista de carreras con link a cada ficha, que es lo que muestra este boceto.
