# Moderar sin romper el producto

> Épica del grupo **BO2 · Moderar sin romper el producto (decir que no importa más que decir que sí)** del [catálogo](../README.md). **Estado**: borrador escrito el 2026-08-19 (README, [flujo](flow.md) y sus pantallas propias con ficha y boceto mid-fi: Reportes, Verificaciones); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Moderar acá no es sacar lo que incomoda: es bajar solo lo que expone a una persona fuera de su acto público, con el texto retirado y la voz siempre intacta ([THESIS.md](../../THESIS.md), "Posición"). Dos colas separadas hacen ese trabajo. La de **reportes** junta lo que alguien denuncia después de publicado y lo que el chequeo previo retuvo antes de publicar; la trabaja Nahuel. La de **verificaciones** junta las constancias de alumno, la identidad docente y el cargo institucional, con su revalidación anual; la trabaja Camila. Las dos no pueden convivir en la misma persona. Y ninguna cantidad de reportes baja nada sola: decide una persona, con un criterio escrito y público desde antes del primer reporte.

Es moderación con un filtro previo: buena parte de lo que Nahuel resuelve nunca llegó a publicarse, porque el chequeo automático ya separó lo que habla de una persona fuera de su acto antes de que existiera como texto público. Lo que él mira a mano es la excepción, no el volumen de todo lo que se escribe.

Y es donde se resuelven las situaciones que el mapa agrupaba aparte como temas, porque pasan en la misma cola: cuando Reportes tiene cuarenta reportes y treinta retenidos, dice cuánto se tarda y qué queda para después, separa lo retenido (que nadie leyó y no está publicado) de lo reportado (que sigue publicado) y prioriza lo sin publicar, no el orden de llegada (US-212); una constancia adulterada se rechaza con motivo, sin marcar a quien la subió (US-211); un grupo de cuentas correlacionadas que reseña la misma cátedra dispara una alarma que mira la procedencia (fecha de alta, patrón idéntico, ausencia de trayectoria) y no el volumen, las cuentas marcadas dejan de sumar y los conteos se pueden congelar sin borrar nada (US-213); y doce reportes contra lo que critica a la misma facultad se agrupan por objetivo y ventana de 72 horas y se resuelven con un criterio, no de a uno, con el mail confirmado deduplicando (US-214).

## Para quién

**Nahuel** (modera: el criterio escrito de qué es exposición, que quede registrado qué bajó y por qué, que la cola de retenidos no lo convierta en el cuello del corpus) y **Camila** (verifica: ver lo mínimo para decidir, que quede registrado que lo vio, que nadie más pueda, atar la identidad, docente o institucional, a lo que el catálogo ya tiene cargado). [Cortar los accesos](../cut-the-access/README.md) es lo que hace que Nahuel y Camila no puedan ser la misma persona.

## Stories

Las 12 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-205](stories/US-205-moderate-without-removing-the-complaint.md) | Bajar solo lo que expone a alguien |
| [US-206](stories/US-206-notify-the-reporter-of-the-outcome.md) | Avisar por qué se resolvió un reporte |
| [US-207](stories/US-207-see-the-minimum-of-a-credential.md) | Ver lo mínimo para verificar una constancia |
| [US-208](stories/US-208-separate-verification-from-contributions.md) | No cruzar verificación con lo aportado |
| [US-209](stories/US-209-review-what-was-held-back.md) | Revisar lo que el chequeo retuvo |
| [US-210](stories/US-210-separate-the-teacher-identity-queue.md) | Separar la cola de identidad docente |
| [US-211](stories/US-211-reject-a-tampered-credential-without-marking.md) | Detectar una constancia adulterada |
| [US-212](stories/US-212-show-the-moderation-queue-under-backlog.md) | Mostrar la cola de moderación desbordada |
| [US-213](stories/US-213-flag-correlated-accounts-by-provenance.md) | Alertar cuentas correlacionadas por procedencia |
| [US-214](stories/US-214-group-reports-by-target-and-window.md) | Agrupar reportes por objetivo y ventana |
| [US-225](stories/US-225-verify-an-institutional-position.md) | Verificar un cargo institucional |
| [US-226](stories/US-226-revalidate-verified-identity-yearly.md) | Revalidar la identidad verificada al año |

