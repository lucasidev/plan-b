# US-155: Preguntar el año de ingreso una vez

> Los casos de [US-155](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que es la primera vez que la cuenta de Lucía reseña una materia de Ingeniería en Sistemas.
Cuando llega al paso 2 (¿Cuándo la cursaste?), contesta que entró en 2023, y más tarde reseña una segunda materia de la misma carrera.
Entonces la primera vez el paso 2 le preguntó el año de ingreso; la segunda vez no se lo vuelve a preguntar, porque ya está contestado.

## Negativos

**N1.** Dado que a Lucía le preguntan el año de ingreso por primera vez, Cuando elige "prefiero no decirlo", Entonces el dato queda guardado como "no dijo": el sistema nunca vuelve a preguntárselo ni infiere un año.

## Edge cases

- Si Lucía reseña por primera vez una materia de una segunda carrera distinta, la pregunta del año de ingreso vuelve a aparecer: es por carrera, no global.
