# Reseñar (la pantalla)

> Ficha de pantalla, dueña: la épica [Reseñar](../../README.md). **Estado**: reescrita el 2026-08-26 al modelo de tres capas de [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (el boceto [sketch.html](sketch.html) ya venía reescrito desde el 2026-08-25 a los seis pasos, en la dirección Boletín, [ADR-0071](../../../../../decisions/0071-the-visual-language-is-a-bulletin.md); el anterior por temas quedó en git). Con cuenta: el gate está en la acción (Ingresar / Registro con el motivo a la vista y vuelta), no en la lectura. Slug hoy `/reviews/write` (existe el editor texto-libre de la versión anterior; el chasis se rehace).

## Quién la usa

**Lucía** (veinte horas de trabajo: dos minutos o no lo hace), **Matías** (llega desde una ficha que acaba de leer y quiere que quede registrado), **Diego** (dejó la carrera: reseña la materia por la que se fue y contesta cuándo se fue). El flujo entero, con sus ramas: [`flow.md`](../../flow.md).

## Qué stories resuelve

US-146 (menos de dos minutos, respondiendo frases), US-147 (una materia sola), US-148 (qué se publica y qué no), US-150 (la frase "¿Se dictaron las clases?", en frecuencia gruesa), US-151 y US-153 (quien dejó reseña igual y suma igual), US-152 (el año en que me fui, por el camino de "período viejo"), US-154 (cómo terminó), US-155 (cuándo entré, una vez), US-159 (el piso y el contrato antes de enviar), US-160 (la materia que no está), US-161 (retomar), US-162 (qué sumó, al terminar), US-163 (la recursada). Los mails que traen hasta acá viven en [Avisos](../../../../notices/README.md). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra

Un formulario de una sola página, sin navegación entre pasos ni barra de progreso: las secciones se muestran u ocultan según lo que ya elegiste, y "Paso N" es la etiqueta de cada una.

1. **¿Qué cursaste?** Buscar la materia entre las de tu plan, por nombre o código, y elegir una.
2. **¿Cuándo y con quién?** El período, entre los que ofrece tu universidad; la cátedra, opcional (chips de las cátedras de la materia, o "No me acuerdo"). Si la materia todavía no tiene cátedras cargadas, se dice: la reseña cuenta igual en la materia.
3. **¿Cómo terminó?** Un toque entre cuatro: la aprobé, me quedó regular, la recursé, la dejé (US-154); y cuántas veces la cursaste, contando esta (una, dos, tres o más). La pantalla dice que esto no se publica con la reseña: sirve para leer bien los números ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)).
4. **¿Qué hizo la cátedra?** Las siete frases de conducta observable del [catálogo](../../../../phrases.md): si contestaba las preguntas en clase, si se dictaron las clases, si el práctico daba lo mismo que el teórico, si respondía consultas fuera de clase, con cuánta anticipación avisó el parcial, si entregó el programa al inicio, si tomó temas fuera de programa. Cada frase es una pregunta con sus opciones en frecuencias gruesas, nunca un conteo fino; responder es opcional en cada una, y saltear no cuenta en ningún denominador (US-146). Si la cátedra quedó en "No me acuerdo" en el paso 2, este paso no aparece: no hay a quién atribuirle la conducta.
5. **¿Qué te pasó a vos?** Las cuatro frases de vivencia del catálogo: si salías de la clase entendiendo, si el material alcanzaba para el parcial, si pudiste seguir el ritmo, si podías preguntar sin quedar mal. Misma mecánica: opciones cerradas, todo opcional.
6. **Lo último.** Un campo libre, uno solo: "¿Algo que no te preguntamos y deberíamos?", hasta 2000 caracteres, con la aclaración de que no se publica y que lo lee el equipo para mejorar las preguntas ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)). Debajo, el contrato antes de enviar: tus respuestas se suman al total de la cátedra; nunca se muestra una reseña individual, ni cómo terminó nadie; nadie de la facultad accede a quién respondió. Un solo botón: **Enviar la reseña**.

