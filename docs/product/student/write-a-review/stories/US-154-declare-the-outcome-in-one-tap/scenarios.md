# US-154: Decir cómo terminó la cursada

> Los casos de [US-154](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en Análisis Matemático II, período 2026-C1, ya había 99 cursadas terminadas en "la aprobé" o en "la desaprobé" (36 aprobé, 63 desaprobé), y Lucía está en el paso 3 de Reseñar.
Cuando toca "la aprobé" con un solo toque y publica.
Entonces el dato queda guardado sin pedirle más campos, la aprobación publicada en la Ficha de materia pasa a ser 28,2% (37 de 100, límite inferior de Wilson con z = 1.96), y ese mismo dato alimenta también el abandono de cursada de ese período junto con quienes marcaron "la dejé".

## Negativos

**N1.** Dado que Lucía todavía no completó el paso 3 (cómo terminó), Cuando intenta avanzar al paso 4 o publicar, Entonces el sistema se lo impide: "cómo terminó" es, junto con la materia, el período y al menos una frase, uno de los pasos obligatorios.

## Edge cases

- Elegir una opción de "cómo terminó" reemplaza cualquier elección anterior: nunca se pueden marcar dos a la vez, es un toque único.
- "Sigo cursando" es una opción válida de "cómo terminó" y queda afuera de los denominadores de aprobación y de abandono de cursada (ADR-0067).
