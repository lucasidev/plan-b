# US-178: Verificar identidad antes de responder

> Los casos de [US-178](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Claudia Fernández pide verificar que es titular de Cátedra Pérez, Análisis Matemático II, UNSTA
Cuando Camila compara ese pedido contra lo que el catálogo tiene cargado de Cátedra Pérez (titular Claudia Fernández, activa desde 2021) y lo aprueba, con su nombre y la fecha
Entonces Claudia queda con identidad docente verificada y Responder le habilita el campo para escribir la réplica.

**E2.** Dado que Matías subió su constancia de alumno regular, y por separado Claudia pidió verificar su identidad docente
Cuando Camila trabaja las colas de Verificaciones
Entonces la constancia de Matías está en la cola de constancias de alumno y el pedido de Claudia está en la cola de identidad docente (US-210), cada una separada de la otra.

**E3.** Dado que a Claudia le aprobaron la identidad docente sobre Cátedra Pérez
Cuando se mira qué habilita esa verificación
Entonces funciona como el permiso que abre el campo de respuesta en Responder, no como una insignia o señal decorativa (a diferencia de la constancia de alumno, que sí es señal, US-190).

## Negativos

**N1.** Dado que alguien dice ser titular de Cátedra Suárez (Química General, UNSTA) y el catálogo todavía no tiene cargado el equipo docente de esa cátedra
Cuando pide verificar su identidad docente
Entonces el pedido no se rechaza pero tampoco se aprueba: pasa a ser trabajo de catálogo (cargar el equipo docente) y se resuelve recién cuando ese dato está.

## Edge cases

- Alguien pide verificarse diciendo ser titular de una cátedra que no existe en el catálogo, con el nombre mal escrito: si eso se rechaza directo o también pasa a trabajo de catálogo. **Falta decidir**.
- La identidad docente de Claudia vence al año (US-226) y ella no la renueva: la próxima vez que quiera responder, el campo vuelve a estar bloqueado hasta reverificar.