**Al terminar**: queda registrada y suma voz a las frases que respondiste; Mis aportes muestra qué se movió con tu aporte (US-162). Salidas: la ficha de la cátedra, reseñar otra materia, Mis aportes.

## Estados

- **"Sin materias"** (paso 1): si el plan no tiene materias, o ninguna coincide con lo que buscás, se dice y no hay ninguna para elegir.
- **"Sin períodos"** (paso 2): si tu universidad no tiene períodos para ofrecer, no hay ninguno para elegir y el envío queda bloqueado.
- **"Sin cátedra"** (paso 2, si elige "No me acuerdo" o la materia no tiene cátedras cargadas): el paso 4 (qué hizo la cátedra) no se ofrece; las frases de vivencia del paso 5 y todo el contexto siguen contando igual.
- **"Sin frases de una capa"** (pasos 4 o 5): si el cuestionario vigente no trae frases de esa capa, el paso no se ofrece.

## Lo que no muestra nunca

El nombre, la cuenta ni el rol de quien reseña (US-148); ninguna reseña individual, ni cómo terminó una cursada en particular (ADR-0083); ningún puntaje ni escala, solo moda y distribución por frase ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)); ningún color de alarma sobre lo que estás por responder (la alarma es de la lectura, no de la recolección); ninguna pregunta que la cuenta ya contestó (US-169); ningún paso obligatorio que no sea elegir la materia, el período y cómo terminó (US-146: se publica respondiendo frases, sin escribir nada); el campo libre, jamás (ADR-0084).

## Adónde va

A la ficha de la cátedra o de la materia ([Ficha de cátedra](../../../choose-where-to-study/screens/SC-002-chair/README.md)) para ver lo que sumó; a Mis aportes ([Deshacer](../../../undo/README.md) la edita o la borra); a reseñar otra. Llega desde los mails de [Avisos](../../../../notices/README.md) y desde cualquier ficha (el gate en la acción).

## Decisiones que aplica

[ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (las tres capas, el contexto que no se publica, saltear siempre vale, el piso), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (moda y distribución, nunca puntaje), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre no se publica nunca), [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (solo la cursada se reseña acá), [ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) (la reseña es la única puerta de un hecho), D08 (la pendiente de vincular no cuenta hasta vincularse, [registro del 17](../../../../../history/reviews/2026-08-17-catalog-propagation.md)). Las cuatro garantías de [Que no me molesten](../../../../guarantees/README.md) se verifican acá: no pide cuenta para leer (no aplica: es producir), no repregunta, nada pide completar algo antes de dejar reseñar, no destaca nada.

## Decisiones que esta reescritura tomó

- **El testimonio publicado desaparece del todo**: no hay comentario por tema ni campo final que se publique; el único texto es el campo libre de "lo último", y nunca se publica ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)). El chequeo previo, el aviso de sospecha como paso aparte y la réplica que citaba un comentario dejan de aplicar acá (se explica en la story que quedó rebasada, US-158).
- **La rama del evento institucional se retira del paso 1**: [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) separa el instrumento administrativo (trámites, título, mesas) de la reseña de cursada, con disparador propio; esta pantalla ya no lo ofrece (US-157 queda rebasada).
- **La cátedra se pregunta en el paso 2, no antes de las frases**: ya no hay frases con sujeto mixto que decidir, así que la cátedra es un dato de contexto más, junto con el período y la modalidad.
- **"Cómo terminó" pierde la opción "sigo cursando"**: la reseña es sobre una cursada que ya terminó de alguna forma; las cuatro opciones vigentes son la aprobé, me quedó regular, la recursé, la dejé ([`phrases.md`](../../../../phrases.md)).

## Lo que esta ficha deja abierto

- **Cuánto tiempo se guarda lo que quedó a medias** (US-161).
- **Si una cursada sin cátedra recordada necesita ofrecerse igual como «cátedra sin identificar»**: hoy la oferta directamente quita el paso 4.
- **Si el selector de cátedra acepta texto libre** cuando la cátedra no está en la lista del catálogo.
- **El orden y el colapso por defecto de las frases de los pasos 4 y 5** si el catálogo de frases crece: el boceto las muestra todas abiertas.
