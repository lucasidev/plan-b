# US-203: Decidir qué cargar el primer día

> Los casos de [US-203](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Pedidos no tiene ningún pedido confirmado todavía, el primer día del producto.
Cuando Sofía abre Pedidos.
Entonces la pantalla no se ve vacía: muestra un criterio explícito de qué cargar primero (por ejemplo, las carreras de las personas del equipo, las más pedidas en otros sitios, o una por universidad para tener cobertura amplia desde el día uno), en vez de decir solo "no hay pedidos".

**E2.** Dado el mismo estado: sin pedidos confirmados todavía.
Cuando alguien sin cuenta abre La cola, la vista pública.
Entonces ve el mismo criterio de arranque explicado del lado público, en vez de una cola vacía.

## Negativos

**N1.** Dado que Pedidos no tiene ningún pedido confirmado todavía. Cuando alguien abre Pedidos o La cola esperando ver la cola. Entonces la pantalla NO se queda vacía sin explicación: no muestra un estado "no hay pedidos" desnudo, porque esta story existe justamente para que eso no pase.

## Edge cases

- Entra el primer pedido confirmado después de días de cola vacía con el criterio de arranque: si ese criterio desaparece de una o convive un tiempo con la cola por demanda no está definido (Falta decidir).
- El criterio de arranque concreto (cuál lista, cuáles carreras) no está decidido: la épica lo deja abierto explícitamente (Falta decidir: si es una lista escrita o una decisión que se toma cada vez).
