# Llevarse el dato

> Épica del grupo **O8 · Llevarme el dato (para discutirlo afuera)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y su pantalla propia con ficha y boceto mid-fi ([Método](screens/SC-021-method/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Descargar el crudo sin registrarse: conteos por ítem, sujeto y período con sus voces, más la tasa de finalización y la co-cursada, agregado y nada más fino que lo publicado, nunca nombre, cuenta ni perfil, sin reseñas individuales. Junto con Método (la regla de comparación entre hermanas publicada tal cual, el catálogo de ítems entero, los sesgos declarados, qué no cubrimos todavía) y, en cada ficha, la marca de ítem destilado con la fecha de su último reproceso. Es la épica que hace posible que Rocío cite un número sin que se lo puedan desarmar, y que ninguna ficha afirme una causa que el dato no sostiene.

## Para quién

**Rocío** (necesita el crudo, no nuestras conclusiones; nos usa y a la vez nos audita). **Quien lee** (ve la marca de destilado en cada ficha, US-187).

La persona de este tramo no es la alumna: es **quien investiga**. Vive igual en `student/` como cierre del recorrido de lectura (leí, aporté, me llevo el dato para discutirlo afuera): un recorrido propio de un solo tramo sería una carpeta por pureza ([ADR-0077](../../../decisions/0077-the-product-docs-read-as-journeys.md), duda cerrada el 2026-08-23).

## Stories

Las 8 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-180](stories/US-180-download-the-data-as-csv/README.md) | Descargar el crudo sin registrarse |
| [US-181](stories/US-181-disclose-takedown-counts-by-category/README.md) | Cuánto se bajó del corpus (concepto rebasado el 2026-08-25, ver la story) |
| [US-182](stories/US-182-disclose-coverage-gaps-and-biases/README.md) | Publicar qué no cubrimos todavía |
| [US-183](stories/US-183-make-the-method-fully-public/README.md) | Publicar el método y la fórmula |
| [US-184](stories/US-184-never-state-a-cause/README.md) | Nunca afirmar una causa |
| [US-185](stories/US-185-declare-no-deals-with-institutions/README.md) | Sin acuerdos con las instituciones |
| US-186 | ~~Marcar el texto retirado~~ (concepto rebasado el 2026-08-25: dependía de testimonios publicados, que [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) retira; nunca tuvo carpeta propia) |
| [US-187](stories/US-187-declare-reprocessing-and-distilled-phrases/README.md) | Declarar el reproceso y la destilación |


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0083](../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (la regla de comparación entre hermanas, con Wilson como maquinaria interna, publicada tal cual en Método), [ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (todo número es "de los que reseñaron": saltear vale y el denominador de cada ítem son quienes lo respondieron; el piso de 10 reseñas), [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre no va al CSV ni se exporta en bloque, porque nunca se publica), [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md) (cobertura declarada en todo dato derivado; la duración real y el egreso por cohorte como dato oficial, no autorreportado), [THESIS.md](../../../THESIS.md) ("Posición": sin acuerdos con instituciones; el crudo se descarga sin registro), D09 ([registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md): la segunda capa de US-218, el lector externo, lee el registro ya disociado).

## Pantallas

La que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Método**](screens/SC-021-method/README.md) (pública, sin cuenta; compartida con [Elegir dónde estudiar](../choose-where-to-study/README.md)): la regla de comparación entre hermanas, cómo se derivan las fichas, el catálogo de ítems entero, los sesgos declarados, qué no cubrimos, la postura y la descarga del crudo; [boceto mid-fi](screens/SC-021-method/sketch.html) de sus bloques.

Las que comparte con otras épicas: la [Ficha de cátedra](../choose-where-to-study/screens/SC-002-chair/README.md), la [Ficha de materia](../choose-where-to-study/screens/SC-007-subject/README.md), la [Ficha de carrera](../choose-where-to-study/screens/SC-001-career/README.md) y la [Ficha de institución](../../reviewed/reply/screens/SC-005-institution/README.md) (cada una con sus conteos con voces y período, la marca de destilada y la fecha del último reproceso).

## Lo que esta épica todavía no resuelve

- **El formato exacto del CSV**: columnas, codificación, si trae la proporción por opción ya calculada o solo el conteo crudo.
- **Con qué periodicidad se regenera** el crudo.
- **Si Método es una pantalla o varias**: la regla de comparación, el catálogo de ítems, los sesgos, la descarga y la política de moderación que las Restricciones del catálogo piden publicar ahí.
- **Cómo se prueba que ningún cruce del CSV identifica a nadie** (US-159, en [Reseñar](../write-a-review/README.md)): hace falta una prueba sobre las dos tablas, no alcanza con declarar que el piso de 10 alcanza.
- **Qué reemplaza a US-181 y a US-186**: las dos dependían de testimonios publicados que [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) retira; falta decidir si la épica declara otra cosa sobre el campo libre no destilado o las retira.
