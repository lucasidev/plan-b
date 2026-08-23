# US-176: Declarar el estado del canal

> Los casos de [US-176](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Prof. Paredes pidió verificar que es titular de Cátedra Ibáñez (Física II, UNSTA) y ese pedido todavía está pendiente de resolver
Cuando alguien entra a la Ficha de Cátedra Ibáñez y no hay ninguna réplica
Entonces el estado del canal se muestra como "sin réplica", nunca como "no quiso responder".

**E2.** Dado que el titular de Cátedra Gómez (la otra cátedra de Análisis Matemático II en UNSTA) nunca se registró ni pidió verificar su identidad
Cuando alguien entra a la Ficha de Cátedra Gómez y no hay ninguna réplica
Entonces el estado del canal se muestra como "docente sin identidad verificada", porque nunca se le pudo avisar.

## Negativos

**N1.** Dado cualquiera de los dos casos anteriores (pendiente de verificación, o nunca verificado)
Cuando se muestra el estado del canal
Entonces en ningún caso aparece el texto "no quiso responder" ni ninguna frase que presuma la intención del docente.

## Edge cases

- Prof. Paredes deja Cátedra Ibáñez (se retira o lo reemplazan) sin que nadie asuma su lugar todavía: qué estado muestra el canal en ese momento. **Falta decidir**: ninguna story de esta épica lo cubre.
- La identidad verificada de un docente vence al año (US-226) y no la renueva: si el canal vuelve a mostrarse como "docente sin identidad verificada" pese a que antes sí respondió. **Falta decidir** (abierto en el README de la épica).
