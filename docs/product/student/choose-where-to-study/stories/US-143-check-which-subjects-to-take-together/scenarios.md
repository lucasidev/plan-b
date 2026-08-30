# US-143: Saber qué materias se pueden llevar juntas

> Los casos de [US-143](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que 23 cuentas reseñaron Análisis Matemático I y Álgebra I en el mismo período (1C 2025), y 6 de esas 23 marcaron en alguna de las dos reseñas que la dejaron.
Cuando alguien abre la ficha de la carrera y mira el par Análisis Matemático I, Álgebra I, período 1C 2025.
Entonces ve "23 la llevaron juntas" y "6 dejaron una", con esos números exactos para ese período, sin cuenta y sin que el producto sepa nada de quien lee.

## Negativos

**N1.** Dado que solo 7 cuentas reseñaron las dos materias en el mismo período.
Cuando se calcula la co-cursada de ese par y período.
Entonces no se publica ningún conteo: está bajo el piso de 10, y con menos el número diría más de quién se acordó de reseñar que de la combinación. Se dice cuánto falta, como cualquier otra ficha bajo el piso.

**N2.** Dado que una cuenta reseñó Análisis Matemático I en 1C 2025 y Álgebra I en 2C 2025.
Cuando se calcula la co-cursada del par.
Entonces esa cuenta no suma: no las llevó juntas, las llevó una después de la otra. El par cuenta por período, y el período es el de las dos reseñas.

## Edge cases

- Análisis Matemático I sale del plan cuando la carrera se reforma: la reseña de esa cursada sigue pegada al período y a la materia canónica, y el par Análisis Matemático I, Álgebra I sigue contando en la co-cursada aunque la materia ya no esté en el plan vigente.
- Una cuenta borra una de las dos reseñas: el par deja de contarla, y si eso lo lleva bajo el piso, la co-cursada de ese par deja de publicarse. Es el mismo comportamiento que cualquier conteo agregado.
