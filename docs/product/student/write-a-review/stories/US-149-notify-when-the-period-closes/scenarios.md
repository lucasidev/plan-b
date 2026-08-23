# US-149: Avisar cuando cierra el período

> Los casos de [US-149](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía cursó Bases de Datos en el período 2026-C1 (según su historial cargado) y todavía no la reseñó.
Cuando el período 2026-C1 cierra.
Entonces le llega un mail que nombra "Bases de Datos" como la materia concreta para reseñar, con el link directo a Reseñar.

## Negativos

**N1.** Dado que Lucía no cursó ninguna materia en el período que acaba de cerrar, Cuando el período cierra, Entonces no le llega este mail: no hay una materia concreta que nombrarle.

## Edge cases

- Mail que rebota o no llega: comportamiento no definido (ver README de Avisos).
- Falta decidir: qué materia nombra el mail cuando hay más de una sin reseñar en el mismo período.
