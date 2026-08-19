# Dónde estudiarla (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la comparación y sus tres estados; revisión adversarial pendiente antes del hi-fi. Pública, sin cuenta: se lee sin login, como toda pantalla de esta épica (O6-1). Slug hoy sin slug (del inventario).

## Quién la usa

**Valentina** (compara antes de decidir cinco años, y no le cree a un número redondo), **Silvia** (lee la duración real y quién se recibe, sin vocabulario académico), y quien lee en general, sin cuenta. El flujo entero: [`flow.md`](../../flow.md).

## Qué stories resuelve

O1-2 (dueña: la misma carrera canónica lado a lado, dato por dato, sin compuesto ni ganador y sin ordenar por valor), O1-1 (duración nominal, real y brecha, y de cuántos egresados sale), O1-5 (cada proporción con sus voces, su período y su encogimiento), O1-7 (Silvia: duración real y la cohorte cerrada se leen sin abrir nada ni saber vocabulario académico), O1-8 (la cabecera espera el gate de cobertura; debajo, la cobertura a la vista), O6-4 (nunca destacada, patrocinada ni ordenada por conveniencia). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra

- **Encabezado**: la carrera canónica que se compara (la decide el catálogo, no el parecido del nombre: "Ingeniería en Sistemas" puede agrupar una oferta llamada distinto en otra institución), cuántas ofertas hay cargadas, y el criterio de orden: alfabético o por voces, nunca por valor.
- **Por oferta, lado a lado**: la institución, con link a su ficha; duración nominal del plan y duración real (mediana de los egresados que dijeron cuándo entraron y cuándo se recibieron) con la brecha en años; las tres proporciones de la cohorte cerrada más próxima con su período ("se recibió", "se fue", "no dijo o sigue"); las dos cabeceras (exigencia, gestión) con voces y encogimiento cuando la cobertura pasó la mitad de las materias canónicas, o "todavía no derivamos" con la cobertura a la vista si no llegó; debajo, por eje, la lista de frases con su proporción de voces y en cuántas materias aparece.
- **Nunca un compuesto ni una oferta remarcada**: no hay columna de total ni ganador; el orden es alfabético o por voces. Quien quiere ordenar distinto baja el CSV en [Método](../../../take-the-data/screens/method/README.md).

**Estados**:
- **Una oferta sin cabecera**: la cobertura todavía no pasó la mitad de las materias canónicas; se ve "todavía no derivamos" con la cobertura a la vista, y lo que ya existe (duración nominal, cohorte si cerró) se sigue mostrando.
- **Una oferta sin voces**: recién cargada por el catálogo; se ve el dato de catálogo (duración nominal) y que todavía no hay ninguna voz, sin inventar un cero.
- **Solo una oferta cargada**: la carrera canónica existe en una sola institución todavía; la pantalla dice "no hay con qué comparar todavía" en vez de mostrar una comparación vacía.

## Lo que no muestra nunca

Ningún compuesto ni número único por oferta (ADR-0064); ningún ganador, oferta remarcada ni "recomendado" (ADR-0067 punto 6); ningún orden por valor, destacado o conveniencia (O6-4); ningún puntaje 1 a 5 (ADR-0064); nunca pide cuenta para leer (O6-1).

## Adónde va

Llega desde la Ficha de carrera, después de leer su trayectoria y sus listas por eje. Va a: la Ficha de carrera de cada oferta comparada, a [Método](../../../take-the-data/screens/method/README.md) para bajar el CSV si querés ordenar distinto, y a [Reseñar](../../../write-a-review/screens/write-review/README.md) si quien lee quiere aportar a alguna de las ofertas.

## Decisiones que aplica

[ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (lado a lado, sin ordenar por valor; la carrera canónica la decide el catálogo: BO1-5), [ADR-0066](../../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (el gate de cobertura, sin piso), [ADR-0065](../../../../decisions/0065-attribution-is-the-axis-not-a-split.md) (las dos proporciones de la cabecera), [ADR-0064](../../../../decisions/0064-phrases-with-voices-not-scores.md) (frases con voces, no puntaje).

## Lo que esta ficha deja abierto

- **El layout en celular con más de tres ofertas**: cuántas entran lado a lado y qué pasa con el resto.
- **Ofertas de la misma institución en dos planes** (reforma, BO5-1): si se comparan como una columna sola o como dos.
- **Cuál de los dos criterios de orden es el default**, alfabético o por voces: ADR-0067 permite los dos y no elige.
