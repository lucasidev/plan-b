# US-143: Saber qué materias se pueden llevar juntas

> Los casos de [US-143](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía y otras 22 personas reseñaron Análisis Matemático I y Álgebra I en el mismo período (1C 2025), 23 personas en total, y 6 de esas 23 marcaron en alguna de las dos reseñas que la dejaron.
Cuando Lucía abre la pestaña de co-cursada de Mi carrera para el par Análisis Matemático I, Álgebra I, período 1C 2025.
Entonces ve "23 personas la llevaron juntas" y "6 dejaron una", con esos números exactos para ese período.

## Negativos

**N1.** Dado que Matías marcó en su plan que le falta Álgebra I, y ya reseñó Análisis Matemático I como aprobada, pero nunca reseñó haber cursado las dos materias juntas en ningún período.
Cuando se calcula la co-cursada del par Análisis Matemático I, Álgebra I.
Entonces la marca privada de Matías no suma a ese conteo, ni como que las llevó juntas ni como que dejó una: la co-cursada sale solo de reseñas, nunca del plan marcado.

## Edge cases

- Análisis Matemático I sale del plan cuando la carrera se reforma: la reseña de esa cursada sigue pegada al período y a la materia canónica, y el par Análisis Matemático I, Álgebra I sigue contando en la co-cursada aunque la materia ya no esté en el plan vigente.
