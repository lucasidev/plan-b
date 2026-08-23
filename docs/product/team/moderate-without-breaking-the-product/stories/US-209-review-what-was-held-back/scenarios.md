# US-209: Revisar lo que el chequeo retuvo

> Los casos de [US-209](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que el comentario de Lucía sobre Cátedra Pérez, donde cuenta que el titular es alcohólico y que se nota en las clases, quedó retenido por el chequeo previo con la parte "es alcohólico" marcada como lo que lo retuvo.
Cuando Nahuel abre la cola de retenidos en Reportes.
Entonces ve ese comentario con esa parte resaltada, junto con cualquier réplica retenida de la misma forma: nadie lo leyó todavía y no está publicado.

**E2.** Dado que el comentario de Lucía quedó retenido apenas intentó publicarlo, antes de que Nahuel lo haya mirado.
Cuando Lucía entra a Mis aportes.
Entonces ve que ese comentario está retenido y la razón (habla de la salud del titular, fuera de su acto público), sin tener que esperar a que el equipo lo resuelva para enterarse.

**E3.** Dado que Nahuel revisa el comentario retenido de Lucía y confirma que expone la salud del titular fuera de su acto público.
Cuando decide bajarlo.
Entonces elige la categoría "Vida privada, salud o familia" antes de confirmar.

**E4.** Dado que el comentario de Matías sobre Cátedra Pérez, "el ayudante Ibarra llega siempre tarde a las clases de consulta", quedó retenido porque nombra a un tercero.
Cuando Nahuel lo revisa y confirma que describe un acto público del ayudante en su rol de cátedra, no su vida privada.
Entonces lo libera y el comentario se publica.

**E5.** Dado que el comentario retenido de Lucía lleva diez días esperando sin que Nahuel lo haya mirado.
Cuando pasa ese tiempo.
Entonces sigue sin publicarse: nada retenido se publica solo por vencimiento de tiempo.

## Negativos

**N1.** Dado que el comentario de Lucía está retenido.
Cuando cualquiera que no sea del equipo de moderación busca leerlo en la Ficha de cátedra.
Entonces no lo encuentra: no está publicado mientras espera en la cola.

## Edge cases

- Si las frases que Lucía marcó en esa misma reseña (por ejemplo, si también marcó F18) cuentan mientras su comentario sigue retenido, o si toda la reseña espera junto con el texto: ninguna story de la épica lo dice. **Falta decidir**.
- Un comentario retenido con la parte marcada, pero cuya réplica (US-172) también quedó retenida por la misma razón: las dos conviven en la misma cola, cada una con su propia categoría al resolverse.
- Una reseña sin comentario (solo frases marcadas) nunca entra a esta cola, porque no hay texto que el chequeo previo pueda retener.
