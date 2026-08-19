# Ficha de carrera (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la cabecera con gate, la trayectoria y la co-cursada pública; revisión adversarial pendiente antes del hi-fi. Pública, se lee sin cuenta. Slug hoy `/careers/[id]` (del inventario). Épicas que la componen: [Elegir dónde estudiar](../../../epics/choose-where-to-study/README.md) (la cabecera con su gate, las listas por eje, la trayectoria, la ficha vacía y de qué voces está hecha), [Mi carrera](../../../epics/my-career/README.md) (el plan con sus materias, la co-cursada pública) y [Pedir una carrera](../../../epics/request-a-career/README.md) (el vacío explicado cuando la carrera todavía no está cargada).

## Quién la usa

**Valentina** (decide entre instituciones: baja hasta acá desde Explorar o sube desde Dónde estudiarla), **Silvia** (lee la trayectoria sin vocabulario académico, para saber si esto termina en un título), **Lucía** (mira el plan y la co-cursada pública antes de anotarse), **Ana** (llega desde La cola el día que por fin cargan lo que pidió). Y quien lee en general, sin cuenta.

## Qué stories resuelve

[O1-8](../../../epics/choose-where-to-study/README.md#stories) (la cabecera espera que más de la mitad de las materias canónicas de la carrera, sobre todos sus planes, tenga voces), [O1-1](../../../epics/choose-where-to-study/README.md#stories) (duración nominal, real y brecha, de los egresados que declararon las dos fechas), [O1-7](../../../epics/choose-where-to-study/README.md#stories) (Silvia: la cohorte cerrada se lee sin abrir nada ni saber vocabulario académico), [T3-6](../../../epics/choose-where-to-study/README.md#stories) (cada frase derivada dice en cuántas materias aparece), [T3-2](../../../epics/choose-where-to-study/README.md#stories) (el período que sostiene la ficha, con el aviso si lo último es viejo), [T2-3](../../../epics/choose-where-to-study/README.md#stories) (vacía: la primera voz ya se publica, sin escalones), [O2-1](../../../epics/request-a-career/README.md#stories) (el vacío en sus estados: esta ficha solo existe del lado de "cargada"), [O3-1](../../../epics/my-career/README.md#stories) (la co-cursada pública, por par y período, solo desde reseñas) y [O4-8](../../../epics/write-a-review/README.md#stories) (en qué año del plan se fue la mayoría de los que se fueron). La letra completa de cada una está en el README de su propia épica.

## Qué muestra

- **Cabecera con gate**: las dos proporciones (exigencia, gestión) se publican solo cuando la cobertura pasó la mitad de las materias canónicas de la carrera, sobre todos sus planes; si no llegó, la ficha dice "todavía no derivamos" con la cobertura a la vista ("22 de 40 materias con voces") y deja leer materia por materia ([O1-8](../../../epics/choose-where-to-study/README.md#stories), D04, [ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)).
- **Listas de frases por eje**, ordenadas por proporción, con voces y encogimiento; cada frase derivada dice en cuántas materias aparece ([T3-6](../../../epics/choose-where-to-study/README.md#stories)).
- **Trayectoria** ([ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)): duración nominal, duración real (mediana de años de los egresados que declararon cuándo entraron y cuándo se recibieron) y la brecha en años ([O1-1](../../../epics/choose-where-to-study/README.md#stories)); las tres proporciones de la cohorte cerrada con "no dijo o sigue" a la vista, sin vocabulario académico ([O1-7](../../../epics/choose-where-to-study/README.md#stories)); en qué año del plan se fue la mayoría de los que se fueron, con link a verlo materia por materia ([O4-8](../../../epics/write-a-review/README.md#stories)).
- **Co-cursada pública**: por par de materias y período, cuántas personas las llevaron juntas y cuántas dejaron una, solo desde reseñas, nunca desde un plan marcado ([O3-1](../../../epics/my-career/README.md#stories)).
- **El plan**, con sus materias agrupadas por año y un link a la [Ficha de materia](../subject/README.md) de cada una; el período de lo que sostiene la ficha, con el aviso cuando lo último es de hace más de dos años ([T3-2](../../../epics/choose-where-to-study/README.md#stories)).
- **Salidas**: comparar en Dónde estudiarla, pedir si falta algo, reseñar.

**Estados**:
- **Vacía, con el primero**: la carrera está cargada pero ninguna cursada la sostiene todavía; la ficha dice que arranca vacía y que la primera voz ya se publica, sin escalones ([T2-3](../../../epics/choose-where-to-study/README.md#stories)).
- **Sin cabecera**: hay voces, pero la cobertura no pasó la mitad de las materias canónicas; se ve "todavía no derivamos" con la cobertura a la vista, y lo que ya existe (duración nominal, cohorte si cerró) se sigue mostrando.
- **No cargada**: no es un estado de esta ficha, la ficha no existe todavía; ese vacío se explica en Explorar o Buscar, con sus tres estados ([O2-1](../../../epics/request-a-career/README.md#stories)).

## Lo que no muestra nunca

Ningún puntaje ni escala 1 a 5 ([ADR-0064](../../../decisions/0064-phrases-with-voices-not-scores.md)); ninguna cabecera derivada con menos de la mitad de las materias canónicas con voces ([ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)); ningún testimonio propio, los testimonios viven en la [Ficha de materia](../subject/README.md), la [Ficha de cátedra](../chair/README.md) y la [Ficha de institución](../institution/README.md) (ADR-0068 punto 1: la carrera es derivada, no se reseña); ningún egreso ni abandono de una cohorte que todavía no cerró; nunca infiere "se fue" o "se recibió" del silencio, lo que no dijo queda como "no dijo" ([ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)).

## Adónde va

Llega desde: Explorar, Buscar, La cola (cuando se carga lo que alguien pidió), Registro (precarga institución y carrera), la [Ficha de materia](../subject/README.md) (subir a su carrera) y Mi carrera (si es la carrera declarada). Va a: la Ficha de materia de cada materia del plan, [Dónde estudiarla](../../../epics/choose-where-to-study/screens/where-to-study/README.md) (comparar instituciones), [Pedir](../../../epics/request-a-career/screens/request/README.md) (si algo falta), Reseñar (con cuenta) y [Método](../../../epics/take-the-data/screens/method/README.md) (cómo se calcula).

## Decisiones que aplica

[ADR-0066](../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (derivación, gate de cobertura, sin piso; D04 fija el denominador cuando coexisten dos planes, [registro del 17](../../../reviews/2026-08-17-catalog-propagation.md)), [ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (trayectoria: nominal, real, brecha, cohorte cerrada, co-cursada), [ADR-0065](../../../decisions/0065-attribution-is-the-axis-not-a-split.md) (la cabecera son dos proporciones por eje), [ADR-0064](../../../decisions/0064-phrases-with-voices-not-scores.md) (frases con voces, sin puntaje), [ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 1: el testimonio va en la ficha del sujeto que lo tiene, nunca en la carrera).

## Lo que esta ficha deja abierto

- **Cuántas frases derivadas se muestran** por eje antes de "ver todas".
- **El orden del plan**: por año del plan o por correlativas.
- **Qué pasa con "el plan" cuando hay reforma** (BO5-1): si esta sección lista los dos planes o solo el vigente, mientras el gate de cobertura ya los une (D04).
- **El layout de la co-cursada pública con muchos pares** de materias, la misma pregunta que Mi carrera deja abierta para su versión filtrada.
