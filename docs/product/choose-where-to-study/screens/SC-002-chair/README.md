# Ficha de cátedra (la pantalla)

> Ficha de pantalla ([formato](README.md)). **Estado**: revisada el 2026-08-19 ([registro](../../../../history/reviews/2026-08-19-epics-and-screens.md)); el boceto es [`sketch.html`](sketch.html), **hi-fi en la dirección Boletín** ([ADR-0071](../../../../decisions/0071-the-visual-language-is-a-bulletin.md), aprobado el 2026-08-19; el mid-fi quedó en git). Pantalla pública, se lee sin cuenta. Slug propuesto: `/chairs/[id]` (hoy el chasis es `/teachers/[id]`, la ficha del docente; la cátedra como entidad es US-196). Épicas que la componen: [Elegir dónde estudiar](../../README.md) (la lectura, los testimonios, de cuándo son), [Reseñar](../../../write-a-review/README.md) (llega desde acá y vuelve), [Cuidar lo publicado](../../../care-for-what-is-published/README.md) (votar, corregir), [Deshacer](../../../undo/README.md) (reportar) y [Replicar](../../../reply/README.md) (la réplica al lado, el estado del canal).

## Quién la usa

- **Valentina** (elige): baja desde la Ficha de carrera para ver quién da la materia y si lo duro es la materia o la cátedra.
- **Lucía** (cursa): compara las cátedras de la misma materia antes de anotarse; después vuelve para reseñar.
- **Matías** (ya aportó): entra a ver que lo suyo quedó, y qué se movió.
- **Claudia** (docente): la lee antes de responder; **Paredes** la lee y no responde.
- **Rocío** (investiga): la cita; baja a Método desde acá.
- **Nadie con cuenta obligatoria**: leer y reportar no piden cuenta; votar, reseñar y responder sí.

## Qué stories resuelve

US-129 (cabecera: dos proporciones con el mismo denominador), US-131 (cada proporción con voces, período y encogimiento), US-132 (buscar el nombre de un docente lleva acá), US-150 (clases sin dar: mediana y rango con voces), US-172 (la réplica al lado, con nombre y rol, sin bajar nada), US-173 (los dos ejes sin mezclar; exigencia alta como información), US-176 (estado del canal: "sin réplica", "docente sin identidad verificada"), US-177 (la serie por período, con publicación y réplica marcadas), US-186 (texto retirado visible con su categoría), US-187 (se reprocesa; fecha de lectura; destilada marcada), US-188 (los votos ordenan los testimonios), US-135 (el testimonio debajo de las frases), US-179 (la réplica no cita lo marcado), US-137 (período de lo que la sostiene; aviso cuando lo último es viejo), US-138 (por qué una frase pesa distinto en la carrera), US-164 (los dos sentidos de cada aspecto, cada uno con su proporción), US-167 (reportar sin cuenta), US-139 (cargada sin voces: nunca un cero), US-136 (la cabecera sin voces dice que arranca vacía y que la primera voz ya se publica, nunca un cero), US-196 (la cátedra existe como entidad propia: sin eso esta ficha no tiene de qué sostenerse).

## Qué muestra

La ficha de una **cátedra**: el equipo docente a cargo de una materia en una institución, con su titular, a lo largo de los períodos. Es la pantalla que más decisiones concentra: la cabecera con las dos proporciones ([ADR-0065](../../../../decisions/0065-attribution-is-the-axis-not-a-split.md)), las listas de frases con voces y encogimiento por eje ([ADR-0064](../../../../decisions/0064-phrases-with-voices-not-scores.md)), la serie por período y las clases sin dar ([ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md), D02), los testimonios con la réplica al lado y el texto retirado visible ([ADR-0068](../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)), y el estado del canal del docente (D06). Es la ficha de una cursada agregada: sus voces son las personas que reseñaron o votaron cursadas de esta cátedra, sin deduplicar entre períodos ([ADR-0066](../../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)).

De arriba abajo:

