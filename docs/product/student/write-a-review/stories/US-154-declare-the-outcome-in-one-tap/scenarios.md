# US-154: Decir cómo terminó la cursada

> Los casos de [US-154](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en Análisis Matemático II, período 2026-C1, ya había 119 cursadas terminadas (37 la aprobé, 25 me quedó regular, 38 la recursé, 19 la dejé), y Lucía está en el paso 3 de Reseñar.
Cuando toca "la aprobé" con un solo toque y envía.
Entonces el dato queda guardado sin pedirle más campos, y la tasa de finalización publicada en la Ficha de materia pasa a ser 43,6 % (63 de 120 terminaron aprobada o regular, límite inferior de Wilson con z = 1.96).

## Negativos

**N1.** Dado que Lucía todavía no completó el paso 3 (cómo terminó), Cuando intenta avanzar al paso 4 o enviar, Entonces el sistema se lo impide: "cómo terminó" es, junto con la materia y el período, uno de los pasos obligatorios.

## Edge cases

- Elegir una opción de "cómo terminó" reemplaza cualquier elección anterior: nunca se pueden elegir dos a la vez, es un toque único.
- No existe una opción "sigo cursando": las cuatro opciones (la aprobé, me quedó regular, la recursé, la dejé) describen una cursada que ya terminó de alguna forma.
