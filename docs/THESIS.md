# La tesis de plan-b

**Vigente desde**: 2026-08-16. **Registro del viraje**: [ADR-0063](decisions/0063-the-product-is-a-pressure-instrument.md). **Estado de la poda**: [STATUS.md](STATUS.md).

Este documento es la tesis del producto: lo que plan-b es, lo que no hace, y la posición que toma. Todo lo demás del repo se lee contra esto. El código de hoy contiene la versión anterior (el planificador) en retiro; que un módulo exista no significa que la tesis lo respalde.

> **Estado (2026-08-16)**: la tesis se cerró por capas, en orden: qué es, el problema, a quién sirve, [qué recabamos](#qué-recabamos) y [qué publicamos](#qué-publicamos) entero. Cada capa tiene su ADR con el porqué, las alternativas y las fuentes: la unidad de publicación ([ADR-0064](decisions/0064-phrases-with-voices-not-scores.md)), la atribución ([ADR-0065](decisions/0065-attribution-is-the-axis-not-a-split.md)), la derivación y sus cortes ([ADR-0066](decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)), la trayectoria y las comparaciones ([ADR-0067](decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)) y el comentario ([ADR-0068](decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)). Lo que sigue es propagarla al catálogo de stories y planificar contra ella.

---

## Qué es

Un instrumento de presión construido con lo único que los alumnos tienen y la institución no controla: lo que saben porque lo vivieron.

No es un buscador de carreras, ni un ranking, ni una app de gestión académica. Es el lugar donde lo que hoy es un reclamo aislado y desmentible se vuelve un dato que aguanta una discusión.

## El problema

Los alumnos sostienen la universidad y no tienen forma de incidir en ella. La institución decide, evalúa, demora y define; el alumno acepta. Esa es la asimetría, y es de **poder**, no de información.

La información es su arista más accionable porque es la única pieza que ya está en manos de los alumnos. Pero vive en grupos de WhatsApp y en pasillos. Un alumno diciendo "no dieron las clases" es una anécdota. Cuarenta diciéndolo es un hecho. El único obstáculo entre esas dos cosas es que están dispersos y en silencio.

Contexto argentino: la universidad, y sobre todo la pública, está endiosada. Es transversal la lucha por protegerla, y es casi inaudito auditarla o cuestionarla. Eso lo sufren los estudiantes, no los políticos. plan-b no está en contra de la universidad: está del lado del que la cursa.

## Las cinco decisiones que gobiernan todo

### 1 · Dos ejes, nunca mezclados

**Exigencia** (cuán dura es) y **gestión** (cuán bien la llevan). Una carrera exigente no es una carrera mal llevada, y confundirlas es exactamente lo que protege al que la lleva mal. Exigencia alta NO es un defecto: es información. Gestión baja SÍ es alarma: es alguien fallando.

No son dos números: son dos familias de hechos. Lo que se publica por eje es la lista de frases que lo componen, cada una con la proporción de voces que la sostiene ("hay clases que no se dan: 37% de 120 personas"). Un puntaje de gestión promediaría nueve fallas distintas y escondería ocho; la lista dice cuál. El encogimiento por pocas voces tiene nombre y fórmula publicada (el límite inferior de Wilson): cuatro marcas de cuatro no producen un 100%. Por qué así y no un 1 a 5, con las alternativas y las fuentes: [ADR-0064](decisions/0064-phrases-with-voices-not-scores.md).

### 2 · Atribución: la decide el eje

La pregunta de quien elige es si lo que la hace difícil es la carrera o la facultad, porque una cosa la elige y la otra la sufre. La respuesta la da el eje de cada frase, y nada más: lo de **exigencia** es la carrera siendo dura, venga de la materia, de la cátedra o de quien sea (información, no defecto); lo de **gestión** es alguien fallando (alarma). El **sujeto** de la frase (materia, cátedra, institución, centro, la lista es abierta) no atribuye: dice a qué ficha va y, cuando es cátedra o institución, quién. La atribución no se declara ni se pregunta: está en el catálogo de frases, en la redacción y el eje de cada una, publicado entero en el método.

Se publica pegada a la ficha, no en otra caja, y como dos proporciones con el mismo denominador (de personas en la ficha de una cursada; de voces, una persona por cursada, en las derivadas): "5 de cada 10 que reseñaron dicen que es dura; 7 de cada 10 marcaron alguien fallando". Nunca como un split del tipo "el 65% de lo difícil es la institución": ese número depende de cuántas frases ofrecemos por eje, no de lo que la gente dijo, y esconde que una materia puede ser dura y estar mal llevada a la vez. Por qué así, con las alternativas: [ADR-0065](decisions/0065-attribution-is-the-axis-not-a-split.md).

### 3 · Leer no pide cuenta, producir sí

El gate está en la acción (reseñar, votar, corregir), no en la puerta. Publicamos sobre instituciones que no nos delegaron nada: esconderlo detrás de un login sería no publicarlo. Y si el muro está antes del valor, no hay corpus.

### 4 · La unidad es la cursada, no el período

Nadie llega con ganas de inventariar su cuatrimestre: llega con una materia en la cabeza, la que lo destrozó o la que le cambió la carrera. Se reseña **esa cursada**: lo que viviste cursándola, que es la materia, la cátedra que la dio y la gestión que la rodeó, en un solo acto. Se marcan frases y, si querés, escribís en tus palabras. Confirmar es más barato que elegir; el que no quiere escribir vota la reseña de otro. Cinco minutos o no lo hace nunca. Un acto produce muchos datos; no muchas preguntas producen uno.

Las frases no son solo nuestras. Las nuestras son el punto de partida; de lo que muchos escriben se destilan las que faltaban, y esas se suman a las que se ofrecen. Si las frases las inventáramos solo nosotros, el producto respondería "¿qué falla?" únicamente con las fallas que se nos ocurrieron.

Lo mismo vale para los hechos: cuánto tarda la gente de verdad, dónde se cae la mayoría, qué se llevó junto y cuántos dejaron una. Eso no sale de frases, sale de trayectoria, y la trayectoria se pregunta **de a un hecho, en el momento en que aparece** (cuándo cursaste esto y cómo terminó, cuándo entraste, si te fuiste cuándo, si te recibiste cuándo), nunca como inventario. Con esos hechos sueltos, cruzados por cuenta, se reconstruye lo que ningún checklist consigue que alguien complete.

### 5 · El catálogo es nuestro

Planes, materias y correlativas los carga el equipo, completos. Una ficha a medias miente más que una que no existe. Lo que se crowdsourcea es la valoración, nunca el dato base. Si una carrera no está, se pide y la cargamos: el hueco es nuestro y se dice.

## Qué recabamos

Cerrado el 2026-08-16. Es la lista de datos que el producto pide, sin nada de cómo se muestran: eso se decide después, y aparte.

1. **La reseña de una cursada.** El acto principal: elegís una materia que cursaste. Lleva la materia y el período en que la cursaste; **cómo terminó** (la aprobaste, te quedó regular, la desaprobaste, la dejaste, seguís); la cátedra, si la recordás; las **frases que marcás** de las que se ofrecen (las nuestras y las ya destiladas para esa materia); el **comentario** en tus palabras, opcional; y si hubo clases que no se dieron, cuántas (una pregunta que aparece solo si marcaste que sí). Cada frase habla de algo (su **sujeto**: la materia, la cátedra, la institución, el centro de estudiantes; la lista no es cerrada, es "de qué habla") y de un aspecto (su **eje**: exigencia o gestión). Todo lo que hace a la cursada entra acá: cómo se dicta, cómo se evalúa, el techo de nota, rendir libre, el trato, y también el acoso, como cualquier otra frase.
2. **El evento institucional.** Lo que pasa fuera de una cursada y también hay que contar: trámites y título (cuánto tardó, si salió), equivalencias, vacantes que no conseguiste, el sistema que no cargó o se cayó, mesas que no hubo o regularidades que vencieron esperando, el trato de administrativos y del centro de estudiantes. Se pregunta de a un evento, cuando aparece, sin materia. Lleva frases, comentario y votos igual que la reseña: es el mismo mecanismo con el sujeto fijo, no otro producto.
3. **Los votos.** "A mí también me pasó", sobre una reseña o un evento que otro escribió, sin escribir. Es lo que convierte una reseña en muchas voces. Se vota la reseña entera, no una frase suelta.
4. **Los hechos de trayectoria.** De a uno, cuando aparecen, nunca como inventario: cuándo entraste (una vez, la primera vez que reseñás), cuándo cursaste cada materia y cómo terminó (vienen con la reseña), si te fuiste cuándo, si te recibiste cuándo (una pregunta, cuando el período que contás es viejo, o por mail una vez al año). El silencio no se infiere: quien no dijo es "no dijo".
5. **La constancia**, opcional: la prueba de condición de alumno. Verificarse pesa, no habilita.
6. **Lo destilado.** De los comentarios de muchos, con inteligencia, salen frases nuevas que se suman a las que se ofrecen para marcar. Es un dato derivado, no pedido, y está acá porque alimenta el punto 1.

Nada más se reseña. Ni la carrera, ni la universidad, ni la gestión como acto aparte: la carrera y la institución se derivan de sus cursadas y sus eventos; cómo, es parte de "qué publicamos".

## Qué publicamos

Cerrado entero. La base es [ADR-0064](decisions/0064-phrases-with-voices-not-scores.md); sobre ella, 0065 a 0068. Cada punto lleva el ADR con el porqué, las alternativas rechazadas y las fuentes.

**Cerrado:**

1. **La unidad de publicación es la frase con su proporción de voces**, separada por eje. Cada frase es su propio hecho, con su propio n; no se promedia con ninguna otra. La única cantidad que no es una frase, cuántas clases no se dieron, se publica como mediana y rango con sus voces, por período, sin piso.
2. **No hay número global 1 a 5.** Ni por eje ni total. Lo que la ficha muestra por eje es la lista de sus frases con voces; arriba, para leer en dos segundos, una proporción de voces (personas, en la ficha de una cursada) y no un promedio de frases: "7 de cada 10 que reseñaron marcaron algún problema de gestión".
3. **El encogimiento** por pocas voces es el límite inferior del intervalo de Wilson, aplicado a cada proporción por separado, y está publicado en el método. Con pocas voces la proporción sale baja y sube sola con el corpus: es lo correcto, no un defecto.
4. **Todo dato viaja con sus voces y con el período** de lo que lo sostiene. Es lo que separa un hecho de una anécdota.
5. **La lista se reprocesa** a medida que entran reseñas, y se dice. **La frase destilada no es cita**: es síntesis, y se declara.
6. **La atribución la decide el eje** ([ADR-0065](decisions/0065-attribution-is-the-axis-not-a-split.md)): exigencia es la carrera siendo dura, gestión es alguien fallando, venga del sujeto que venga. Se publica como dos proporciones de voces con el mismo denominador, en la cabecera; nunca como un split de marcas. El catálogo de frases con su sujeto y su eje se publica entero en el método.
7. **Lo que no se reseña se deriva sumando voces** ([ADR-0066](decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)). Arriba de la cursada la voz es una persona hablando de una cursada, y se suma: quien reseñó tres cursadas de una carrera son tres voces en ella. La materia en todos sus períodos y la cátedra suman sus cursadas; la carrera en una institución suma todo lo marcado en las cursadas de su plan; la institución son tres cosas que nunca se mezclan en un número: lo que se dice de ella como sujeto (trámites, título, trato), sus cursadas, y su cobertura.
8. **Todo dato derivado viaja con su cobertura** (cuántas materias canónicas de la carrera tienen voces, sobre todos sus planes) y cada frase derivada dice en cuántas materias aparece: lo sistémico y lo local se distinguen con un número. **La cabecera derivada de carrera e institución espera** a que más de la mitad de las materias canónicas de la carrera tenga voces; hasta entonces la ficha dice que todavía no derivamos y se lee materia por materia.
9. **No hay piso.** Todo se publica desde la primera voz, como "X de N voces" y con su encogimiento a la vista; nada se desbloquea por escalones. Vale para las frases, las cabeceras, los derivados, los cruces y el CSV.
10. **La trayectoria sale de hechos declarados, y el silencio no se infiere** ([ADR-0067](decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)). La duración real es la mediana de los egresados que dijeron cuándo entraron y cuándo se recibieron, contra la nominal del plan; la brecha es la diferencia, en años. El egreso y el abandono se publican solo de cohortes cerradas (las que entraron hace al menos una vez y media la duración nominal), como tres proporciones de personas: se recibió, se fue, no dijo o sigue. Dónde se cae: por año del plan, y por materia desde cómo terminó cada cursada (abandono de cursada, aprobación). Qué se lleva junto: solo desde reseñas, nunca desde el plan que alguien marcó para sí. Todo "de quienes reseñaron", nunca "la tasa de la carrera".
11. **La serie es por el período en que pasó**, no por cuándo se reseñó; cada punto con sus voces y su encogimiento, sin suavizar, con la fecha de publicación y la de la réplica marcadas.
12. **Comparar es lado a lado, dato por dato, sin ordenar por valor.** La misma carrera (una carrera canónica que cura el catálogo) en varias instituciones: nominal, real, brecha, egreso, las dos cabeceras con su gate, la cobertura, las listas por eje. Sin compuesto y sin ganador; el que quiere ordenar baja el CSV, que gana una segunda tabla con los agregados de trayectoria.

13. **El comentario se publica como testimonio, debajo de las frases, nunca como cuerpo** ([ADR-0068](decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)): la reseña tal como se lee, con su período, su cátedra y las frases que marcó, sin cuenta ni nombre, con tope de un párrafo. Antes de publicar, un chequeo: lo que puede identificarte por contexto se marca y lo decidís vos (y la réplica no podrá citarlo); lo que habla de una persona fuera de su acto público queda retenido hasta que alguien lo mire. Se modera lo que expone a una persona (la que aportó, un tercero), no al docente evaluado ni a la institución; nada baja solo por cantidad de reportes; y si un texto se retira, sus frases siguen contando. La réplica pasa el mismo chequeo, queda retenida un plazo desde el aviso, y se publica al lado, con nombre: no baja el testimonio ni mueve conteos. Los testimonios se ordenan por "a mí también me pasó", alimentan la destilación siempre, y no se exportan en bloque.

## Qué no hace

- **No investiga causas.** Mostramos que una materia es un embudo en tres instituciones. Por qué lo es, no lo sabemos y no lo afirmamos. Somos el crudo y el movilizador: que otros se tomen el trabajo de averiguarlo.
- **No juzga lo que mide.** Publica hechos con sus voces y su método, y en ningún lado afirma una causa ni nombra un culpable: el eje dice de qué lado cae cada frase (la carrera siendo dura, alguien fallando), no quién tiene la culpa; el sujeto dice de qué habla; y qué se hace con eso lo decide quien lee.
- **No planifica tu cuatrimestre.** Eso se resuelve con una lapicera en quince minutos, y competir con la lapicera fue lo que volvió compleja la versión anterior. Le damos lo que la lapicera NO puede calcular: cuánto tarda la gente de verdad, cuántas clases se dieron, y de los que llevaron esas dos materias juntas, cuántos dejaron una.
- **No pretende autoridad ni tiene convenios.** No podríamos publicar estos números y a la vez depender de quien evaluamos.

## Posición tomada

Nada de esto es neutral.

- El nombre del alumno NUNCA aparece. El del docente sí, porque responder es un acto público. El riesgo no es simétrico.
- Aportar pide cuenta, no constancia: si todos se tienen que verificar, el muro queda antes del valor y no hay corpus. El que prueba su condición de alumno suma una señal que viaja con el dato: verificarse pesa, no habilita. Y jamás mostramos quién es nadie; sin eso, el que más tiene para contar es el que más tiene para perder.
- El anonimato es mecanismo, no declaración: revisamos que el TEXTO no te reconstruya, y limitamos qué puede citar la réplica ([ADR-0068](decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)).
- Los conteos no te nombran: nada publicado trae nombre, cuenta ni perfil, y lo que se descarga es lo mismo que se publica, agregado y con sus voces; no existe un crudo que tenga más que la ficha. No hay piso de personas: un conteo chico se publica chico, con sus voces a la vista. Lo que no prometemos es anonimato estadístico: en un grupo chico la sospecha existe y no es nuestra para eliminar; es el precio de reclamar, y se le dice al que reseña antes de publicar.
- Se modera lo que expone a una persona, no lo que incomoda a la institución. Cada testimonio que se baja de más es uno que no se vuelve a escribir.

## A quién sirve

Al que elige, para no decidir con un folleto. Al que está adentro, para saber si lo que le pasa es la materia o la cátedra, y para no reclamar solo. Al docente que da bien su materia, que por primera vez tiene dónde que se vea. Al que investiga, porque somos el crudo y se descarga sin registro.

Y a la institución: lo atractivo para ella es exactamente la amenaza que plan-b representa. El mismo dato que la expone es el que le dice dónde arreglar. La que lo ignora queda expuesta; la que lo usa mejora. Las dos rompen la asimetría, una a la fuerza y la otra por decisión.

## Fin último

Que una facultad publique voluntariamente lo que hoy tenemos que reconstruir desde abajo. Ese día plan-b ganó, incluso si deja de hacer falta.
