# US-233: Contar cómo cursé y cuántas veces

> Los casos de [US-233](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía eligió Análisis Matemático II, el período 2026-C1 y cómo terminó, Cuando responde «A distancia» y «Dos» y envía la reseña, Entonces se guardan ambas respuestas en la capa de contexto de esa reseña.

## Negativos

**N1.** Dado que Lucía había elegido «Mezcla» y «Tres o más», Cuando saltea ambas preguntas antes de enviar, Entonces la reseña se guarda sin respuestas para modalidad ni cantidad de cursadas.

**N2.** Dado que el instrumento ofrece tres opciones para modalidad y tres para cantidad de cursadas, Cuando un cliente envía una opción que el instrumento no ofrece, Entonces el backend rechaza la reseña y no guarda ninguna de esas respuestas.

## Edge cases

**X1.** Dado que diez cuentas respondieron ambas preguntas para la misma cátedra, Cuando una persona sin sesión consulta las fichas de cátedra, materia, carrera e institución, Entonces ninguna respuesta ni distribución de modalidad o cantidad de cursadas aparece en los payloads públicos.
- Una reseña existente sin estas respuestas sigue siendo válida: el silencio no se convierte en una opción ni entra a ningún denominador.
