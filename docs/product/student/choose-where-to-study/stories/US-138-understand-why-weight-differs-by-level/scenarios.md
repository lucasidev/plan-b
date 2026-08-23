# US-138: Entender por qué una frase pesa distinto

> Los casos de [US-138](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Hay clases que no se dan" (F18) tiene 15 de 41 voces (encogido a 24%, ADR-0075) en la Ficha de Cátedra Pérez, y esa misma frase, sumada a nivel de toda la carrera Ingeniería en Sistemas en UNSTA, tiene 23% de 850 voces, en 12 de 40 materias (ADR-0066)
Cuando se compara F18 en la Ficha de cátedra contra F18 en la Ficha de carrera
Entonces el porcentaje es distinto en cada una porque el denominador es distinto (41 voces de esta cátedra contra 850 de toda la carrera), y la ficha de carrera aclara que esa frase aparece en 12 de las 40 materias del plan.

**E2.** Dado ese mismo F18 en la Ficha de carrera
Cuando se muestra en la lista de frases derivadas
Entonces dice "en 12 materias", además de su propia proporción de voces: eso es lo que separa lo sistémico (aparece en casi un tercio de las materias) de lo local.

## Negativos

**N1.** Dado que F18 pesa distinto en Cátedra Pérez que en la carrera entera
Cuando alguien lo lee
Entonces la ficha no lo deja como una contradicción sin explicar: al lado de cada número dice de qué voces sale (de esta cátedra, o de toda la carrera sumando materias).

## Edge cases

- La Ficha de materia Análisis Matemático II suma las cursadas de Cátedra Pérez y de Cátedra Gómez juntas, sin deduplicar entre las dos ni entre períodos: si la misma persona recursó la materia, sus dos cursadas cuentan como dos voces, no una.
- Una frase que solo aparece marcada en una sola materia de las 22 con voces de Ingeniería en Sistemas en UNSTA: en la carrera dice "en 1 materia", sin ocultarse por ser un caso chico.
