# US-146: Reseñar en menos de dos minutos

> Los casos de [US-146](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía entra a Reseñar para Análisis Matemático II, período 2026-C1.
Cuando responde "la aprobé" en cómo terminó, elige "No sé" en cátedra, responde una sola frase del paso 5 ("Sí" a si pudo seguir el ritmo), deja todas las demás frases sin responder y no escribe nada en el campo libre del paso 6.
Entonces la reseña se envía igual: en ningún paso el sistema le exigió responder una frase ni escribir texto, y saltear no le bloqueó el envío.

## Negativos

**N1.** Dado que Lucía llega al paso 6 sin haber elegido una materia, un período o cómo terminó, Cuando intenta enviar, Entonces el sistema no la deja: esos tres son los únicos pasos obligatorios, porque sin ellos no hay una cursada concreta a la que atarle la reseña.

## Edge cases

- Doble click en "Enviar la reseña": no genera dos reseñas para la misma cuenta, materia y período; envía una sola vez (envío duplicado).
- Campo libre que supera su tope de longitud (el valor exacto está abierto en la ficha de la pantalla): no se puede enviar hasta acortarlo.
