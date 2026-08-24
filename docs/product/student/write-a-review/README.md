# Reseñar

> Épica del grupo **O4 · Que quede registrado (sin que me cueste la cursada)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-18 y completado el 2026-08-19: README con sus 19 requisitos, [flujo](flow.md) con la entrada por el umbral, y las dos pantallas propias con ficha y boceto mid-fi ([Reseñar](screens/SC-015-write-review/README.md), [Mi situación](screens/SC-014-my-status/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

El acto principal del producto: elegir una materia que cursaste y reseñar esa cursada en menos de cinco minutos, marcando frases y, si querés, escribiendo en tus palabras ([THESIS.md](../../../THESIS.md), decisión 4). Es la única puerta por la que un hecho entra al corpus ([ADR-0069](../../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)): la reseña lleva la materia y el período, cómo terminó, la cátedra si la recordás, las frases que marcás, el comentario opcional, y las clases sin dar si marcaste que hubo. Incluye reseñar un evento institucional (sin materia) y las preguntas de trayectoria que aparecen de a una: cuándo entraste, la primera vez; y si el período que contás es viejo, si seguís cursando, te recibiste o te fuiste (Mi situación).

También es donde se resuelven las situaciones que el mapa agrupaba aparte como temas, porque pasan en el acto de reseñar: la materia que no está en el plan cargado se reseña igual y queda pendiente de vincular (US-160); la recursada es otra reseña, otro período (US-163); lo que quedó a medias se retoma (US-161); discrepar con lo que dice la ficha es reseñar tu cursada y marcar la frase del otro sentido, no reportar (US-164); antes de publicar corren el chequeo previo del comentario (US-158) y el aviso de que en un grupo chico pueden sospechar (US-159); y al terminar, Mis aportes muestra qué sumó cada frase (US-162).

## Para quién

**Lucía** (cursa, veinte horas de trabajo: cinco minutos o no lo hace), **Matías** (quiere que quede registrado, no le importa el producto), **Diego** (dejó la carrera: puede reseñar una materia sola aunque ya no curse, y decir cuándo se fue). Y quien no quiere escribir: vota la reseña de otro (US-188, en la épica Cuidar lo publicado).

## Stories

Las 19 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-146](stories/US-146-review-in-under-five-minutes/README.md) | Reseñar en menos de cinco minutos |
| [US-147](stories/US-147-review-a-single-subject/README.md) | Reseñar una materia sola |
| [US-148](stories/US-148-publish-without-revealing-the-author/README.md) | Que nadie sepa que fui yo |
| [US-149](stories/US-149-notify-when-the-period-closes/README.md) | Avisar cuando cierra el período |
| [US-150](stories/US-150-declare-classes-not-given/README.md) | Declarar cuántas clases no se dieron |
| [US-151](stories/US-151-review-after-leaving-the-degree/README.md) | Reseñar por qué me fui |
| [US-152](stories/US-152-declare-the-departure-year/README.md) | Decir en qué año me fui |
| [US-153](stories/US-153-not-treated-as-a-failure/README.md) | No ser tratado como un fracaso |
| [US-154](stories/US-154-declare-the-outcome-in-one-tap/README.md) | Decir cómo terminó la cursada |
| [US-155](stories/US-155-ask-entry-year-once/README.md) | Preguntar el año de ingreso una vez |
| [US-156](stories/US-156-asked-by-mail-about-graduation/README.md) | Preguntar por mail si me recibí |
| [US-157](stories/US-157-review-an-institutional-event/README.md) | Reseñar un evento institucional |
| [US-158](stories/US-158-warn-if-a-comment-identifies-me/README.md) | Avisar si el comentario me delata |
| [US-159](stories/US-159-no-data-crossing-identifies-me/README.md) | Que ningún cruce me identifique |
| [US-160](stories/US-160-review-a-subject-not-in-plan/README.md) | Reseñar una materia fuera del plan |
| [US-161](stories/US-161-resume-a-draft-review/README.md) | Retomar una reseña a medias |
| [US-162](stories/US-162-see-the-impact-of-my-review/README.md) | Ver qué cambió con mi aporte |
| [US-163](stories/US-163-review-the-same-subject-twice/README.md) | Reseñar la misma materia dos veces |
| [US-164](stories/US-164-mark-the-opposite-phrase/README.md) | Marcar el sentido contrario de una frase |

Las stories que citan "tema del mapa" en su nota vienen de los grupos transversales del mapa (T2 · Cuando el riesgo es real; T3 · Cuando el catálogo no alcanza; T4 · Y quien no está de acuerdo): son temas, no actividades, y cada una vive en la única épica que la implementa. El índice del [catálogo](../../README.md) conserva el tema como lista.


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0064](../../../decisions/0064-phrases-with-voices-not-scores.md) (la reseña: cursada, frases, comentario, votos; el evento aparte), [ADR-0065](../../../decisions/0065-attribution-is-the-axis-not-a-split.md) (cada frase trae su sujeto y su eje: nada se pregunta), [ADR-0067](../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (cómo terminó; entré una vez; me fui / me recibí por cuatro caminos; el silencio no se infiere), [ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el comentario con tope, el chequeo previo con dos salidas, el aviso de la sospecha, publicar con o sin comentario), [ADR-0069](../../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md) (la reseña es la única puerta de un hecho), D02 (clases sin dar), D08 (la pendiente de vincular no cuenta hasta vincularse). El catálogo de frases que se ofrece: [`phrases.md`](../../phrases.md).

## Pantallas

Las dos que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Reseñar**](screens/SC-015-write-review/README.md) (con cuenta): los seis pasos, sus estados y las salidas; [boceto mid-fi](screens/SC-015-write-review/sketch.html) de todos los pasos.
- [**Mi situación**](screens/SC-014-my-status/README.md) (con cuenta): la pregunta de trayectoria, sola; [boceto mid-fi](screens/SC-014-my-status/sketch.html). También aparece embebida en el paso 2 de Reseñar cuando el período es viejo.

