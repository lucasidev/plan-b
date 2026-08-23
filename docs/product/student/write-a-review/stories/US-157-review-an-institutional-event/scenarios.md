# US-157: Reseñar un evento institucional

> Los casos de [US-157](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que a Matías le tardaron ocho meses en entregarle el título en UNSTA, algo que no es de ninguna materia.
Cuando entra a Reseñar, elige la salida "es un trámite, el título, una mesa: un evento, no una materia", declara cuándo pasó, marca la frase F31 (El título tardó meses) y agrega un comentario opcional.
Entonces la reseña se publica sin materia ni cátedra, y F31 junto con el comentario van a la Ficha de institución de UNSTA, sumando una voz igual que si fuera una cursada.

## Negativos

**N1.** Dado que Matías eligió la salida de evento institucional, Cuando el flujo avanza, Entonces el paso "¿Con qué cátedra la cursaste?" y la pregunta de clases sin dar no aparecen: un evento no tiene cátedra.

## Edge cases

- Si no recuerda la fecha exacta del evento, puede declarar el período aproximado en vez del día puntual.
- Falta decidir: si el evento institucional queda como una pantalla propia o como esta misma pantalla con otras frases (el boceto lo deja como salida del paso 1, sin resolver).
