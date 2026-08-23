# US-156: Preguntar por mail si me recibí

> Los casos de [US-156](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la cuenta de Diego lleva más de un año inactiva y nunca dijo su situación de trayectoria.
Cuando pasa un año desde el último aviso.
Entonces le llega un mail con la pregunta "¿te recibiste? ¿cuándo?", respondible con un click desde el mail, sin entrar a la app.

## Negativos

**N1.** Dado que Diego ya contestó esa pregunta en un envío anterior (por ejemplo, "me recibí, en 2024"), Cuando pasa otro año, Entonces no le vuelve a llegar el mail de reenganche: la pregunta ya está apagada para siempre.

## Edge cases

- Si Diego no contesta el mail, se le vuelve a mandar la misma pregunta al año siguiente.
