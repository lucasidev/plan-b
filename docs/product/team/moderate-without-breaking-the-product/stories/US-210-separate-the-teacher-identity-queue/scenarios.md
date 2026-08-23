# US-210: Separar la cola de identidad docente

> Los casos de [US-210](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Sofía cargó el equipo docente de Cátedra Pérez con Claudia Fernández como titular, activa desde 2021, y Claudia pide verificar que es la titular de esa cátedra.
Cuando Camila revisa el pedido en la cola de identidad docente, separada de la de constancias.
Entonces compara el nombre declarado contra el titular que el catálogo tiene cargado para Cátedra Pérez y, al coincidir, lo aprueba: sin esa aprobación, Responder no le habilita ningún campo para escribir la réplica.

**E2.** Dado que Camila aprueba la identidad docente de Claudia Fernández el 2026-08-21.
Cuando esa decisión se guarda.
Entonces queda con autor "Camila" y fecha "2026-08-21".

**E3.** Dado que alguien pide verificar identidad docente diciendo ser el adjunto de Cátedra Pérez, pero el nombre declarado no coincide con ningún integrante del equipo que Sofía cargó.
Cuando Camila revisa el pedido y lo rechaza, con su nombre y la fecha.
Entonces esa cuenta sigue sin campo de respuesta en Responder, y el rechazo no deja ninguna marca visible sobre ella.

## Negativos

**N1.** Dado que alguien dice ser titular de Cátedra Suárez (Química General, UNSTA) y el catálogo todavía no tiene cargado el equipo docente de esa cátedra.
Cuando pide verificar su identidad docente.
Entonces el pedido no se rechaza pero tampoco se aprueba: pasa a ser trabajo de catálogo (cargar el equipo docente) y se resuelve recién cuando ese dato está.

## Edge cases

- Dos personas piden verificarse como el mismo integrante de una cátedra (por ejemplo, las dos dicen ser "el adjunto" de Cátedra Pérez): la story no dice cuál gana. **Falta decidir**.
- Un pedido con el nombre de la cátedra mal escrito, que no coincide con ninguna fila del catálogo: si se rechaza directo o también pasa a trabajo de catálogo no está definido. **Falta decidir**.
- La identidad docente de Claudia vence al año y vuelve a esta misma cola para revisarse de nuevo (US-226), no a una cola aparte.