1. **Cabecera de identidad**: la materia, la cátedra (nombre del titular y equipo si lo hay), la institución y la carrera con links a sus fichas; y la línea de sustento: "N voces, de <período> a <período>" con el aviso de US-137 si lo último es de hace más de dos años.
2. **Las dos proporciones**, una por eje, con el mismo denominador: "X de cada 10 dicen que es dura" (exigencia, neutro: información) y "Y de cada 10 marcaron alguien fallando" (gestión, con el color de alarma), cada una con sus voces y su encogimiento visible ("encogido de 74% a 68%: pocas voces"). Nunca un puntaje.
3. **Por eje, la lista de frases con su proporción de voces**, ordenadas por proporción, cada una con "X% · N voces" y, si es destilada, la marca "síntesis". Los dos sentidos del mismo aspecto se ven juntos (US-164). Cuando la cátedra da varias materias, la lista es de esta cátedra en esta materia; el sujeto de cada frase (materia, cátedra, institución) se ve en la fila.
4. **Clases sin dar**: mediana y rango de lo declarado, por período, con voces ("4, entre 2 y 8 · 12 voces · 2024-C1"). Solo si alguien lo declaró.
5. **La serie**: cada proporción publicada por período de cursada (no por cuándo se reseñó), como barras por período con sus voces; con las marcas "publicado" y "réplica" en la línea de tiempo. Sin suavizar. Por defecto muestra la cabecera de gestión; se puede elegir una frase.
6. **Testimonios**: ordenados por votos; cada uno con período, cátedra, "anónimo", el comentario entre comillas, las frases que marcó, "A mí también me pasó · N" (pide cuenta) y "Reportar" (sin cuenta); la réplica adentro del bloque, con nombre, rol, "identidad verificada", fecha y la línea "no baja el testimonio ni mueve conteos". Un texto retirado se ve como retirado, con su categoría y sus frases todavía ahí.
7. **La réplica de la cátedra** (si el docente responde a la ficha y no a un testimonio) y el **estado del canal** cuando no hay: "sin réplica"; "docente sin identidad verificada" cuando nunca se le pudo avisar. Nunca "no quiso responder".
8. **Pie**: "cómo se calcula" (a Método), "esta lista se reprocesa; leída el <fecha>", "descargar" (a Método, el CSV), "las otras cátedras de esta materia" (a la Ficha de materia), y el llamado a reseñar (a Reseñar, con cuenta).
9. **Acciones**: reseñar esta materia (cuenta), "a mí también me pasó" (cuenta), reportar (sin cuenta, mail confirmado por link), responder (docente o institución con identidad verificada), corregir un dato de la cátedra (cuenta), copiar el link con la fecha de lectura.

## Estados

- **Cargada, sin voces**: la cabecera dice que arranca vacía y que la primera voz ya se publica; nunca un cero (US-136, US-139).
- **Pocas voces**: todo se publica igual, con el encogimiento a la vista; no hay escalera ni piso.
- **Sin testimonios pero con voces**: la sección de testimonios explica que las voces marcaron frases sin escribir.
- **Texto retirado**: se ve como retirado, con la categoría, y sus frases siguen contando.
- **Sin réplica / sin identidad verificada**: el estado del canal, con esas palabras.
- **Lo último es viejo**: aviso de US-137 arriba, y la serie lo muestra sola.

## Lo que no muestra nunca

Por completar: esta ficha no reúne todavía una lista aparte de lo que nunca publica. Se puede derivar de los ADR ya citados en "Decisiones que aplica" (sin puntaje, sin piso ni escalera, la réplica nunca cita lo marcado, nunca "no quiso responder" como estado del canal) y de la línea ya escrita en el punto 7 de "Qué muestra", pero falta escribirla como sección propia.

## Adónde va

Llega desde: Ficha de materia (las cátedras de la materia), Buscar (el nombre de un docente lleva a su cátedra), Ficha de carrera, Avisos (al docente), Mis aportes. Va a: Método, Ficha de materia, Ficha de carrera, Ficha de institución (las frases con ese sujeto), Reseñar, Responder.

## Decisiones que aplica

Por completar: los ADR-0064 (frases con voces, sin puntaje), ADR-0065 (cabecera de dos proporciones con el mismo denominador), ADR-0066 (voces agregadas de las cursadas de la cátedra, sin deduplicar entre períodos), ADR-0067 (serie por período de cursada, clases sin dar) y ADR-0068 (réplica al lado del testimonio, texto retirado visible) aparecen citados a lo largo de esta ficha, pero todavía no están reunidos acá con la línea de qué impone cada uno.

## Lo que esta ficha deja abierto

- **Disposición**: (A, la del boceto) cabecera con las dos proporciones arriba, los dos ejes en dos columnas debajo, la serie y las clases sin dar en el medio, los testimonios al final: lo que se cita primero, la voz humana después. (B) los dos ejes como pestañas, para leer una lista más larga por vez: esconde un eje detrás de un click, contra "nunca mezclados, siempre juntos". (C) los testimonios arriba de las listas: la voz humana primero, el hecho después: contradice 0064 (la ficha muestra frases con voces, no textos, como cuerpo).
- **El color de alarma** solo en gestión: la cabecera de gestión y sus frases negativas van en terracota suave; exigencia va neutra, porque es información. Es la lectura de los ejes hecha color; el riesgo es que se lea como semáforo, y por eso no hay verde.
- **Lo que necesita del sistema para existir**: la cátedra como entidad (US-196); las voces por frase, eje y período de las cursadas de la cátedra; las dos proporciones y el encogimiento (0064, 0065); los testimonios con sus votos, réplicas y retiros (0068); las clases sin dar agregadas (D02); la fecha del último reproceso.
