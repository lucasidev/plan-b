# US-206: Avisar por qué se resolvió un reporte

> Los casos de [US-206](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Prof. Paredes reportó, con su mail confirmado, el testimonio de Matías sobre Cátedra Pérez, y Nahuel lo resuelve bajando el comentario con la categoría "Datos de contacto".
Cuando la resolución se guarda.
Entonces le llega un mail a Prof. Paredes, al mismo mail confirmado desde el que reportó, con el criterio aplicado a esa resolución puntual, no un acuse genérico de "recibimos tu reporte".

**E2.** Dado que Nahuel resuelve otro reporte dejando el testimonio publicado, porque la queja era dura contra Cátedra Paredes y no expone a nadie (US-205).
Cuando esa resolución se guarda.
Entonces también le llega al mail confirmado de quien reportó un aviso con el criterio aplicado, sea cual sea la resolución: que quedó publicado y por qué.

## Negativos

**N1.** Dado que alguien reportó un testimonio pero nunca confirmó el mail con el link de confirmación.
Cuando Nahuel resuelve otros reportes de esa misma cola.
Entonces a esa persona no le llega ningún aviso: su reporte nunca entró a la cola porque el mail nunca se confirmó, así que no hay nada que resolver ni que avisar.

## Edge cases

- Cómo se responde a un reporte cuyo mail confirmado rebota: la épica lo deja abierto. **Falta decidir**.
- Un reporte que se resolvió como parte de un grupo de doce contra la misma facultad (US-214): si cada mail confirmado del grupo recibe el mismo criterio aplicado por separado o un aviso conjunto no está definido. **Falta decidir**.
- Reportar no pide cuenta, así que el mail es el único canal: no existe una notificación dentro de la cuenta de quien reportó, ni siquiera si esa persona tiene una cuenta en plan-b.
