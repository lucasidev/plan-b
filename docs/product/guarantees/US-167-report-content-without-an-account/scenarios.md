# US-167: Reportar algo sin registrarme

> Los casos de [US-167](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en la ficha de Análisis Matemático II, Cátedra Paredes, UNSTA hay un testimonio publicado que habla de la vida privada de Prof. Paredes, fuera de su rol docente.
Cuando Prof. Paredes hace click en Reportar sobre ese testimonio sin haberse registrado en plan-b, elige un motivo y deja su mail.
Entonces el reporte se manda sin pedirle ninguna cuenta ni contraseña.

**E2.** Dado que Prof. Paredes ya mandó el reporte con su mail.
Cuando recibe el mail de confirmación y hace click en el link.
Entonces recién ahí el reporte entra a la cola de Reportes que ve Nahuel; antes de ese click no aparecía ahí.

**E3.** Dado que el mismo testimonio recibió 8 reportes de 8 mails distintos, todos confirmados, contra la misma cátedra, dentro de una ventana de 72 horas.
Cuando todavía nadie del equipo de moderación revisó el caso.
Entonces el testimonio sigue publicado igual: los 8 reportes no lo bajan solos, recién se baja si Nahuel lo revisa y decide bajar el texto con una categoría.

## Negativos

**N1.** Dado que alguien reporta un testimonio y nunca hace click en el link de confirmación del mail.
Cuando pasa el tiempo.
Entonces ese reporte nunca entra a la cola de Reportes: Nahuel no llega a verlo.

**N2.** Dado que Prof. Paredes, sin cuenta en plan-b, quiere reportar un testimonio.
Cuando hace click en Reportar y completa el modal.
Entonces el sistema no le pide crear una cuenta ni iniciar sesión en ningún paso del reporte.

**N3.** Dado que el mismo mail de Prof. Paredes manda dos reportes confirmados sobre el mismo testimonio.
Cuando Nahuel abre la cola.
Entonces cuenta como un solo reporte, no dos: el mail confirmado deduplica.

**N4.** Dado que un reporte dice que la cátedra de Análisis Matemático II, Cátedra Paredes, es un desastre y que toda la facultad debería revisarla, sobre un testimonio que solo marca frases duras contra esa cátedra, sin exponer a ninguna persona.
Cuando Nahuel lo revisa.
Entonces no lo baja: una queja dura contra la cátedra o la institución no es causal, aunque sea muy dura.

## Edge cases

- Un caso de riesgo inmediato es el único que se despublica antes de que Nahuel lo resuelva.
- Reportes contra la misma cátedra en una ventana de 72 horas, pero de mails que nunca se confirmaron, no se agrupan porque nunca entraron a la cola.

**Falta decidir**: el texto exacto del criterio escrito de riesgo inmediato, la épica lo señala como pendiente de redactar. **Falta decidir**: cómo se responde a un reporte cuyo mail confirmado rebota.
