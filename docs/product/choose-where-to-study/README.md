# Elegir dónde estudiar

> Épica del grupo **O1 · Decidir dónde estudiar (y poder desconfiar del número)** del [catálogo](../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y su pantalla propia con ficha y boceto mid-fi ([Dónde estudiarla](screens/SC-008-where-to-study/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Leer el escrutinio sin cuenta para decidir dónde estudiar. La ficha de una carrera en una institución con las dos proporciones de la cabecera (lo exigente, lo mal gestionado) y las listas de frases por eje, derivadas de sus cursadas con la cobertura a la vista; la trayectoria que las frases no producen (nominal, real, brecha; egreso, abandono y "no dijo" de cohortes cerradas); la misma carrera canónica lado a lado en Dónde estudiarla, dato por dato y sin ganador; la búsqueda que entiende que lo que te recomiendan es una persona; y Método al alcance para poder desarmar cualquier número. Es la épica de la lectura: la decisión 3 de la tesis (leer no pide cuenta) se verifica acá en cada pantalla. Y por eso le tocan las situaciones de lectura que el mapa agrupaba aparte como temas: la ficha vacía que dice que la primera voz ya se publica (US-136), el período de lo que sostiene cada ficha y el aviso cuando lo último es viejo (US-137), por qué una frase pesa distinto en la cátedra y en la carrera (US-138), y los testimonios que se leen debajo de las frases, ordenados por votos (US-135).

## Para quién

**Valentina** (tiene que decidir cinco años con un folleto; desconfía de los rankings y necesita uno: si le mostramos un número redondo lo descarta, si le mostramos de qué está hecho lo usa), **Silvia** (paga la cuota y no pisa la facultad: quiere saber si termina en un título, sin vocabulario académico), y **quien lee** (busca por materia, carrera o docente).

## Stories

Las 14 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../plan/README.md), que las cita por ID.

> US-127, US-133, US-143 y US-152 no salen de frases: salen de **trayectoria** (cuándo cursaste y cómo terminó, cuándo entraste, si te fuiste cuándo, si te recibiste cuándo). Esos hechos se preguntan de a uno, en el momento en que aparecen, nunca como inventario, y el silencio no se infiere; qué se publica con ellos y cómo se calcula: [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md).

| ID | De qué trata |
|---|---|
| [US-221](stories/US-221-see-the-instrument-working-on-arrival.md) | Entender qué es esto viendo una ficha real |
| [US-222](stories/US-222-browse-what-there-is-to-study.md) | Ver qué hay para estudiar sin saber qué buscar |
| [US-127](stories/US-127-see-how-long-it-really-takes.md) | Ver cuánto tarda de verdad la carrera |
| [US-128](stories/US-128-compare-the-same-career-side-by-side.md) | Comparar la misma carrera en varias instituciones |
| [US-129](stories/US-129-attribute-difficulty-to-career-or-institution.md) | Atribuir la dificultad: carrera o facultad |
| [US-130](stories/US-130-see-how-each-number-is-calculated.md) | Ver cómo se calcula cada número |
| [US-131](stories/US-131-see-how-many-voices-support-it.md) | Ver sobre cuántas voces se calcula |
| [US-132](stories/US-132-search-by-subject-career-or-teacher.md) | Buscar por materia, carrera o docente |
| [US-133](stories/US-133-see-if-it-leads-to-graduation.md) | Saber si termina en un título |
| [US-134](stories/US-134-check-the-coverage-behind-the-card.md) | Saber para cuánta carrera vale un dato |
| [US-135](stories/US-135-read-testimonies-below-the-phrases.md) | Leer los testimonios debajo de las frases |
| [US-136](stories/US-136-understand-being-the-first-voice.md) | Entender la ficha cuando todavía no hay nada cargado |
| [US-137](stories/US-137-know-how-recent-the-testimonies-are.md) | Saber de cuándo son los testimonios |
| [US-138](stories/US-138-understand-why-weight-differs-by-level.md) | Entender por qué una frase pesa distinto en cátedra y en carrera |

Las filas con "tema del mapa" vienen de los grupos transversales del mapa (T2 · Cuando el riesgo es real; T3 · Cuando el catálogo no alcanza): son temas, no actividades, y cada uno de sus requisitos vive en la única épica que lo implementa; el índice del [catálogo](../README.md) conserva el tema como lista. US-135 viene del grupo T1 ([Cuidar lo publicado](../care-for-what-is-published/README.md)), que sigue siendo épica: leer el testimonio es de quien lee; votarlo, de quien ya aportó.


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0064](../../decisions/0064-phrases-with-voices-not-scores.md) (frases con proporción de voces y encogimiento de Wilson; sin puntaje 1 a 5), [ADR-0065](../../decisions/0065-attribution-is-the-axis-not-a-split.md) (la cabecera son dos proporciones; la atribución la decide el eje), [ADR-0066](../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (la carrera y la institución se derivan sumando voces; la cabecera derivada espera el gate de cobertura; sin piso ni escalera), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (duración real como mediana de egresados, brecha, cohorte cerrada con "no dijo" visible, carrera canónica, lado a lado sin ordenar por valor), D04 (el denominador del gate son las materias canónicas de la carrera en todos sus planes). El catálogo de frases que se lee: [`phrases.md`](../phrases.md).

## Pantallas

La que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Dónde estudiarla**](screens/SC-008-where-to-study/README.md) (pública, sin cuenta): la misma carrera canónica en varias instituciones, lado a lado, sin ganador; [boceto mid-fi](screens/SC-008-where-to-study/sketch.html) de la comparación y sus tres estados.

Las que comparte con otras épicas: [**Inicio**](screens/SC-004-home/README.md) (la vitrina), [**Explorar**](screens/SC-003-explore/README.md) (el home real: dos lentes, carreras y universidades), [**Buscar**](screens/SC-006-search/README.md) (diseñada sin construir: resultados de los cuatro sujetos), [**Ficha de carrera**](screens/SC-001-career/README.md), [**Ficha de institución**](../reply/screens/SC-005-institution/README.md) (dueña [Replicar](../reply/README.md): sus stories tienen rol "la institución"), [**Ficha de materia**](screens/SC-007-subject/README.md), la [Ficha de cátedra](screens/SC-002-chair/README.md), y [**Método**](../take-the-data/screens/SC-021-method/README.md) (dueña [Llevarse el dato](../take-the-data/README.md)).

## Lo que esta épica todavía no resuelve

- **Cómo se lee la trayectoria para Silvia** sin vocabulario académico: el copy de nominal, real, brecha y las tres proporciones de la cohorte, sin abrir nada (US-133). Es diseño de la Ficha de carrera.
- **Dónde estudiarla con más de tres ofertas**: cuántas entran lado a lado en un celular y qué pasa con el resto (alfabético o por voces; el que quiere ordenar baja el CSV).
- **Qué muestra Explorar** además de las dos lentes: si lista por cobertura, por voces o alfabético (US-171 prohíbe cualquier orden por conveniencia).
- **Inicio** entra por esta épica (es la puerta a Explorar y Buscar) pero su identidad visual se diseña con criterio propio, aparte del producto.
- **Si "más de dos años" es el umbral correcto para toda ficha** (US-137) o depende del sujeto: una cátedra cambia de docente más rápido que una carrera cambia de plan.
- **Cómo muestra la ficha los dos sentidos de un aspecto** (la frase y su contraria, US-164 en [Reseñar](../write-a-review/README.md)): juntos como par, o cada una suelta en su lista ordenada por proporción.
