# Llevarse el dato

> Épica del grupo **O8 · Llevarme el dato (para discutirlo afuera)** del [catálogo](../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y su pantalla propia con ficha y boceto mid-fi ([Método](screens/SC-021-method/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Descargar el crudo sin registrarse: dos tablas (frases por sujeto y período con sus voces y su eje; los agregados de trayectoria), agregado y nada más fino que lo publicado, nunca nombre, cuenta ni perfil, sin testimonios en bloque. Junto con Método (la fórmula del encogimiento publicada tal cual, el catálogo de frases entero, los sesgos declarados, qué no cubrimos todavía, cuánto se bajó del corpus y por qué) y, en cada ficha, el texto retirado visible con su categoría y la marca de frase destilada con la fecha de su último reproceso. Es la épica que hace posible que Rocío cite un número sin que se lo puedan desarmar, y que ninguna ficha afirme una causa que el dato no sostiene.

## Para quién

**Rocío** (necesita el crudo, no nuestras conclusiones; nos usa y a la vez nos audita). **Quien lee** (ve el texto retirado y la marca de destilada en cada ficha, US-185, US-186).

## Stories

Las 8 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-180](stories/US-180-download-the-data-as-csv.md) | Descargar el crudo sin registrarse |
| [US-181](stories/US-181-disclose-takedown-counts-by-category.md) | Cuánto se bajó del corpus |
| [US-182](stories/US-182-disclose-coverage-gaps-and-biases.md) | Publicar qué no cubrimos todavía |
| [US-183](stories/US-183-make-the-method-fully-public.md) | Publicar el método y la fórmula |
| [US-184](stories/US-184-never-state-a-cause.md) | Nunca afirmar una causa |
| [US-185](stories/US-185-declare-no-deals-with-institutions.md) | Sin acuerdos con las instituciones |
| [US-186](stories/US-186-mark-where-a-testimony-was-removed.md) | Marcar el texto retirado |
| [US-187](stories/US-187-declare-reprocessing-and-distilled-phrases.md) | Declarar el reproceso y la destilación |


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0064](../../decisions/0064-phrases-with-voices-not-scores.md) (la fórmula de Wilson publicada tal cual en Método), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (el CSV gana la segunda tabla de trayectoria; los chequeos de consistencia por cuenta publicados en el método; todo número "de los que reseñaron"), [ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el texto no va al CSV ni se exporta en bloque; las bajas se publican contables por categoría), [ADR-0066](../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (cobertura declarada en todo dato derivado), [THESIS.md](../../THESIS.md) ("Posición": sin acuerdos con instituciones; el crudo se descarga sin registro), D09 ([registro del 17](../../history/reviews/2026-08-17-catalog-propagation.md): la segunda capa de US-218, el lector externo, lee el registro ya disociado).

## Pantallas

La que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Método**](screens/SC-021-method/README.md) (pública, sin cuenta; compartida con [Elegir dónde estudiar](../choose-where-to-study/README.md)): la fórmula del encogimiento, cómo se derivan las fichas, el catálogo de frases entero, los sesgos declarados, qué no cubrimos, cuánto se bajó y por qué, la política de moderación y réplica, la postura y la descarga del crudo; [boceto mid-fi](screens/SC-021-method/sketch.html) de sus bloques.

Las que comparte con otras épicas: la [Ficha de cátedra](../choose-where-to-study/screens/SC-002-chair/README.md), la [Ficha de materia](../choose-where-to-study/screens/SC-007-subject/README.md), la [Ficha de carrera](../choose-where-to-study/screens/SC-001-career/README.md) y la [Ficha de institución](../reply/screens/SC-005-institution/README.md) (cada una con su número con voces y período, el texto retirado con su categoría, la marca de destilada y la fecha del último reproceso).

## Lo que esta épica todavía no resuelve

- **El formato exacto del CSV**: columnas, codificación, si trae el encogimiento ya calculado o solo k y n.
- **Con qué periodicidad se regenera** el crudo.
- **Si Método es una pantalla o varias**: la fórmula, el catálogo de frases, los sesgos, la descarga y la política de moderación que las Restricciones del catálogo piden publicar ahí.
- **Cómo se prueba que ningún cruce del CSV identifica a nadie** (US-159, en [Reseñar](../write-a-review/README.md)): hace falta una prueba sobre las dos tablas, no alcanza con declarar que no hay piso.
