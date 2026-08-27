# US-161: Retomar una reseña a medias

> Los casos de [US-161](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía llega al paso 4 de Reseñar (Qué hizo la cátedra) y cierra la pestaña sin enviar.
Cuando vuelve a entrar más tarde, por ejemplo desde Mis aportes.
Entonces encuentra la reseña a medias guardada con el paso donde quedó (paso 4), y puede retomarla desde ahí en vez de empezar de cero.

## Negativos

**N1.** Dado que la reseña a medias de Lucía nunca llegó a responder ningún ítem ni a completar el paso 3 (cómo terminó), Cuando se calculan las voces publicadas en cualquier ficha, Entonces esa reseña a medias no suma ninguna voz ni aparece publicada en ningún lado, hasta que se termine y se envíe.

## Edge cases

- Si el corte fue por una falla técnica (por ejemplo, se cae la conexión), la pantalla de Error avisa que lo ya contestado se guardó solo y ofrece el link para retomar.
- Si la sesión expira a mitad del flujo, lo ya contestado sigue guardado y se recupera al volver a loguearse.
- Falta decidir: cuánto tiempo se conserva una reseña a medias antes de descartarse.
