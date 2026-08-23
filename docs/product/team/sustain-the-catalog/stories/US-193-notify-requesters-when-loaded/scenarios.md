# US-193: Avisar a quienes esperaban al terminar

> Los casos de [US-193](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Ingeniería en Sistemas de Información" (UTN) tiene 34 mails confirmados que la pidieron y ya está publicada en Catálogo, sin huecos bloqueantes pendientes.
Cuando Sofía toca "Marcar como cargada" en Pedidos.
Entonces salen 34 mails "Cargamos lo que pediste" con el link a la ficha ya cargada, que se lee sin cuenta, y la fila de "Ingeniería en Sistemas de Información" (UTN) sale de la cola de Pedidos.

## Negativos

**N1.** Dado que "Licenciatura en Nutrición" (USPT) todavía tiene 2 huecos sin resolver y no está publicada en Catálogo. Cuando Sofía intenta tocar "Marcar como cargada" en Pedidos. Entonces la acción no se habilita y no sale ningún aviso: no se puede marcar como cargada una oferta que todavía no se publicó.

## Edge cases

- Una carrera cargada por el criterio de arranque del primer día (US-203), con 0 pedidos confirmados: al marcarla como cargada no sale ningún mail, porque no hay a quién avisar.
- El mismo mail pidió la misma carrera dos veces (D03, un mail cuenta una vez por carrera): recibe un solo aviso, no dos.
- El servicio de mail falla al mandar el aviso a los 34 confirmados: si se reintenta solo o hay que volver a tocar "Marcar como cargada" no está definido (Falta decidir; ver también Avisos, "qué pasa si el mail rebota").