Las que comparte con otras épicas: [**Ingresar**](../enter/screens/SC-025-sign-in/README.md) y [**Registro**](../enter/screens/SC-026-sign-up/README.md) (el umbral: el gate está en la acción, con el motivo a la vista y vuelta a donde ibas), [**Mis aportes**](../undo/screens/SC-018-my-contributions/README.md) (qué sumó cada frase; lo pendiente de vincular; retomar lo a medias), la [Ficha de cátedra](../choose-where-to-study/screens/SC-002-chair/README.md) y la [Ficha de materia](../choose-where-to-study/screens/SC-007-subject/README.md) (de donde llega y adonde vuelve), y la [Ficha de institución](../../reviewed/reply/screens/SC-005-institution/README.md) (el evento institucional se lee ahí). Y las que son de otra épica y esta recorre: [Empezar](../my-career/screens/SC-012-onboarding/README.md) (de Mi carrera: saltable y retomable, US-170) y los mails de [Avisos](../../notices/README.md) (el aviso al cerrar el período y el reenganche anual).

## Lo que esta épica todavía no resuelve

- Cerrado (2026-08-24, [ADR-0078](../../../decisions/0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md)): las frases se ofrecen **por tema**, con los pares juntos y un presupuesto de 6 a 10 hechos por tema; el orden de los temas y qué colapsa por defecto es diseño del hi-fi (ficha de [Reseñar](screens/SC-015-write-review/README.md)).
- **Qué pasa con la reseña a medias** (US-161: se guarda y se retoma) y **cuánto tiempo**.
- **El evento institucional como pantalla propia o como rama de Reseñar**: el flujo lo dibuja como rama.
- **Qué ve el autor cuando su materia pendiente se fusiona con otra** que no era la que quiso decir: si puede objetar o solo enterarse (US-160, US-197).
- Cerrado (2026-08-24): el par se ofrece junto, el contrario está a la vista sin aviso aparte (US-164); y la destilada entra sola o en par según la regla 2 del [catálogo](../../phrases.md): US-199 no exige el par al aprobar.
- **Qué hace el chequeo previo con texto que identifica a un tercero alumno** (ni al autor ni a un docente): si cae en "habla de una persona fuera de su acto" o pasa de largo (US-158).
- **El copy exacto del aviso de la sospecha** (US-159): la tesis da las palabras; la ficha de la pantalla las fija.
- **Si una cursada sin cátedra recordada pierde las frases de cátedra o hace falta una «cátedra sin identificar»** (la G2 del registro del 16 quedó superada): hoy el boceto ofrece solo las de materia.
