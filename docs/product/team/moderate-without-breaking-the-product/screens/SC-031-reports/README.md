# Reportes (la pantalla)

> Ficha de pantalla, dueña: la épica [Moderar sin romper el producto](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de las dos colas y sus estados; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Backoffice, rol moderación (Nahuel). Slug hoy `/admin/moderacion/reportes`, en castellano contra la convención de nombrar identificadores en inglés: se corrige al tocar la ruta.

## Quién la usa

**Nahuel** (modera: necesita el criterio escrito de qué es exposición, que quede registrado qué bajó y por qué, y que la cola de retenidos no lo convierta en el cuello del corpus). Nadie más entra: [Cortar los accesos](../../../cut-the-access/README.md) hace que quien tiene el rol de verificación no pueda tener también este (US-217).

## Qué stories resuelve

US-205 (qué se modera y qué no: protegida la exposición de quien aportó y de terceros, nunca la del docente evaluado ni la de la institución), US-206 (el criterio aplicado vuelve al mail de quien reportó), US-209 (la cola de lo retenido por el chequeo previo, con la parte marcada), US-212 (la cola desbordada: cuánto se tarda, prioriza lo sin publicar), US-213 (la alarma de cuentas correlacionadas y el conteo congelado), US-214 (los reportes agrupados por objetivo y ventana de 72 horas). De [Cortar los accesos](../../../cut-the-access/README.md#stories): US-217 (moderación y verificación son roles excluyentes: quien tiene este rol no puede tener también el de verificación). De [Llevarse el dato](../../../../student/take-the-data/README.md): US-181 (lo bajado, contable por categoría, sin contenido) y US-186 (la ficha pública muestra que hubo un texto retirado). De [Deshacer](../../../../student/undo/README.md#stories): US-167 (nada baja solo por cantidad de reportes: lo resuelve una persona). La letra completa: [README de la épica](../../README.md#stories), para US-217 el [README de Cortar los accesos](../../../cut-the-access/README.md#stories), para US-181 y US-186 el [README de Llevarse el dato](../../../../student/take-the-data/README.md#stories) y para US-167 el [README de Deshacer](../../../../student/undo/README.md#stories).

## Qué muestra

Arriba, el criterio de exposición siempre a la vista: protegemos a quien aportó y a los terceros que nombra; el docente evaluado en su rol y la institución no son causal, por dura que sea la queja (US-205).

- **Lo reportado**: sigue publicado mientras espera. Cada fila trae el testimonio o dato reportado, el motivo de quien reportó, el objetivo (cátedra o institución) y desde cuándo espera. Resolver es elegir: queda publicado, o se baja el texto con una categoría (nunca la voz: las frases marcadas de esa reseña siguen contando).
- **Lo retenido**: comentarios y réplicas que el chequeo previo frenó antes de publicarse, con la parte que los retuvo marcada; nadie los leyó todavía y no están publicados (US-209). Se liberan o se bajan igual que un reporte.
- **Resolver**: al decidir, el criterio aplicado viaja al mail de quien reportó, sea cual sea la resolución (US-206).
- **La alarma de cuentas correlacionadas**: un grupo con la misma fecha de alta, el mismo patrón y sin trayectoria propia, reseñando la misma cátedra. Mira la procedencia, no el volumen: cuarenta cuentas con historia distinta no la disparan. Marcarlas les saca la voz de cualquier agregado; los conteos de la cátedra se pueden congelar sin borrar nada (US-213).

## Estados

- **Estado "riesgo inmediato"**: el único caso que se despublica antes de resolver, con un criterio escrito; el boceto lo marca como excepción, no como default.
- **Estado "cola desbordada"**: con cuarenta reportes y treinta retenidos, la pantalla dice cuánto se tarda y qué queda para después, priorizando lo sin publicar por sobre el orden de llegada (US-212).
- **Estado "grupo de reportes"**: reportes contra la misma cátedra o institución en una ventana de 72 horas se ven y se resuelven juntos; el mail confirmado deduplica, dos reportes del mismo mail cuentan uno (US-214, D05).

## Lo que no muestra nunca

- El nombre de quien reportó, en ningún lado más que en el mail al que se le contesta (reportar no pide cuenta).
- La identidad de quien escribió lo reportado o lo retenido: Nahuel decide sobre el texto, no sobre la persona.
- Un texto bajado por ser una queja dura contra la cátedra o la institución: no es causal (US-205).
- Nada bajado ni publicado solo, ni por cantidad de reportes ni por vencimiento de tiempo.
- Las frases de una reseña cuyo comentario se bajó: siguen contando (se baja el texto, nunca la voz).

## Adónde va

Llega desde el **Reportar** de cualquier ficha pública (acción inline sin cuenta, épica [Deshacer](../../../../student/undo/README.md), US-167) y desde lo que el chequeo previo retiene al publicarse en [Reseñar](../../../../student/write-a-review/README.md) o [Responder](../../../../reviewed/reply/README.md) (ADR-0068 punto 5). Al resolver, el criterio aplicado va al mail de quien reportó; un texto bajado se ve como retirado en la ficha pública ([Ficha de cátedra](../../../../student/choose-where-to-study/screens/SC-002-chair/README.md)). No tiene "siguiente pantalla": vuelve a la cola.

## Decisiones que aplica

[ADR-0068](../../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (puntos 2 a 5: el chequeo previo, la exposición, bajar el texto nunca la voz, la réplica con las mismas reglas), [ADR-0010](../../../../../decisions/0010-auto-hide-threshold-configurable-by-env-var.md) (superado: ningún umbral de reportes baja nada solo), D05 y D09 ([registro del 17](../../../../../history/reviews/2026-08-17-catalog-propagation.md)), [THESIS.md](../../../../../THESIS.md) ("Posición": se modera lo que expone a una persona, no lo que incomoda a la institución).

## Lo que esta ficha deja abierto

- **El texto exacto del criterio escrito de "riesgo inmediato"**: la épica lo señala como pendiente de redactar; el boceto muestra el estado sin inventar la letra.
- **La taxonomía completa de categorías para bajar un texto**: los requisitos piden elegir una categoría, no listan las opciones.
- **Cómo se ordenan entre sí lo reportado y lo retenido** cuando las dos colas tienen pendientes.
- **Qué ve exactamente Nahuel de un comentario retenido**: la reseña entera o solo la parte marcada, sin poder cruzarla con la cuenta.
- **Cómo se responde a un reporte cuyo mail confirmado rebota.**
