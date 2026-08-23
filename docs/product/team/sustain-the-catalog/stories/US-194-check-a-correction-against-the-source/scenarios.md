# US-194: Contrastar la corrección contra la fuente

> Los casos de [US-194](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que llega una corrección propuesta sobre "Duración nominal · Ingeniería en Sistemas, UNSTA": valor viejo "5 años", valor nuevo propuesto "5,5 años", con la fuente "plan de estudios 2024, publicado por la facultad".
Cuando Sofía abre esa corrección en Correcciones.
Entonces ve el valor viejo (5 años) y el valor nuevo propuesto (5,5 años) lado a lado, contrastados contra esa fuente.

**E2.** Dado el mismo caso de E1, con la fuente confirmando 5,5 años.
Cuando Sofía toca "Aplicar".
Entonces el dato pasa a 5,5 años para todos, sin votación, y queda registrado "aplicada por Sofía el 17 de agosto de 2026".

## Negativos

**N1.** Dado que llega una corrección propuesta sobre la correlativa de Análisis Matemático II (UNSTA), pidiendo cambiarla de "para rendir" a "para cursar", y la fuente oficial confirma que sigue siendo "para rendir". Cuando Sofía contrasta la propuesta contra esa fuente y toca "Rechazar" con el motivo "la fuente oficial confirma 'para rendir'; la propuesta decía 'para cursar'". Entonces el valor viejo ("para rendir") se mantiene sin cambios, y la corrección queda registrada como rechazada, el 15 de agosto de 2026, con ese motivo.

## Edge cases

- Cola sin correcciones pendientes: la pantalla dice que está al día, nadie propuso un cambio desde la última revisión.
- La sesión de Sofía expira mientras está contrastando una corrección: la corrección sigue en la cola sin aplicarse ni rechazarse, nadie la marca como revisada a medias.
- Dos correcciones propuestas sobre el mismo campo al mismo tiempo, con valores distintos: si se muestran las dos o la segunda se descarta no está definido (Falta decidir).
- Una corrección aplicada por error: no hay camino de deshacer descrito (Falta decidir; ver también Correcciones, "el criterio para rechazar").
