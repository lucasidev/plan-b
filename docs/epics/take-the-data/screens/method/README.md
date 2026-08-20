# Método (la pantalla)

> Ficha de pantalla, dueña: la épica [Llevarse el dato](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de sus bloques; revisada el 2026-08-19 ([registro](../../../../reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Pública, sin cuenta: se lee y se descarga sin login (O6-1). Slug hoy sin slug (hoy es sección de la landing, del inventario).

## Quién la usa

**Rocío** (necesita el crudo, no nuestras conclusiones: nos usa y a la vez nos audita), **Valentina** (quiere poder descartar un número con fundamento antes de citarlo), y quien lee en general, para desarmar cualquier cifra que vio en una ficha. El flujo entero: [`flow.md`](../../flow.md).

## Qué stories resuelve

O8-1 (el CSV, dos tablas, agregado, sin testimonios), O8-2 (qué no cubrimos: cargadas, en cola y pedidas, cobertura por plan, cuentas afuera por inconsistencia), O8-3 (la fórmula pública y cada dato con sus voces y su período), O8-4 (ninguna ficha afirma una causa), O8-5 (la postura: sin acuerdos con instituciones), O8-6 (cuánto se bajó y por qué, por categoría, sin contenido), O8-7 (el texto retirado se ve como retirado, en la ficha del sujeto), O8-8 (la lista se reprocesa; cuál es destilada), O1-4 (la fórmula, cómo se suman las voces y se derivan las fichas, los sesgos). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra

- **La fórmula**: el encogimiento es el límite inferior del intervalo de Wilson, publicado tal cual con sus tres variables (p, n, z = 1,96), con un ejemplo de lectura: con pocas voces la proporción sale baja y sube sola con el corpus (O1-4, O8-3).
- **Cómo se derivan las fichas**: arriba de la cursada, una voz es una persona hablando de una cursada, y se suma; la materia, la cátedra, la carrera y la institución se arman sumando las voces de las cursadas que les pertenecen (O1-4, O8-3).
- **El catálogo de frases entero**: sujeto y eje de cada una, con el encabezado de la tabla y unas filas de ejemplo, y "ver las 46"; marca cuáles están destiladas y qué significa esa marca (O8-8, O1-4).
- **Los sesgos declarados**: de quienes reseñaron; la duración real, solo de los que se recibieron; la co-cursada, solo de quien reseñó las dos materias (O8-2).
- **Qué no cubrimos**: cuántas carreras están cargadas, en cola y pedidas; la cobertura de cada plan; cuántas cuentas quedaron afuera por inconsistencia (O8-2).
- **Cuánto se bajó y por qué**: cuántos textos se bajaron y en qué categoría, sin su contenido, con la aclaración de que sus voces siguen contando (O8-6).
- **La política de moderación y réplica**: pública desde antes de que exista el primer reporte, por una restricción del catálogo y no por una story propia de esta épica: el criterio escrito de qué es exposición y el único caso de riesgo inmediato (BO2-1), el chequeo previo (T2-1) y las reglas de la réplica (T2-2, O7-8).
- **La postura**: sin acuerdos con instituciones; en ningún lado se afirma una causa (O8-4, O8-5).
- **La descarga del crudo, sin cuenta**: las dos tablas (frases por sujeto y período con voces y eje; los agregados de trayectoria) y lo que no viene: nombre, cuenta, perfil, testimonios en bloque (O8-1).

## Lo que no muestra nunca

Ningún ranking ni comparación con ganador (eso es Dónde estudiarla, no esta pantalla); el contenido de un texto retirado, solo su categoría (O8-6, O8-7); ninguna causa ni explicación de por qué pasa algo (O8-4); ningún convenio ni trato preferencial con una institución (O8-5); nunca pide cuenta para leer ni para descargar (O6-1, O8-1).

## Adónde va

Llega desde cualquier ficha ("cómo se calcula", al pie), desde Explorar, y desde [Dónde estudiarla](../../../choose-where-to-study/screens/where-to-study/README.md) cuando alguien quiere ordenar y baja el CSV. Va a: la descarga del CSV, adentro de la misma pantalla, y de vuelta a la ficha de la que vino.

## Decisiones que aplica

[ADR-0064](../../../../decisions/0064-phrases-with-voices-not-scores.md) (la fórmula de Wilson y el catálogo de frases publicados enteros), [ADR-0066](../../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (cómo se suman las voces y se derivan las fichas, la cobertura), [ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la segunda tabla del CSV, los chequeos de consistencia publicados), [ADR-0068](../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el texto no va al CSV ni se exporta en bloque; las bajas, contables por categoría), [THESIS.md](../../../../THESIS.md) (sección "Posición": sin acuerdos con instituciones).

## Lo que esta ficha deja abierto

- **Si Método es una pantalla o varias**: la fórmula, el catálogo de frases, los sesgos, qué no cubrimos, cuánto se bajó, la política de moderación y la descarga son mucho contenido para un solo scroll.
- **El formato exacto del CSV**: columnas, codificación, si trae el encogimiento ya calculado o solo k y n.
- **Con qué periodicidad se regenera** el crudo.
