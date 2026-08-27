# US-226: Revalidar la identidad verificada al año

> Los casos de [US-226](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que a Claudia Fernández le aprobaron su identidad docente como titular de Cátedra Pérez el 2025-08-21.
Cuando llega el 2026-08-21, un año después.
Entonces esa identidad vence y vuelve a la cola de Verificaciones para que Camila la revise de nuevo, con autor y fecha como cualquier otra resolución de la cola.

**E2.** Dado que a Marcela Sosa le aprobaron su cargo de Secretaría Académica en UNSTA el 2025-08-21.
Cuando llega el 2026-08-21.
Entonces ese cargo también vence y vuelve a la cola de Verificaciones, con la misma regla que la identidad docente: toda identidad verificada, sea docente o cargo institucional, vence al año.

**E3.** Dado que la respuesta de Claudia Fernández sobre los números de Cátedra Pérez ya se publicó, firmada "Claudia Fernández, titular, identidad verificada", mientras su verificación estaba vigente.
Cuando su identidad vence al año.
Entonces esa respuesta sigue publicada exactamente igual, con la misma firma: lo ya publicado no se retira cuando la verificación vence, porque era cierto cuando se publicó.

## Negativos

**N1.** Dado que la identidad docente de Claudia venció y todavía no se revalidó.
Cuando Claudia intenta escribir una respuesta nueva.
Entonces Responder no le habilita el campo: para responder de nuevo necesita pasar otra vez por la cola de Verificaciones.

## Edge cases

- Entre que la identidad de Claudia vence y Camila llega a revisarla de nuevo pasa un tiempo en el que espera en la cola: si durante esa espera puede seguir usando alguna respuesta ya empezada, o queda bloqueada desde el mismo día del vencimiento, no está decidido. **Falta decidir**.
- Qué pasa con la respuesta ya publicada si la persona no renueva nunca más: ADR-0073 no lo decide (nota de la story y README de la épica). **Falta decidir**.
- Una identidad que vence y se revalida el mismo día: el nuevo año de vigencia cuenta desde la nueva aprobación, no desde la anterior.
