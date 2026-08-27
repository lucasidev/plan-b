# US-151: Reseñar por qué me fui

> Los casos de [US-151](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Diego dejó Ingeniería en Sistemas y no tiene ninguna cursada activa declarada.
Cuando entra a Reseñar y elige una sola materia que cursó antes de irse, Análisis Matemático II.
Entonces completa y envía la reseña sin que el sistema le pida estar cursando actualmente ni reseñar ninguna otra materia.

## Negativos

**N1.** Ninguno: esta story elimina una restricción (estar cursando), no agrega una. No queda ningún requisito de matrícula activa que el sistema deba rechazar en Diego.

## Edge cases

- Diego igual necesita una cuenta para aportar (el gate de Ingresar / Registro): lo que esta story saca es "estar cursando", no "tener cuenta".
