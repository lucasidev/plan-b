# US-146: Reseñar en menos de cinco minutos

> Los casos de [US-146](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía entra a Reseñar para Análisis Matemático II, período 2026-C1.
Cuando marca "la aprobé" como cómo terminó, marca la frase F02 (Se aprueba yendo a clase), elige "no me acuerdo / no aparece" en cátedra y no escribe ningún comentario.
Entonces la reseña se publica igual: en ningún paso el sistema le exigió escribir texto, y el comentario quedó como el último paso, saltado.

## Negativos

**N1.** Dado que Lucía llega al paso 6 sin haber marcado ninguna frase (ni de materia ni de cátedra) y sin escribir comentario, Cuando intenta publicar, Entonces el sistema no la deja: pide marcar al menos una frase antes de publicar, porque escribir un comentario solo no alcanza para reemplazar esa marca.

## Edge cases

- Doble click en "Publicar reseña": no genera dos reseñas para la misma cuenta, materia y período; publica una sola vez (envío duplicado).
- Comentario que supera el tope de longitud (600 caracteres en el boceto; el tope exacto todavía no está decidido): no se puede publicar hasta acortarlo.
