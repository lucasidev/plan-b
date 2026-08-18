# ADR-0068: The comment publishes as a testimony below the phrases, checked before and moderated for exposure, with the reply beside it

- **Estado**: aceptado
- **Fecha**: 2026-08-16

## Contexto

La reseña lleva un **comentario** opcional: lo que la persona escribe en sus palabras porque ninguna frase lo cubre ([THESIS.md](../THESIS.md), "Qué recabamos"). [ADR-0064](0064-phrases-with-voices-not-scores.md) decidió que la ficha muestra frases con voces, no textos, como cuerpo, y que el comentario no entra a ningún número; dejó abierto qué se hace con el comentario individual al publicar.

La tesis ya lo daba por publicado ("revisamos que el TEXTO no te reconstruya, y limitamos qué puede citar la réplica"; "cada testimonio que se baja de más es uno que no se vuelve a escribir"), y once stories también: T1-1 (el voto ordena los testimonios), T2-1 (avisar si lo que escribí me delata; decido yo), T2-2 (la réplica no cita la parte que identifica; me entero antes), T3-2 (de cuándo son), O7-1 (la respuesta queda al lado, sin bajarlo), O8-6 (cuántos se bajaron y por qué), BO2-1, BO2-2, BO2-4, O5-4 (reportar sin cuenta), T4-1 (aportar lo contrario).

La [revisión adversarial del catálogo](../reviews/2026-08-16-catalog.md) recomendó lo contrario (grupo B): no publicarlo, porque con texto público alguien elige la cátedra de quien lo bochó, marca frases suaves y en el comentario escribe una acusación falsa sobre la vida privada del docente, y la única defensa sería reactiva. Y dejó tres cabos sobre la réplica (C2: "se entera antes" sin plazo ni palanca; C3: la réplica no cita pero describe) y sobre la moderación (D1: de quién es la exposición que cuenta; D2: qué pasa con lo reportado mientras espera; D3: reporte sin cuenta que no se puede agrupar).

Términos: **testimonio** es la reseña tal como se lee (su comentario, las frases que marcó, el período y la cátedra si la dio; sin cuenta, sin nombre, sin "cómo terminó"); sin comentario, la reseña no aparece como testimonio, es voz en los conteos. **Exposición**, la que se modera, es la de una persona fuera de su acto público: el docente nombrado en su rol no está expuesto, está evaluado.

## Decisión

1. **El comentario se publica, como testimonio, en la ficha del sujeto** (cátedra, materia, institución), debajo de las frases con voces, nunca como cuerpo. Con tope de un párrafo. No publicarlo contradice la tesis y las stories, y le saca al instrumento la única parte humana: Matías quiere que quede, Rocío lee, Diego explica por qué se fue.

2. **Antes de publicar corre un chequeo con dos salidas.** Si el texto puede identificar al autor por contexto ("los tres que cursamos con Pérez a la noche"), se le marca esa parte y **decide él**, sabiendo la consecuencia: si la deja, la réplica no va a poder citarla. Si el texto habla de una persona fuera de su acto (vida privada, salud, familia, aspecto, sexualidad, datos de contacto), **queda retenido hasta que un humano lo mire**, y se le dice. Todo lo demás se publica al instante. "El titular me acosó" es un acto hacia alumnos y sale; "el titular es alcohólico" es la persona y se retiene. Es la única inteligencia que toca la publicación, y siempre con la persona o el equipo decidiendo, nunca sola.

3. **Se modera lo que expone a una persona; la exposición protegida es la del que aportó y la de terceros, no la del docente ni la de la institución nombrados.** La queja dura contra la cátedra o la institución no es causal. Lo reportado **sigue publicado hasta que un humano resuelva**; ninguna cantidad de reportes lo baja sola; existe un único caso "riesgo inmediato", con criterio escrito, que despublica antes de resolver. Reportar no pide cuenta, pero confirma el mail por link antes de entrar a la cola; dos reportes del mismo mail cuentan uno, y ese mail es por donde se responde el criterio aplicado.

4. **Se baja el texto, nunca la voz.** Si un comentario se retira, las frases marcadas de esa reseña siguen contando, y la ficha muestra que ahí hubo un texto retirado y por qué categoría. O8-6 publica cuántos textos se bajaron y en qué categoría, sin su contenido.

5. **La réplica juega con las mismas reglas.** Pasa el mismo chequeo de identificación por contexto que el aporte; no puede citar lo que el autor dejó marcado como identificante; queda **retenida un plazo desde el aviso** para que quien aportó edite, borre o pida revisión (si borra, la réplica no se publica); solo la publica identidad docente o institucional verificada. Queda al lado del testimonio, con nombre y rol: no lo baja ni mueve conteos.

6. **Orden por votos**, como dice T1-1: "a mí también me pasó" suma voz a las frases de esa reseña y ordena los testimonios; cada uno muestra su período, y la ficha avisa cuando lo último es viejo (T3-2). Sin destacados nuestros. Votar pide cuenta; leer y reportar, no.

7. **El comentario alimenta la destilación siempre**, se publique o no, se retire o no: la frase destilada es dato derivado, no cita.

8. **No va al CSV ni se exporta en bloque.** El crudo son agregados; el texto se lee uno por uno en la ficha. Texto en masa es lo que habilita reidentificar por estilo de escritura, y no hace falta para citar nada.

### Cómo se ve

