# Replicar

> Épica del grupo **O7 · Contestar lo que se publicó (con nombre, porque es público)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y su pantalla propia con ficha y boceto mid-fi ([Responder](screens/SC-020-respond/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

La respuesta del docente o de la institución a lo que se publicó sobre su cátedra: con nombre, porque responder es un acto público. La réplica pasa el mismo chequeo previo que un comentario, no puede citar la parte que el autor dejó marcada como identificante, y espera un plazo desde el aviso al autor antes de publicarse: en ese plazo el autor edita, borra o pide revisión. Publicada, queda al lado del testimonio, con nombre y rol, sin bajarlo ni mover ningún conteo. Responder pide identidad verificada contra la cátedra del catálogo, en una cola propia separada de las constancias de alumno: para el docente, verificar es el permiso de publicar con su nombre, no una señal. Cuando no hay réplica, la ficha declara el estado del canal, nunca el silencio: "sin réplica" o "docente sin identidad verificada". Del lado de la institución, la misma lógica se lee en su ficha: la serie por período, y la comparación frase por frase contra las demás, sin puesto ni orden por valor.

## Para quién

**Claudia** (da bien su materia; le conviene que se publique y le da miedo que se publique). **Prof. Paredes** (no piensa contestar: el silencio es una posición, y no se presume). **La institución** (en qué está peor que la de al lado; si mejoró desde que lo publicaron).

## Stories

Las 9 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-227](stories/US-227-claim-an-institutional-position-to-reply/README.md) | Pedir que verifiquen mi cargo antes de responder |
| [US-172](stories/US-172-reply-with-a-verified-identity/README.md) | Responder con identidad verificada |
| [US-173](stories/US-173-show-two-axes-without-a-score/README.md) | Mostrar los dos ejes sin puntaje |
| [US-174](stories/US-174-compare-institutions-side-by-side/README.md) | Comparar instituciones lado a lado |
| [US-175](stories/US-175-notify-mentions-without-timestamps/README.md) | Avisar al docente que lo nombraron |
| [US-176](stories/US-176-declare-channel-state-never-silence/README.md) | Declarar el estado del canal |
| [US-177](stories/US-177-track-change-across-periods/README.md) | Ver la serie por período |
| [US-178](stories/US-178-verify-identity-before-replying/README.md) | Verificar identidad antes de responder |
| [US-179](stories/US-179-withhold-the-reply-until-author-responds/README.md) | No quedar expuesto por la réplica |

Las filas con "tema del mapa" vienen de los grupos transversales del mapa (T2 · Cuando el riesgo es real): son temas, no actividades, y cada uno de sus requisitos vive en la única épica que lo implementa. El índice del [catálogo](../../README.md) conserva el tema como lista.


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 5: la réplica pasa el mismo chequeo, no cita lo marcado, retenida el plazo desde el aviso, solo identidad docente o institucional verificada, queda al lado con nombre y rol, no baja ni mueve conteos; punto 6: orden por votos), [ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la serie por el período en que pasó, sin suavizar, con publicación y réplica marcadas; la comparación lado a lado sin ordenar por valor), D06 ([registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md): el estado del canal, "sin réplica" y "docente sin identidad verificada", nunca "no quiso responder"), [ADR-0009](../../../decisions/0009-review-anonymity-is-a-presentation-rule.md) (el anonimato como regla de presentación).

## Pantallas

Las dos que existen por esta épica viven acá, con su ficha y su boceto:

- [**Ficha de institución**](screens/SC-005-institution/README.md) (pública, sin cuenta): donde la institución se ve a sí misma, con la serie por período (US-177), la comparación frase por frase contra las demás sin puesto (US-174) y su réplica al lado del testimonio (US-172). Se movió acá desde Elegir dónde estudiar el 2026-08-20: sus stories tienen rol "la institución", no "quien lee".

- [**Responder**](screens/SC-020-respond/README.md) (con identidad verificada): el testimonio con la parte no citable marcada, la respuesta con su chequeo previo, el plazo visible y cómo queda publicada; [boceto mid-fi](screens/SC-020-respond/sketch.html) con sus tres pasos y sus estados.

Las que comparte con otras épicas: [**Verificar**](../../student/care-for-what-is-published/screens/SC-022-verify/README.md) (identidad docente, el permiso para responder), [**Mis aportes**](../../student/undo/screens/SC-018-my-contributions/README.md) (el autor ve ahí el aviso de la réplica y su plazo, US-179) y [**Ficha de institución**](screens/SC-005-institution/README.md) (la serie por período, la comparación frase por frase), además de la [Ficha de cátedra](../../student/choose-where-to-study/screens/SC-002-chair/README.md) (la réplica al lado del testimonio, el estado del canal, la serie). En el backoffice, **Verificaciones** y **Reportes** (la cola de retenidos, US-209), las dos de [Moderar sin romper el producto](../../team/moderate-without-breaking-the-product/README.md). Los mails de [Avisos](../../notices/README.md) (el resumen periódico al docente, sin timestamps por reseña) traen hasta acá.

## Lo que esta épica todavía no resuelve

- **Qué pasa con una réplica publicada cuando la verificación de su autor vence** y no la renueva: [ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) fija que se revalida al año y que lo publicado no se retira, pero no dice si el canal vuelve a declararse vacío ni si el cargo se muestra con la fecha en que se verificó.
- **Cuánto dura el plazo de US-179** antes de publicar la réplica: el número falta.
- **Qué pasa con la réplica ya publicada si el testimonio se borra después**.
- **Si la institución replica sobre la ficha de institución entera o sobre el testimonio de un evento institucional puntual**.
