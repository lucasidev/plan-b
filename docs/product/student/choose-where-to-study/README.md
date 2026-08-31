# Elegir dónde estudiar

> Épica del grupo **O1 · Decidir dónde estudiar (y poder desconfiar del número)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y su pantalla propia con ficha y boceto ([Dónde estudiarla](screens/SC-008-where-to-study/README.md)); reescrita al modelo de conteos el 2026-08-25 ([ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Leer el escrutinio sin cuenta para decidir dónde estudiar. La ficha de una cátedra con los hechos que la marcan por convergencia, sus dos bloques que no se suman (qué hizo la cátedra, qué les pasó a los que cursaron) con la moda y la distribución de cada ítem, y la tasa de finalización comparada contra sus hermanas de la misma materia; la ficha de una carrera con sus datos oficiales con fuente (cuánto dura en el papel y en la realidad, cuánto egresa por cohorte), qué frena la cursada según reseñas y la cobertura siempre a la vista; la misma carrera canónica lado a lado en Dónde estudiarla, dato por dato y sin ganador; la búsqueda que entiende que lo que te recomiendan es una persona; y Método al alcance para poder desarmar cualquier número. Es la épica de la lectura: la decisión 3 de la tesis (leer no pide cuenta) se verifica acá en cada pantalla. Y por eso le tocan las situaciones de lectura que el mapa agrupaba aparte como temas: la ficha que dice que arranca vacía y explica el piso mientras no lo alcanza (US-136), y por qué un dato aparece en una ficha y no en otra (US-138).

## Para quién

**Valentina** (tiene que decidir cinco años con un folleto; desconfía de los rankings y necesita uno: si le mostramos un número redondo lo descarta, si le mostramos de qué está hecho lo usa), **Silvia** (paga la cuota y no pisa la facultad: quiere saber si termina en un título, sin vocabulario académico), y **quien lee** (busca por materia, carrera o docente).

## Stories

Las 12 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

> US-127 y US-133 no salen de reseñas: son datos oficiales, relevados contra fuente pública (SPU/CONEAU) y publicados siempre con su fuente y su fecha ([ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md)). US-143 (la co-cursada) y US-152 (Reseñar) sí salen de lo que declara quien reseña, pero de la capa de contexto (cuándo cursaste, cómo terminó), no del catálogo de ítems ([ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)): se preguntan de a uno, en el momento en que aparecen, nunca como inventario, y el silencio no se infiere.

| ID | De qué trata |
|---|---|
| [US-221](stories/US-221-see-the-instrument-working-on-arrival/README.md) | Entender qué es esto viendo una ficha real |
| [US-222](stories/US-222-browse-what-there-is-to-study/README.md) | Ver qué hay para estudiar sin saber qué buscar |
| [US-127](stories/US-127-see-how-long-it-really-takes/README.md) | Ver cuánto tarda de verdad la carrera |
| [US-128](stories/US-128-compare-the-same-career-side-by-side/README.md) | Comparar la misma carrera en varias instituciones |
| [US-129](stories/US-129-attribute-difficulty-to-career-or-institution/README.md) | Atribuir la dificultad: carrera o facultad |
| [US-130](stories/US-130-see-how-each-number-is-calculated/README.md) | Ver cómo se calcula cada número |
| [US-131](stories/US-131-see-how-many-voices-support-it/README.md) | Ver sobre cuántas voces se calcula |
| [US-132](stories/US-132-search-by-subject-career-or-teacher/README.md) | Buscar por materia, carrera o docente |
| [US-133](stories/US-133-see-if-it-leads-to-graduation/README.md) | Saber si termina en un título |
| [US-134](stories/US-134-check-the-coverage-behind-the-card/README.md) | Saber para cuánta carrera vale un dato |
| [US-136](stories/US-136-understand-being-the-first-voice/README.md) | Entender la ficha vacía cuando llego primero |
| [US-138](stories/US-138-understand-why-weight-differs-by-level/README.md) | Entender por qué un dato aparece en una ficha y no en otra |
| [US-143](stories/US-143-check-which-subjects-to-take-together/README.md) | Saber qué materias se pueden llevar juntas |

Las filas con "tema del mapa" vienen de los grupos transversales del mapa (T2 · Cuando el riesgo es real; T3 · Cuando el catálogo no alcanza): son temas, no actividades, y cada uno de sus requisitos vive en la única épica que lo implementa; el índice del [catálogo](../../README.md) conserva el tema como lista.

**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (la reseña de cursada en tres capas: contexto, qué hizo la cátedra, qué te pasó a vos; el piso de 10 reseñas por cátedra), [ADR-0083](../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (moda, distribución completa por opción, la fama por convergencia, la comparación entre hermanas con intervalos de Wilson, la tasa de finalización agregada, la cobertura condicionando todo agregado; sin puntaje), [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre no se publica: alimenta la curaduría, que puede escribir una nota editorial sin nombres en la Ficha de carrera o de institución), [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md) (tres instrumentos: la reseña de cursada deriva materia y carrera; los datos oficiales con fuente vienen del relevamiento; Dónde estudiarla compara datos oficiales medidos igual para todas, con el régimen de ingreso al lado del egreso), D04 (el denominador de cobertura son las materias canónicas de la carrera en todos sus planes). El catálogo de ítems que se lee: [`phrases.md`](../../phrases.md).

## Pantallas

La que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Dónde estudiarla**](screens/SC-008-where-to-study/README.md) (pública, sin cuenta): la misma carrera canónica en varias instituciones, lado a lado, sin ganador; [boceto hi-fi](screens/SC-008-where-to-study/sketch.html) de la comparación y sus estados.

Las que comparte con otras épicas: [**La entrada**](screens/SC-004-entrance/README.md) (la vitrina), [**Explorar**](screens/SC-003-explore/README.md) (el home real: dos lentes, carreras y universidades), [**Buscar**](screens/SC-006-search/README.md) (diseñada sin construir: resultados de los cuatro sujetos), [**Ficha de carrera**](screens/SC-001-career/README.md), [**Ficha de institución**](../../reviewed/reply/screens/SC-005-institution/README.md) (dueña [Responder](../../reviewed/reply/README.md): sus stories tienen rol "la institución"), [**Ficha de materia**](screens/SC-007-subject/README.md), la [Ficha de cátedra](screens/SC-002-chair/README.md), y [**Método**](../take-the-data/screens/SC-021-method/README.md) (dueña [Llevarse el dato](../take-the-data/README.md)).

## Lo que esta épica todavía no resuelve

- **Cómo se leen los datos oficiales para Silvia** sin vocabulario académico: el copy de "dura en el papel", "dura en la realidad" y "egresan por cohorte", sin abrir nada (US-133). Es diseño de la Ficha de carrera.
- **Cómo se dibuja la co-cursada** (US-143) en la Ficha de carrera y en la Ficha de materia: el boceto vigente de las dos no la incluye. La duda de dónde vive se cerró con [ADR-0086](../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md): vive acá, pública y sin filtrar, porque la pantalla que la filtraba a tu plan se retiró con la épica Mi carrera.
- **Qué acciones de lectura entran además de reseñar**: corregir un dato (de otra épica) todavía no están bocetadas en la Ficha de cátedra ni en la Ficha de materia, aunque sus stories dueñas las sigan pidiendo ahí.
- **Dónde estudiarla con más de tres ofertas**: cuántas entran lado a lado en un celular y qué pasa con el resto (alfabético o por voces; el que quiere ordenar baja el CSV).
- **Qué muestra Explorar** además de las dos lentes: si lista por cobertura, por voces o alfabético (US-171 prohíbe cualquier orden por conveniencia).
- **Inicio** entra por esta épica (es la puerta a Explorar y Buscar) pero su identidad visual se diseña con criterio propio, aparte del producto.
