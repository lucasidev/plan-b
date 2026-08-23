# US-174: Comparar instituciones lado a lado

> Los casos de [US-174](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que UNSTA tiene 12 de 40 voces (18,1%) sobre F42 "Cada trámite es una pelea", UTN tiene 60 de 120 voces (41,2%) y UNT tiene 37 de 100 voces (28,2%) sobre la misma frase (ADR-0075)
Cuando Marcela Sosa entra a la comparación de instituciones desde la Ficha de institución de UNSTA
Entonces ve F42 lado a lado para las tres instituciones, cada una con su propia proporción, sus propias voces y su propio encogimiento.

**E2.** Dado la misma comparación de F42 entre UNSTA, UTN y UNT
Cuando se arma la lista
Entonces el orden es alfabético o por cantidad de voces, nunca por el valor de la proporción: UTN no aparece primera por tener el número más alto.

## Negativos

**N1.** Dado la comparación de instituciones por la frase F42
Cuando se arma la vista
Entonces nunca se muestra un compuesto que junte varias frases en un solo número por institución, ni un puesto (1°, 2°, 3°) al lado de cada una.

## Edge cases

- Siglo 21 todavía no tiene voces sobre F42: aparece como "sin voces todavía" dentro de la comparación, no se la oculta ni se le inventa un 0%.
- Solo hay dos instituciones cargadas: la comparación se muestra igual, sin exigir un mínimo.
- Marcela Sosa elige comparar otra frase (por ejemplo F30 "El nivel académico es alto"): la comparación se rearma para esa frase, con las mismas reglas de orden.
