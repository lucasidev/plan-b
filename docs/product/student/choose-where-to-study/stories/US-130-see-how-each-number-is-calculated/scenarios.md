# US-130: Ver cómo se calcula cada número

> Los casos de [US-130](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Rocío quiere citar en una reunión el 24% de "Hay clases que no se dan" en Cátedra Pérez (15 de 41 voces, ADR-0075)
Cuando entra a Método
Entonces encuentra la fórmula del encogimiento escrita con sus tres variables (p, n, z = 1,96), y puede reproducir el cálculo ella misma sin pedirle nada al equipo.

**E2.** Dado que Método incluye un ejemplo de lectura de la fórmula
Cuando se lee ese bloque
Entonces muestra que 37 de 100 voces se lee 28,2% y que 60 de 120 se lee 41,2% (ADR-0075), para que quede claro que el encogimiento no es simplemente k dividido n.

**E3.** Dado que Método muestra cómo se derivan las fichas
Cuando se lee ese bloque
Entonces explica que una voz es una persona hablando de una cursada, y que la materia, la cátedra, la carrera y la institución se arman sumando las voces de las cursadas que les pertenecen.

**E4.** Dado que el catálogo tiene 46 frases semilla
Cuando se abre el bloque del catálogo en Método
Entonces cada frase se lista con su sujeto y su eje, y hay forma de ver las 46 enteras, no solo una muestra sin salida.

**E5.** Dado los tres sesgos declarados por la tesis
Cuando se lee Método
Entonces dice explícitamente que todo dato es de quienes reseñaron, que la duración real sale solo de los que se recibieron, y que la co-cursada sale solo de quien reseñó las dos materias.

## Negativos

**N1.** Dado que alguien busca la fórmula del encogimiento en cualquier ficha (carrera, cátedra, materia, institución)
Cuando la busca ahí
Entonces no la encuentra completa: la ficha lleva a Método con "cómo se calcula", no repite la fórmula entera en cada una.

## Edge cases

- El catálogo todavía no tiene ninguna frase destilada validada (solo las semilla): Método igual publica las 46 semilla completas, con la marca "síntesis" reservada para cuando exista la primera destilada.
- Alguien lee Método sin cuenta: la fórmula, el catálogo y los sesgos se leen igual, sin login (US-168).
