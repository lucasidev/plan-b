# US-142: Que me avisen cuando la carguen

> Los casos de [US-142](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ana confirmó su pedido de "Licenciatura en Psicología, UNSTA" y Sofía la carga, llegando a 41 pedidos confirmados,
Cuando plan-b la marca como cargada,
Entonces le llega un mail "cargamos lo que pediste" a ana.paez@gmail.com con el link a la ficha, y Ana puede abrirla y leerla sin iniciar sesión.

**E2.** Dado que Ana hace click en "Registrarme" desde ese mail,
Cuando llega a Registro,
Entonces institución (UNSTA) y carrera (Licenciatura en Psicología) aparecen precargadas y de solo lectura, con la nota de por qué, y el formulario no se las vuelve a preguntar.

## Negativos

**N1.** Dado que Ana pidió "Contador Público, UNSTA" pero nunca confirmó el mail (su pedido nunca entró a la cola), cuando esa carrera se carga más adelante, entonces Ana NO recibe el mail "cargamos lo que pediste": su pedido nunca contó, así que no hay a quién avisarle por él.

## Edge cases

- El mail de aviso ("cargamos lo que pediste") rebota: ninguna fuente dice qué pasa, y es distinto del rebote en el mail de confirmación del pedido inicial. **Falta decidir**.
- Ana ya tenía una cuenta creada antes de que cargaran la carrera que pidió sin cuenta: si el aviso igual le llega a esa casilla y cómo se asocia con su cuenta ya existente, en vez de ofrecerle registrarse de nuevo, no está resuelto. **Falta decidir**.