Dos pantallas, mostradas y aprobadas antes de escribir esto (el boceto está en [`docs/design/screens/testimonio.html`](../design/screens/testimonio.html), orientativo como todo boceto). En la ficha: la cabecera con las dos proporciones y las listas de frases arriba; abajo la sección "Testimonios" con su cantidad y el criterio de orden; cada testimonio con período, cátedra y "anónimo", el comentario entre comillas, la fila "Marcó" con las frases (las de gestión con el color de alarma, las de exigencia neutras), el botón "A mí también me pasó" con su cuenta y "Reportar", y la réplica adentro del mismo bloque con nombre, rol, "identidad verificada", fecha y la línea que dice lo que no hace. Un texto retirado se ve como retirado, con el motivo en una línea y sus frases todavía ahí. Al escribir: el campo es el último paso, opcional, con tope y con la advertencia "se lee, no suma a los conteos"; el chequeo resalta la parte que identifica y ofrece dejarla o sacarla, diciendo la consecuencia; el aviso de la sospecha en grupo chico va antes de publicar, con las palabras de la tesis; y hay dos salidas, publicar la reseña o publicarla sin comentario.

## Alternativas consideradas

**A. No publicar el comentario**, usarlo solo para destilar (la recomendación de la revisión). Elimina el riesgo B2 de raíz y con él la parte humana del instrumento; contradice la tesis y once stories; y el riesgo se ataca igual con el chequeo previo y el criterio de exposición. Descartada.

**B. Publicar sin chequeo previo, solo con reporte.** Es la defensa reactiva que la revisión llamó insuficiente: la acusación sobre la vida privada se publica y alguien tiene que verla y reportarla. Descartada.

**C. Pre-moderación humana de todo comentario.** Convierte la cola de Nahuel en el cuello del corpus y demora la publicación días. El chequeo automático con retención solo de lo que habla de la persona es proporcional. Descartada.

**D. Auto-ocultar por cantidad de reportes** (lo de [ADR-0010](0010-threshold-auto-hide-configurable-por-env-var.md), en retiro). Es un botón de censura para el que organiza doce reportes. Descartada: nada baja solo, salvo el caso escrito de riesgo inmediato.

**E. Ordenar por período, el más reciente primero.** Conserva la serie a la vista pero entierra lo que más gente confirmó, que es lo que "confirmar es más barato que elegir" quiere arriba. Descartada; el período se ve en cada testimonio y la ficha avisa si lo último es viejo.

**F. Una salida "no publiques mi comentario, usalo solo para las frases".** Le da salida al que tiene miedo y no le quita nada a los testimonios (esa persona no iba a escribir público). Cuesta un concepto más y una casilla. **No descartada: diferida**; se agrega después sin romper nada.

**G. El comentario literal como cuerpo de la ficha.** Ya rechazada en 0064: cuarenta anécdotas no son un hecho.

## Consecuencias

- **T2-1 y T2-2 ganan lo que les faltaba**: la retención de lo que habla de una persona, el plazo y la palanca antes de que salga la réplica, y la prohibición de citar lo marcado. **BO2-1** carga el criterio de exposición. **O5-4** confirma el mail. **O4-1** sigue: se publica marcando frases, sin escribir nada obligatorio.
- **[ADR-0010](0010-threshold-auto-hide-configurable-por-env-var.md) queda superado**: en el producto nuevo ninguna cantidad de reportes baja nada sola.
- **El chequeo previo es trabajo del sistema de frases**: la misma capacidad que destila comentarios clasifica "identifica por contexto" y "habla de la persona fuera de su acto". Es la única inteligencia con efecto en lo publicado, y nunca decide sola.
- **La cola de moderación necesita su story de desborde** (BO4-6) y **verificación y moderación son roles excluyentes** (BO3-3, decidido en la propagación al catálogo): no son de esta decisión, y esta decisión las vuelve más urgentes porque ahora hay texto que moderar.
- **La ficha muestra huecos honestos**: un texto retirado se ve como retirado. Es lo que hace creíble a O8-6.
- **La destilación gana corpus** aunque el comentario se retire o se borre después.

## Precedente

RateMyProfessors publica comentarios anónimos sobre docentes nombrados y remueve lo que habla de familia, vida personal, sexualidad o aspecto: el foco es el curso y la enseñanza ([Guidelines](https://www.ratemyprofessors.com/guidelines)). Glassdoor permite nombrar a quien tiene un rol público "mientras el contenido describa su conducta en el trabajo", publica la respuesta del empleador al lado de la reseña, le prohíbe nombrar a quien cree que la escribió, y no permite pagar para bajar una reseña ([nombres en reseñas](https://help.glassdoor.com/s/article/Does-Glassdoor-allow-names-in-reviews?language=en_US); [respuesta del empleador](https://help.glassdoor.com/s/article/Adding-an-employer-response?language=en_US)). Es la línea de esta decisión: la persona en su acto público, sí; la persona, no; y la réplica al lado, nunca encima.

## Refs

- [THESIS.md](../THESIS.md), "Qué recabamos", "Qué publicamos" y "Posición". [ADR-0064](0064-phrases-with-voices-not-scores.md) (la ficha muestra frases con voces, no textos, como cuerpo; el comentario alimenta la destilación); **completa** a 0064 y cierra "qué publicamos". [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (sin piso: la sospecha en grupo chico se declara). [ADR-0009](0009-anonimato-como-regla-de-presentacion.md) (el anonimato como regla de presentación).
- Grupos B, C y D de la [revisión adversarial del catálogo](../reviews/2026-08-16-catalog.md).
- Boceto: [`docs/design/screens/testimonio.html`](../design/screens/testimonio.html).
