# US-227: Pedir que verifiquen mi cargo antes de responder

> Los casos de [US-227](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Marcela Sosa nunca pidió verificar ningún cargo institucional, y quiere responder al testimonio sobre el trámite de título de UNSTA que marcó F31 "El título tardó meses"
Cuando entra a Verificar y pide la verificación diciendo que tiene el cargo de Secretaría Académica en UNSTA
Entonces el pedido queda pendiente de revisión y, hasta que se resuelva, Responder no le muestra ningún campo para escribir la réplica.

**E2.** Dado que Marcela Sosa está completando el pedido de verificación de su cargo institucional
Cuando llega al paso de elegir qué cargo tiene
Entonces solo puede elegir entre los cargos genéricos de la lista corta del catálogo (por ejemplo, Secretaría Académica, Departamento de Alumnos), sin ningún campo de texto libre (US-224).

**E3.** Dado que a Marcela Sosa le aprobaron el cargo de Secretaría Académica de UNSTA (US-225)
Cuando su réplica al testimonio sobre el trámite de título se publica
Entonces queda firmada "Marcela Sosa, Secretaría Académica, UNSTA": en ningún lado aparece "Responde UNSTA" sin el nombre de una persona.

## Negativos

**N1.** Dado que Marcela Sosa todavía no pidió verificar su cargo institucional
Cuando intenta responder al testimonio sobre el trámite de título de UNSTA
Entonces no hay ningún campo de respuesta disponible: la pantalla la deriva a pedir la verificación primero.

## Edge cases

- Marcela Sosa pide un cargo que la lista corta todavía no cubre porque UNSTA recién se cargó: el pedido no se rechaza, pasa a ser trabajo de catálogo y se resuelve cuando el cargo está cargado (US-225); mientras tanto sigue sin campo de respuesta.
- Dos personas distintas piden verificarse con el mismo cargo genérico en la misma institución (dos "Secretaría Académica" de UNSTA): la story no dice si eso está permitido. **Falta decidir**.
- El cargo de Marcela Sosa vence al año (US-226) y no lo renueva: qué pasa con la réplica que ya publicó no está decidido. **Falta decidir** (abierto en el README de la épica).
