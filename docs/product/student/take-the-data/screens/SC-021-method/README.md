# Método (la pantalla)

> Ficha de pantalla, dueña: la épica [Llevarse el dato](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de sus bloques; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Pública, sin cuenta: se lee y se descarga sin login (US-168). Slug hoy sin slug (hoy es sección de la landing).

## Quién la usa

**Rocío** (necesita el crudo, no nuestras conclusiones: nos usa y a la vez nos audita), **Valentina** (quiere poder descartar un número con fundamento antes de citarlo), y quien lee en general, para desarmar cualquier cifra que vio en una ficha. El flujo entero: [`flow.md`](../../flow.md).

## Qué stories resuelve

US-180 (el CSV, dos tablas, agregado, sin reseñas individuales), US-182 (qué no cubrimos: cargadas, en cola y pedidas, cobertura por plan, cuentas afuera por inconsistencia), US-183 (la regla de comparación pública y cada dato con sus voces y su período), US-184 (ninguna ficha afirma una causa), US-185 (la postura: sin acuerdos con instituciones), US-187 (el catálogo se reprocesa; cuál frase es destilada), US-130 (cómo se suman las voces y se derivan las fichas, los sesgos), US-205 ([Moderar sin romper el producto](../../../../team/moderate-without-breaking-the-product/README.md#stories): publica el criterio escrito de exposición y el único caso de riesgo inmediato, como parte de la política pública). La letra de cada uno: [README de la épica](../../README.md#stories). US-181 y US-186 son concepto rebasado el 2026-08-25: dependían de testimonios publicados que [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) retira (ver sus fichas).

## Qué muestra

- **La regla de comparación**: el intervalo de Wilson que decide si dos cátedras hermanas se muestran distintas (ADR-0083), publicado tal cual con sus tres variables (p, n y el z del cálculo, cuyo valor lo fija el código y no un ADR); el piso de 10 reseñas por cátedra (ADR-0082) es lo que evita publicar proporciones de muestras chicas, no un ajuste sobre el número (US-130, US-183).
- **Cómo se derivan las fichas**: arriba de la cursada, una voz es una persona hablando de una cursada, y se suma a su cátedra; la materia, la carrera y la institución se arman sumando lo de las cátedras y cursadas que les pertenecen (US-130, US-183).
- **El catálogo de frases entero**: capa y opciones de cada una, con el encabezado de la tabla y unas filas de ejemplo, y "ver las frases completas"; marca cuáles están destiladas y qué significa esa marca (US-187, US-130).
- **Los sesgos declarados**: de quienes reseñaron; la co-cursada, solo de quien reseñó las dos materias; la duración real y el egreso por cohorte, dato oficial con su fuente, no de quienes reseñaron (US-182, ADR-0085).
- **Qué no cubrimos**: cuántas carreras están cargadas, en cola y pedidas; la cobertura de cada plan; cuántas cuentas quedaron afuera por inconsistencia (US-182).
- **Cuánto se bajó y por qué (concepto rebasado el 2026-08-25)**: dependía de testimonios publicados; ADR-0084 retira la publicación del campo libre. Falta decidir el reemplazo (US-181).
- **La política de moderación y respuesta**: pública desde antes de que exista el primer reporte, por una restricción del catálogo y no por un requisito propio de esta épica: el criterio escrito de qué es exposición y el único caso de riesgo inmediato (US-205), y las reglas de la respuesta del reseñado (US-179, US-178).
- **La postura**: sin acuerdos con instituciones; en ningún lado se afirma una causa (US-184, US-185).
- **La descarga del crudo, sin cuenta**: las dos tablas (frases por sujeto y período con voces; tasa de finalización y co-cursada) y lo que no viene: nombre, cuenta, perfil, reseñas individuales (US-180).

## Estados

No especificados en esta ficha: es mayormente una pantalla de contenido estático (la regla de comparación, el catálogo de frases, los sesgos, la política de moderación) con la descarga del CSV como única acción. Si esa descarga tiene un estado de espera o de error, y si el catálogo de frases pagina o carga incremental, queda para cuando se decida si Método es una pantalla o varias (ver "Lo que esta ficha deja abierto").

## Lo que no muestra nunca

Ningún ranking ni comparación con ganador (eso es Dónde estudiarla, no esta pantalla); el contenido del campo libre, nunca (ADR-0084); ninguna causa ni explicación de por qué pasa algo (US-184); ningún convenio ni trato preferencial con una institución (US-185); nunca pide cuenta para leer ni para descargar (US-168, US-180).

## Adónde va

Llega desde cualquier ficha ("cómo se calcula", al pie), desde Explorar, y desde [Dónde estudiarla](../../../choose-where-to-study/screens/SC-008-where-to-study/README.md) cuando alguien quiere ordenar y baja el CSV. Va a: la descarga del CSV, adentro de la misma pantalla, y de vuelta a la ficha de la que vino.

## Decisiones que aplica

[ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (la regla de comparación y el catálogo de frases publicadas enteras), [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (cómo se suman las voces y se derivan las fichas, la cobertura, la duración real y el egreso como dato oficial), [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (todo número es "de los que reseñaron": saltear vale y el denominador de cada frase son quienes la respondieron; el piso de 10 reseñas), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre no va al CSV ni se exporta en bloque, porque nunca se publica), [THESIS.md](../../../../../THESIS.md) (sección "Posición": sin acuerdos con instituciones).

## Lo que esta ficha deja abierto

- **Si Método es una pantalla o varias**: la regla de comparación, el catálogo de frases, los sesgos, qué no cubrimos, la política de moderación y la descarga son mucho contenido para un solo scroll.
- **El formato exacto del CSV**: columnas, codificación, si trae la proporción por opción ya calculada o solo el conteo crudo.
- **Con qué periodicidad se regenera** el crudo.
