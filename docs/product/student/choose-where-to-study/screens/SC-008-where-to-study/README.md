# Dónde estudiarla (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la comparación y sus tres estados; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); **hi-fi en la dirección Boletín** ([ADR-0071](../../../../../decisions/0071-the-visual-language-is-a-bulletin.md), 2026-08-19; el mid-fi quedó en git). Pública, sin cuenta: se lee sin login, como toda pantalla de esta épica (US-168). Sin slug hoy.

## Quién la usa

**Valentina** (compara antes de decidir cinco años, y no le cree a un número redondo), **Silvia** (lee la duración real y quién se recibe, sin vocabulario académico), y quien lee en general, sin cuenta. El flujo entero: [`flow.md`](../../flow.md).

## Qué stories resuelve

US-128 (dueña: la misma carrera canónica lado a lado, dato por dato, sin compuesto ni ganador y sin ordenar por valor), US-127 (duración nominal, real y brecha, y de cuántos egresados sale), US-131 (cada proporción con sus voces, su período y su encogimiento), US-133 (Silvia: duración real y la cohorte cerrada se leen sin abrir nada ni saber vocabulario académico), US-134 (la cabecera espera el gate de cobertura; debajo, la cobertura a la vista), US-171 (nunca destacada, patrocinada ni ordenada por conveniencia), US-195 (la carrera canónica que se compara la decide el catálogo, nunca el parecido del nombre), US-204 (ofertas de la misma institución en dos planes por reforma: si se comparan como una columna o como dos queda abierto). La letra de cada uno: [README de la épica](../../README.md).

## Qué muestra

- **Encabezado**: la carrera canónica que se compara (la decide el catálogo, no el parecido del nombre: "Ingeniería en Sistemas" puede agrupar una oferta llamada distinto en otra institución), cuántas ofertas hay cargadas, y el criterio de orden: alfabético o por voces, nunca por valor.
- **Por oferta, lado a lado**: la institución, con link a su ficha; duración nominal del plan y duración real (mediana de los egresados que dijeron cuándo entraron y cuándo se recibieron, de los que se recibieron y reseñaron acá) con la brecha en años; las tres proporciones de la cohorte cerrada más próxima, cada una con su propio encogimiento ("se recibió 41% (encogido 35%) · se fue 22% (encogido 17%) · no dijo o sigue 37% (encogido 31%)", de quienes entraron esos años y reseñaron acá): no suman 100 porque cada proporción viaja con su encogimiento, y el corte de la cohorte depende de la duración nominal de cada oferta; las dos cabeceras con su predicado ("X de cada 10 dicen que es dura"; "X de cada 10 marcaron alguien fallando") con voces y encogimiento cuando la cobertura pasó la mitad de las materias canónicas, o "todavía no derivamos" con la cobertura a la vista si no llegó; debajo, por eje, la lista de frases con sus voces, su proporción encogida y en cuántas materias aparece, y al pie del panel el período de las voces que la sostienen ("voces de 2021 a 2025").
- **Nunca un compuesto ni una oferta remarcada**: no hay columna de total ni ganador; el orden es alfabético o por voces. Quien quiere ordenar distinto baja el CSV en [Método](../../../take-the-data/screens/SC-021-method/README.md).

## Estados

- **Una oferta sin cabecera**: la cobertura todavía no pasó la mitad de las materias canónicas; titula con la carrera canónica y aclara en muted cómo se llama en esa institución cuando difiere; se ve "todavía no derivamos" con la cobertura a la vista, y lo que ya existe (duración nominal, cohorte si cerró) se sigue mostrando.
- **Una oferta sin voces**: recién cargada por el catálogo; se ve el dato de catálogo (duración nominal) y que todavía no hay ninguna voz, sin inventar un cero.
- **Solo una oferta cargada**: la carrera canónica existe en una sola institución todavía; la pantalla dice "no hay con qué comparar todavía" en vez de mostrar una comparación vacía.

## Lo que no muestra nunca

Ningún compuesto ni número único por oferta (ADR-0064); ningún ganador, oferta remarcada ni "recomendado" (ADR-0067 punto 6); ningún orden por valor, destacado o conveniencia (US-171); ningún puntaje 1 a 5 (ADR-0064); nunca pide cuenta para leer (US-168).

## Adónde va

Llega desde la Ficha de carrera, después de leer su trayectoria y sus listas por eje. Va a: la Ficha de carrera de cada oferta comparada, a [Método](../../../take-the-data/screens/SC-021-method/README.md) para bajar el CSV si querés ordenar distinto, y a [Reseñar](../../../write-a-review/screens/SC-015-write-review/README.md) si quien lee quiere aportar a alguna de las ofertas.

## Decisiones que aplica

[ADR-0067](../../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (lado a lado, sin ordenar por valor; la carrera canónica la decide el catálogo: US-195), [ADR-0066](../../../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (el gate de cobertura, sin piso), [ADR-0065](../../../../../decisions/0065-attribution-is-the-axis-not-a-split.md) (las dos proporciones de la cabecera), [ADR-0064](../../../../../decisions/0064-phrases-with-voices-not-scores.md) (frases con voces, no puntaje).

## Lo que esta ficha deja abierto

- **El layout en celular con más de tres ofertas**: cuántas entran lado a lado y qué pasa con el resto.
- **Ofertas de la misma institución en dos planes** (reforma, US-204): si se comparan como una columna sola o como dos.
- **Cuál de los dos criterios de orden es el default**, alfabético o por voces: ADR-0067 permite los dos y no elige.
