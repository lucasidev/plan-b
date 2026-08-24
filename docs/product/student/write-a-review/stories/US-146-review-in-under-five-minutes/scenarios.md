# US-146: Reseñar en menos de cinco minutos

> Los casos de [US-146](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía entra a Reseñar para Análisis Matemático II, período 2026-C1.
Cuando marca "la aprobé" como cómo terminó, elige "no me acuerdo / no aparece" en cátedra, marca la frase F02 (Se aprueba yendo a clase) en el tema evaluación y no escribe ningún micro-comentario.
Entonces la reseña se publica igual: en ningún paso el sistema le exigió escribir texto, y todos los "¿algo más de esto?" quedaron vacíos, sin reclamo.

## Negativos

**N1.** Dado que Lucía llega al paso de publicar sin haber marcado ninguna frase (de ningún tema), Cuando intenta publicar, Entonces el sistema no la deja: pide marcar al menos una frase antes de publicar, porque los micro-comentarios solos no alcanzan para reemplazar esa marca.

## Edge cases

- Doble click en "Publicar reseña": no genera dos reseñas para la misma cuenta, materia y período; publica una sola vez (envío duplicado).
- Micro-comentario que supera su tope de longitud (el valor exacto está abierto en la ficha de la pantalla): no se puede publicar hasta acortarlo.
