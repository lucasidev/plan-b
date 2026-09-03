# Reseñar

> Épica del grupo **O4 · Que quede registrado (sin que me cueste la cursada)** del [catálogo](../../README.md). **Estado**: reescrita el 2026-08-26 al modelo de tres capas ([ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md)): README con sus 18 stories, [flujo](flow.md) con los seis pasos del boceto vigente, y las tres pantallas propias ([Reseñar](screens/SC-015-write-review/README.md), [Mi situación](screens/SC-014-my-status/README.md), [Anonimato](screens/SC-013-anonymity/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

El acto principal del producto: elegir una materia que cursaste y responder las frases de esa cursada en menos de dos minutos, y si querés, dejar algo en tus palabras al final ([THESIS.md](../../../THESIS.md), decisión 4). Es la única puerta por la que un hecho entra al corpus ([ADR-0086](../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)): la reseña lleva el contexto que no se publica (el período, la cátedra si la recordás, cómo cursaste, cómo terminó y cuántas veces la cursaste), las frases de qué hizo la cátedra y qué te pasó a vos que respondas, y el campo libre del final, que tampoco se publica y alimenta a la curaduría ([ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md), [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)). Incluye las preguntas de trayectoria que aparecen de a una: cuándo entraste, la primera vez; y si el período que contás es viejo, si seguís cursando, te recibiste o te fuiste (Mi situación).

También es donde se resuelven las situaciones que el mapa agrupaba aparte como temas, porque pasan en el acto de reseñar: la materia que no está en el plan cargado se reseña igual y queda pendiente de vincular (US-160); la recursada es otra reseña, otro período (US-163); lo que quedó a medias se retoma (US-161); antes de enviar se dice el contrato completo de publicación, agregado y con el piso de 10 reseñas por cátedra (US-148, US-159); y al terminar, Mis aportes muestra qué sumó cada frase que respondiste (US-162).

## Para quién

**Lucía** (cursa, veinte horas de trabajo: dos minutos o no lo hace), **Matías** (quiere que quede registrado, no le importa el producto), **Diego** (dejó la carrera: puede reseñar una materia sola aunque ya no curse, y decir cuándo se fue).

## Stories

Las 18 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-146](stories/US-146-review-in-under-five-minutes/README.md) | Reseñar en menos de dos minutos |
| [US-147](stories/US-147-review-a-single-subject/README.md) | Reseñar una materia sola |
| [US-148](stories/US-148-publish-without-revealing-the-author/README.md) | Que nadie sepa que fui yo |
| [US-149](stories/US-149-notify-when-the-period-closes/README.md) | Avisar cuando cierra el período |
| [US-150](stories/US-150-declare-classes-not-given/README.md) | Declarar que faltaron clases (rebasado: ver nota en la story) |
| [US-151](stories/US-151-review-after-leaving-the-degree/README.md) | Reseñar por qué me fui |
| [US-152](stories/US-152-declare-the-departure-year/README.md) | Decir en qué año me fui |
| [US-153](stories/US-153-not-treated-as-a-failure/README.md) | No ser tratado como un fracaso |
| [US-154](stories/US-154-declare-the-outcome-in-one-tap/README.md) | Decir cómo terminó la cursada |
| [US-155](stories/US-155-ask-entry-year-once/README.md) | Preguntar el año de ingreso una vez |
| [US-156](stories/US-156-asked-by-mail-about-graduation/README.md) | Preguntar por mail si me recibí |
| [US-157](stories/US-157-review-an-institutional-event/README.md) | Reseñar un evento institucional (rebasado: ver nota en la story) |
| [US-158](stories/US-158-warn-if-a-comment-identifies-me/README.md) | Avisar si el comentario me delata (rebasado: ver nota en la story) |
| [US-159](stories/US-159-no-data-crossing-identifies-me/README.md) | Que ningún cruce me identifique |
| [US-160](stories/US-160-review-a-subject-not-in-plan/README.md) | Reseñar una materia fuera del plan |
| [US-161](stories/US-161-resume-a-draft-review/README.md) | Retomar una reseña a medias |
| [US-162](stories/US-162-see-the-impact-of-my-review/README.md) | Ver qué cambió con mi aporte |
| [US-163](stories/US-163-review-the-same-subject-twice/README.md) | Reseñar la misma materia dos veces |

Las stories que citan "tema del mapa" en su nota vienen de los grupos transversales del mapa (T2 · Cuando el riesgo es real; T3 · Cuando el catálogo no alcanza): son temas, no actividades, y cada una vive en la única épica que la implementa. El índice del [catálogo](../../README.md) conserva el tema como lista.

**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (las tres capas del cuestionario: contexto que no se publica, conducta observable de la cátedra, vivencia; saltear siempre vale; el piso de 10; el catálogo versionado), [ADR-0083](../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (lo que esta reseña alimenta: moda y distribución por frase, nunca puntaje), [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre del final: no se publica nunca, alimenta la curaduría), [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md) (solo la cursada se reseña acá; el instrumento administrativo y el relevamiento oficial son otros instrumentos, fuera de esta épica), [ADR-0086](../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) (la reseña es la única puerta de un hecho: el producto no hace seguimiento de carrera por ningún otro lado). El catálogo de frases que se ofrece: [`phrases.md`](../../phrases.md).

## Pantallas

Las tres que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Reseñar**](screens/SC-015-write-review/README.md) (con cuenta): los seis pasos, sus estados y las salidas; [boceto hi-fi](screens/SC-015-write-review/sketch.html) de todos los pasos, ya reescrito al modelo de tres capas.
- [**Mi situación**](screens/SC-014-my-status/README.md) (con cuenta): la pregunta de trayectoria, sola; [boceto mid-fi](screens/SC-014-my-status/sketch.html). También aparece embebida en el paso 2 de Reseñar cuando el período es viejo.
- [**Anonimato**](screens/SC-013-anonymity/README.md) (pública): qué se publica de una reseña y qué no, el campo libre y la curaduría, y el piso de 10; [boceto mid-fi](screens/SC-013-anonymity/sketch.html), todavía pendiente de reescribirse al modelo de tres capas.

Las que comparte con otras épicas: [**Ingresar**](../enter/screens/SC-025-sign-in/README.md) y [**Registro**](../enter/screens/SC-026-sign-up/README.md) (el umbral: el gate está en la acción, con el motivo a la vista y vuelta a donde ibas), [**Mis aportes**](../undo/screens/SC-018-my-contributions/README.md) (qué sumó cada frase; lo pendiente de vincular; retomar lo a medias), la [Ficha de cátedra](../choose-where-to-study/screens/SC-002-chair/README.md) y la [Ficha de materia](../choose-where-to-study/screens/SC-007-subject/README.md) (de donde llega y adonde vuelve). Y las que son de otra épica y esta recorre: los mails de [Avisos](../../notices/README.md) (el aviso al cerrar el período y el reenganche anual).

## Lo que esta épica todavía no resuelve

- **Qué pasa con la reseña a medias** (US-161: se guarda y se retoma) y **cuánto tiempo**.
- **Dónde vive el instrumento administrativo** (trámites, título, mesas, infraestructura): [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md) lo define como un instrumento aparte, con disparador propio (el perfil o el evento puntual); todavía no tiene épica ni pantalla asignada, y US-157 quedó sin dónde resolverse dentro de este set de stories.
- **Si una cursada sin cátedra recordada pierde las frases de cátedra o hace falta una «cátedra sin identificar»**: hoy el boceto ofrece "No sé" y quita esas frases.
- **Si la cátedra que no está en la lista del paso 2 se puede escribir a mano**, como la materia del paso 1, o si el selector queda cerrado al catálogo.
- **Qué hace la curaduría con un campo libre que identifica a un tercero** (un alumno, no un docente): sigue sin publicarse nunca, pero si necesita algún tratamiento especial antes de destilarse en frase es decisión del equipo de curaduría, no de esta épica.
- **El orden y el colapso por defecto de las frases de los pasos 4 y 5** si el catálogo crece: el boceto de R1 las muestra todas abiertas.
