# Reportes (la pantalla)

> Ficha de pantalla, dueña: la épica [Moderar sin romper el producto](../../README.md). **Alcance rebasado el 2026-08-25** ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)): sin texto publicado, esta pantalla se redefine con la épica: ya no hay contenido público que reportar ni testimonio que retener antes de publicarse. **Cuerpo reescrito el 2026-08-26** a las tres guardias que le quedan a Nahuel: el filtro grueso del campo libre, el canal de reclamos institucionales y la alarma de cuentas correlacionadas. **El [boceto](sketch.html) todavía dibuja el modelo anterior** (colas de "reportado" y "retenido" sobre texto público) y queda pendiente de su propio rehecho. Backoffice, rol moderación (Nahuel). Slug hoy `/admin/moderacion/reportes`, en castellano contra la convención de nombrar identificadores en inglés: se corrige al tocar la ruta.

## Quién la usa

**Nahuel** (modera: necesita el criterio escrito de cada guardia, que quede registrado qué se resolvió y por qué, y que la cola no lo convierta en un cuello de botella). Nadie más entra: [Cortar los accesos](../../../cut-the-access/README.md) hace que quien tiene el rol de verificación no pueda tener también este (US-217).

## Qué stories resuelve

US-212 (la cola desbordada: cuánto se tarda, cómo se prioriza), US-213 (la alarma de cuentas correlacionadas y el conteo congelado), US-214 (los reclamos agrupados por objetivo y ventana de 72 horas). De [Cortar los accesos](../../../cut-the-access/README.md#stories): US-217 (moderación y verificación son roles excluyentes: quien tiene este rol no puede tener también el de verificación). La letra completa: [README de la épica](../../README.md#stories); para US-217, el [README de Cortar los accesos](../../../cut-the-access/README.md#stories).

## Qué muestra

Arriba, el criterio escrito de cada guardia a la vista (texto exacto pendiente, ver "Lo que esta ficha deja abierto").

- **Filtro grueso del campo libre**: la cola de comentarios que el filtro automático marcó (ADR-0055, repropuesto para proteger al equipo de curaduría, no al feed público) antes de que pasen a destilarse o citarse en una nota editorial. Liberar lo manda a la cola normal de curaduría; descartarlo lo saca sin que llegue a destilarse ni citarse, y sin que se haya publicado nunca.
- **Canal de reclamos**: la cola de lo que una institución objeta (una nota editorial o un dato relevado como publicado), con su motivo. Resolver es contrastar contra la fuente y elegir: se corrige el dato o se retira la nota, o el dato queda igual; cualquiera de las dos queda con quién lo resolvió y cuándo. Ningún reclamo baja nada solo.
- **La alarma de cuentas correlacionadas**: un grupo con la misma fecha de alta, el mismo patrón y sin trayectoria propia, reseñando la misma cátedra. Mira la procedencia, no el volumen: cuarenta cuentas con historia distinta no la disparan. Marcarlas les saca la voz de cualquier agregado; los conteos de la cátedra se pueden congelar sin borrar nada (US-213).

## Estados

- **Estado "cola desbordada"**: con el campo libre filtrado y los reclamos acumulados, la pantalla dice cuánto se tarda y qué queda para después, sin ordenar estrictamente por llegada (US-212).
- **Estado "grupo de reclamos"**: reclamos contra el mismo dato de la misma institución en una ventana de 72 horas se ven y se resuelven juntos; el mail confirmado deduplica, dos del mismo mail cuentan uno (US-214, D05).

## Lo que no muestra nunca

- La identidad de quien escribió el campo libre que el filtro marcó: Nahuel decide sobre el texto, no sobre la persona.
- Nada resuelto solo, ni por cantidad de reclamos ni por vencimiento de tiempo.
- Ningún dato bajado por ser una queja dura contra la cátedra o la institución: eso no pasa por acá, porque no hay texto público que bajar.

## Adónde va

Llega desde el campo libre de cualquier reseña, filtrado automáticamente antes de llegar a curaduría, y desde el reclamo que una institución manda sobre un dato publicado (dónde exactamente se dispara ese reclamo es un hueco declarado abajo). Al resolver, un dato corregido se ve corregido en la ficha pública correspondiente. No tiene "siguiente pantalla": vuelve a la cola.

## Decisiones que aplica

[ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el texto libre no se publica nunca: sin contenido público, sin chequeo previo a publicación), [ADR-0055](../../../../../decisions/0055-content-filter-is-a-coarse-first-pass-not-a-verdict.md) (el filtro es un primer paso grueso que deriva a revisión humana, nunca un juez que rechaza), D09 ([registro del 17](../../../../../history/reviews/2026-08-17-catalog-propagation.md): verificación y moderación excluyentes), [THESIS.md](../../../../../THESIS.md) ("Posición": se modera lo que expone a una persona, no lo que incomoda a la institución).

## Lo que esta ficha deja abierto

- **El texto exacto del criterio escrito** de cada guardia (filtro grueso, reclamos).
- **Desde dónde se dispara un reclamo institucional**: qué botón, en qué ficha (de institución, de carrera) lo abre.
- **Cómo se ordenan entre sí** el campo libre filtrado, los reclamos y la alarma de cuentas correlacionadas cuando las tres tienen pendientes.
