# US-148: Que nadie sepa que fui yo

> Los casos de [US-148](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la cátedra Pérez (turno noche) de Análisis Matemático II, período 2026-C1, ya tiene 9 reseñas, y Matías reseña esa misma cursada respondiendo "la recursé" en cómo terminó y "Faltaron muchas" en la frase "¿Se dictaron las clases?".
Cuando su reseña se envía y la cátedra llega a las 10 reseñas.
Entonces la Ficha de cátedra publica, por primera vez, la distribución de esa frase (por ejemplo, "Faltaron muchas · 40 %, 10 voces"); en ningún lugar público aparece el nombre de Matías, su cuenta, su rol, ni que él la recursó.

## Negativos

**N1.** Dado que la cátedra Pérez ya publica con esas 10 reseñas, Cuando alguien consulta su ficha pública, Entonces no encuentra en ningún lado que la cursada de Matías "la recursó": ese dato solo existe en el registro privado de Matías, en Mis aportes.

## Edge cases

- Reseña sin cátedra marcada ("No sé"): no publica ninguna cátedra; el resto de la reseña (contexto y vivencia) queda guardado igual, sin frases de cátedra que atribuirle.
- Cátedra con menos de 10 reseñas: nada de esa cátedra se publica todavía, ni agregado ni individual; la ficha solo muestra el estado del piso.
