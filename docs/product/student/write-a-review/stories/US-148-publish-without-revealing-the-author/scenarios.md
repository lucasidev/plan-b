# US-148: Que nadie sepa que fui yo

> Los casos de [US-148](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías reseña la cátedra Pérez (turno noche) de Análisis Matemático II, período 2026-C1, marca "la desaprobé" como cómo terminó, marca la frase F18 (Hay clases que no se dan) y escribe un comentario.
Cuando la reseña se publica.
Entonces la ficha muestra el período (2026-C1), la cátedra (Pérez), la frase F18 y el comentario; en ningún lugar público aparece el nombre de Matías, su cuenta, su rol, ni que la desaprobó.

## Negativos

**N1.** Dado la misma reseña de Matías ya publicada, Cuando alguien consulta la ficha pública de la cátedra Pérez (no Mis aportes de Matías), Entonces no encuentra en ningún lado que esa cursada "la desaprobó": ese dato solo existe en el registro privado de Matías, en Mis aportes.

## Edge cases

- Reseña sin cátedra marcada ("no me acuerdo / no aparece"): no publica ninguna cátedra, y las frases de materia cuentan igual.
- Reseña sin comentario: no aparece como testimonio (no hay texto para leer), pero sigue sumando voz a sus frases.
