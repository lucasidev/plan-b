# US-200: Mostrar el ritmo real de la cola

> Los casos de [US-200](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Pedidos tiene 217 pedidos en cola repartidos en 54 carreras distintas, y el ritmo real de carga es de 2 carreras por semana, con 8 de las 11 carreras pedidas este mes ya cargadas.
Cuando Sofía abre Pedidos.
Entonces arriba de la lista se muestra "se tarda, en promedio: 12 días" (desde que la carrera entra a la cola hasta que se publica) y "este mes: 8 de 11", con la aclaración de que, a dos por semana, las últimas 3 quedan para el mes que viene.

**E2.** Dado el mismo estado de la cola: 217 pedidos, 54 carreras, 12 días de promedio, 8 de 11 este mes.
Cuando alguien sin cuenta abre La cola, la vista pública.
Entonces ve los mismos dos números ("se tarda, en promedio: 12 días" y "este mes: 8 de 11"), sin el detalle operativo propio del backoffice, como la lista completa de 54 filas con su fecha de entrada a la cola.

## Negativos

**N1.** Dado que 3 de las 11 carreras pedidas este mes no se van a cargar dentro del mes al ritmo de 2 por semana. Cuando se muestra el número "este mes: 8 de 11". Entonces la pantalla NO dice que esas 3 se van a cargar igual ni promete una fecha puntual para ninguna: solo declara que quedan afuera del mes, sin fingir que se resuelve todo.

## Edge cases

- Cola con un solo pedido, recién arrancado el producto: el promedio se calcula igual, aunque sea sobre muy pocos casos.
- La ventana sobre la que se promedia "cuánto se tarda" no está definida (Falta decidir, la épica lo deja abierto explícitamente).
- Una carrera que queda afuera del mes dos meses seguidos: si escala de prioridad o sigue esperando en la misma posición no está definido (Falta decidir).