Las stories con "tema del mapa" en sus notas vienen de los grupos transversales del mapa (BO4 · Cuando la carga no da abasto; BO5 · Cuando el corpus está bajo ataque): son temas, no actividades, y cada una vive en la única épica que la implementa. El índice del [catálogo](../README.md) conserva el tema como lista.


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 2: el chequeo previo con dos salidas; punto 3: se modera la exposición de quien aportó y de terceros, nunca la del docente ni la de la institución nombrados, y la queja dura contra ellos no es causal; lo reportado sigue publicado hasta resolver salvo el único caso de riesgo inmediato con criterio escrito; reportar confirma el mail; punto 4: se baja el texto, nunca la voz, con categoría; punto 5: la réplica pasa el mismo chequeo), D09 ([registro del 17](../../history/reviews/2026-08-17-catalog-propagation.md): verificación y moderación son roles excluyentes, equipo mínimo de cuatro), [ADR-0010](../../decisions/0010-auto-hide-threshold-configurable-by-env-var.md) (superado: en el producto nuevo ningún umbral de reportes baja nada solo), [ADR-0048](../../decisions/0048-standing-is-opt-in-and-decoupled-from-email.md) (para el alumno, verificarse es señal, no permiso), [ADR-0073](../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) (puntos 1, 2, 4, 8 y 9: la identidad docente y el cargo institucional se verifican contra el catálogo que carga el equipo, nunca contra la entidad ni por auto-servicio; si el dato no está cargado, el pedido pasa a catálogo, no se rechaza; la verificación se revalida al año sin retirar lo publicado; ante la duda, no se verifica), las Restricciones del catálogo ([índice de requisitos](../README.md): la política de moderación y réplica es pública antes de que exista el primer reporte).

## Pantallas

Las dos que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Reportes**](screens/SC-031-reports/README.md) (backoffice, rol moderación): las dos colas (lo reportado, que sigue publicado; lo retenido, sin publicar hasta que alguien mire), el criterio de exposición a la vista, la alarma de cuentas correlacionadas y los reportes agrupados; [boceto mid-fi](screens/SC-031-reports/sketch.html).
- [**Verificaciones**](screens/SC-032-verifications/README.md) (backoffice, rol verificación): las colas separadas, constancias de alumno (lo mínimo, el documento se destruye, sin camino a los aportes), identidad docente (el permiso, contra el equipo docente cargado) y cargo institucional (el permiso, contra los cargos cargados de esa institución), más la revalidación anual que devuelve una identidad vencida a su cola; [boceto mid-fi](screens/SC-032-verifications/sketch.html).

Las que comparte con otras épicas: **Anonimato** y **Método** (donde la política de moderación y réplica se publica, en [Llevarse el dato](../take-the-data/README.md)), y la [Ficha de cátedra](../choose-where-to-study/screens/SC-002-chair/README.md) (el texto retirado con su categoría).

## Lo que esta épica todavía no resuelve

- **El texto del criterio escrito de "riesgo inmediato"**: el único caso que despublica antes de resolver, y todavía falta redactarlo.
- **Qué ve exactamente Nahuel de un comentario retenido**: si es la reseña entera o solo la parte que el chequeo marcó, sin poder cruzarla con la cuenta.
- **Cómo se responde a un reporte cuyo mail confirmado rebota**: US-206 manda el criterio aplicado a ese mail y asume que llega.
- **Cómo se calcula "cuánto se tarda"** en Reportes y si usa el mismo cálculo que Pedidos (US-212, US-200).
- **Qué ve el público cuando los conteos de una cátedra están congelados** (US-213): "en revisión", los conteos de antes de congelar, u otra cosa.
- **Quién desmarca una cuenta marcada por error y cómo se entera esa persona**: hoy nada se le dice.
- **Si la alarma de US-213 corre sola o la dispara Nahuel** al notar un patrón sobre una cátedra, y si un ataque coordinado de reportes puede disparar el camino de "riesgo inmediato" de US-205 o son dos mecanismos que nunca se tocan.
- **Qué pasa con la réplica ya publicada cuando la revalidación vence y la persona no renueva**: [ADR-0073](../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) no lo decide (US-226).
