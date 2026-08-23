# US-225: Verificar un cargo institucional

> Los casos de [US-225](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Sofía cargó el cargo genérico "Secretaría Académica" para UNSTA en el catálogo (US-224), y Marcela Sosa pide verificar que tiene ese cargo en UNSTA.
Cuando Camila revisa el pedido en la cola de cargo institucional, separada de constancias y de identidad docente.
Entonces compara el cargo declarado contra los cargos que el catálogo ya tiene cargados para UNSTA y, al coincidir, lo aprueba: sin esa aprobación, Responder no le habilita el campo para escribir la réplica institucional.

**E2.** Dado que alguien pide verificar el cargo "Oficina de Becas" en una institución que todavía no tiene ese cargo cargado en el catálogo.
Cuando Camila revisa el pedido.
Entonces no lo rechaza: lo pasa como trabajo de catálogo para que Sofía lo cargue, y el pedido se resuelve recién cuando el cargo esté cargado.

**E3.** Dado que Camila aprueba el cargo de Marcela Sosa el 2026-08-21.
Cuando esa decisión se guarda.
Entonces queda con autor "Camila" y fecha "2026-08-21"; y si en cambio lo hubiera rechazado, la réplica institucional seguiría sin habilitarse y la cuenta de Marcela no quedaría marcada de ninguna forma.

## Negativos

**N1.** Dado que alguien pide verificar un cargo institucional escribiendo el nombre textual exacto de su puesto en un campo libre, por ejemplo "Secretaría de Alumnos, tercer piso".
Cuando llega al paso de elegir qué cargo tiene.
Entonces no puede: solo elige entre los cargos genéricos de la lista corta del catálogo (US-224), sin ningún campo de texto libre.

## Edge cases

- Dos personas piden verificarse con el mismo cargo genérico en la misma institución, por ejemplo dos "Secretaría Académica" de UNSTA: la story no dice si eso está permitido. **Falta decidir**.
- Todavía no existe la story del lado de quien tiene el cargo pidiendo verificarse, análoga a US-178 para el docente (nota de la story). Los pasos exactos de ese pedido quedan fuera de esta traducción.
- El cargo de Marcela Sosa vence al año y vuelve a la misma cola de cargo institucional para revisarse de nuevo (US-226), no a una cola aparte.
