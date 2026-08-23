# US-140: Pedir la carga sin registrarme

> Los casos de [US-140](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ana completa institución (UTN, Facultad Regional Tucumán), carrera (Ingeniería en Sistemas de Información) y su mail (ana.paez@gmail.com) en Pedir, sin que se le pida contraseña ni ningún otro dato de cuenta,
Cuando manda el pedido,
Entonces plan-b le manda un mail para confirmar, y el pedido queda en "mail enviado": todavía no suma al conteo público.

**E2.** Dado que Ana confirma desde el link de ese mail,
Cuando vuelve a Pedir,
Entonces ve "tu pedido cuenta: sos el 23° que la pide", y La cola pasa a mostrar 23 pedidos confirmados para "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán".

## Negativos

**N1.** Dado que Ana pide "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán" pero nunca hace click en el link de confirmación, cuando pasa el tiempo sin que confirme, entonces su pedido NO entra a la cola ni cuenta como reclamo: el conteo público de esa carrera no se mueve por su pedido.

**N2.** Dado que Ana ya pidió "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán" con ana.paez@gmail.com y la confirmó, cuando vuelve a pedir la misma carrera con el mismo mail, entonces el pedido NO se duplica: sigue contando una sola vez (D03), y La cola sigue en 23 pedidos confirmados, no pasa a 24.

## Edge cases

- Pedir algo ambiguo, como "la carrera de sistemas de la UTN de acá" en vez del nombre exacto: la épica todavía no resuelve si Pedir ofrece elegir de una lista de instituciones conocidas o acepta texto libre que Sofía interpreta después. **Falta decidir**.
- Un mail que rebota al mandar la confirmación: ninguna fuente dice si se avisa de otra forma o el pedido queda mudo. **Falta decidir**.
- Pedir con una institución que no existe en ningún catálogo conocido, tipeada a mano: no hay criterio escrito de si Pedir la acepta igual, la rechaza, o la deja pendiente de que Sofía la interprete. **Falta decidir**.
