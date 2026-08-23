# US-163: Reseñar la misma materia dos veces

> Los casos de [US-163](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía ya reseñó Programación I en el período 2024-C1 (la desaprobó).
Cuando recursa la materia y la reseña de nuevo en el período 2025-C1 (la aprueba).
Entonces el sistema acepta la segunda reseña porque el período es otro: cuenta × materia × período son claves distintas, y ambas cuentan como aportes independientes.

## Negativos

**N1.** Dado que Lucía ya reseñó Programación I en el período 2025-C1, Cuando intenta reseñarla de nuevo en el mismo período 2025-C1, aunque esta vez diga que la cursó con otra cátedra, Entonces el sistema rechaza el segundo intento: la clave es cuenta × materia × período, y la cátedra, al ser opcional, no forma parte de esa clave.

## Edge cases

- Concurrencia: si Lucía envía dos reseñas para el mismo período casi al mismo tiempo, desde dos pestañas, el sistema acepta la primera y rechaza la segunda por la misma clave repetida.
