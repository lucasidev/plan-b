# ADR-0064: The product publishes phrases with their voices, not scores

- **Estado**: aceptado
- **Fecha**: 2026-08-16

## Contexto

Con la tesis nueva ([THESIS.md](../THESIS.md), [ADR-0063](0063-the-product-is-a-pressure-instrument.md)) el producto pasó a ser un instrumento de presión: convierte lo que los alumnos vivieron en datos agregados que aguantan una discusión. Eso obliga a resolver dos preguntas que la versión anterior nunca se hizo en serio: **qué datos se piden** y **cómo se muestran** para que el resultado sea un hecho y no una opinión con decimales.

La tesis original (16 de agosto, primera versión) proponía: se tocan frases predefinidas y curadas por nosotros; de sus conteos salen **dos números** por sujeto, exigencia y gestión, en escala 1 a 5, "con encogimiento hacia el medio según cuánta gente habló". La auditoría de lo publicable ([catalog-review-2026-08-16.md](../domain/catalog-review-2026-08-16.md) y la mesa que siguió) mostró que ese diseño tenía tres agujeros y que ninguno era de implementación:

1. **La fórmula del número no existía en ningún doc**, y una story (O1-4) exige publicarla. "Encogimiento hacia el medio" es una intención, no un método.
2. **Un número 1-5 hecho de frases es un promedio disfrazado.** Mete "te la estudiás solo" (9 voces) y "hay clases que no se dan" (4 voces) en la misma bolsa y saca 1.9. La institución que lee "gestión 1.9" no sabe si arreglar el cronograma o el trato. El propio mapa de producto había matado "el puntaje único porque promediaba exigencia con gestión y escondía la segunda"; un número de gestión promedia nueve fallas distintas y esconde ocho.
3. **Un número 1-5 rankea aunque no se llame ranking** ("UNSTA 2.9, UTN 2.2, UNT 1.9"), y la tesis dice que no es un ranking.

Además, las frases eran solo nuestras: si las 32 las inventamos nosotros, el producto responde "¿qué falla?" únicamente con las fallas que se nos ocurrieron. ADR-0063 lo había dejado anotado como riesgo abierto ("la curaduría hereda el problema del texto libre en otra forma: texto libre no agrega, frases curadas no cubren").

Antes de inventar, se buscó quién ya había resuelto los dos problemas: resumir muchas opiniones sin un número engañoso, y publicar proporciones con muestras chicas. La rueda existe, dos veces.

## Decisión

Son dos capas, decididas en orden: primero qué se recaba, después qué se publica. Están escritas en la tesis en su voz (secciones "Qué recabamos" y "Qué publicamos"); acá está el porqué.

### Qué recabamos

1. **La unidad de reseña es la cursada**, no la materia en abstracto ni el período: lo que viviste cursando una materia, que incluye la materia (el contenido), la cátedra (cómo la dieron) y la gestión que la rodeó (mesas, aula, sistema, trato). Un solo acto cubre las tres. La persona elige la materia que tiene en la cabeza; el sistema reparte cada frase al sujeto del que habla.
2. **La reseña se compone de frases marcadas y, opcionalmente, un comentario en las palabras del que reseña.** Cada frase tiene un **sujeto** (de qué habla: la materia, la cátedra, la institución, el centro de estudiantes; la lista no es cerrada) y un **eje** (de qué aspecto habla: exigencia o gestión). El comentario existe para lo que ninguna frase cubre.
3. **Las frases no son solo nuestras.** Las nuestras son la semilla; **de los comentarios de muchos se destilan, con inteligencia, las frases que faltaban**, y esas se suman a las que se ofrecen para marcar. La frase destilada es dato derivado: propone la máquina, validan las voces.
4. **El que no quiere escribir vota**: "a mí también me pasó" sobre una reseña entera. Es la forma de sumar una voz sin producir texto, y lo que convierte una reseña en muchas.
5. **El evento institucional se reseña aparte, de a uno, sin materia**: trámites, título, equivalencias, vacantes, el sistema, mesas, el trato de administrativos y del centro de estudiantes. Mismo mecanismo (frases, comentario, votos) con el sujeto fijo.
6. **Los hechos de trayectoria se preguntan de a uno, cuando aparecen**: cuándo entraste, cuándo cursaste y cómo terminó (vienen con la reseña), si te fuiste cuándo, si te recibiste cuándo. Nunca como inventario. Cómo se consiguen y qué se publica con ellos: [ADR-0067](0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md).
7. **Convivencia, trato y acoso entran como cualquier otra frase.** No hay categoría aparte ni canal privado: silenciarlo es lo que hacen todos, y el instrumento existe para lo contrario.
8. **Nada más se reseña.** Ni la carrera, ni la universidad, ni la gestión como acto: se derivan.

### Qué publicamos

9. **La unidad de publicación es la frase con su proporción de voces**, separada por eje. "Hay clases que no se dan: 37% de 120 personas". Cada frase es su propio hecho, con su propio n; no se promedia con ninguna otra.
10. **No hay número global 1 a 5 por eje.** Los dos ejes se quedan como las dos familias que la tesis separa (exigencia no es gestión), y cada una se muestra como **la lista de sus frases con voces**. Lo que se pierde (una cifra que se lee en dos segundos) se recupera con **una proporción de personas, no un promedio de frases**: "7 de cada 10 que reseñaron marcaron algún problema de gestión". Es una proporción, se entiende sin fórmula, y no rankea como un puntaje.
11. **El encogimiento tiene nombre y fórmula publicable: el límite inferior del intervalo de Wilson** (o su equivalente, el promedio bayesiano con prior hacia 0.5) aplicado a **cada proporción individual**, nunca a un número global. Con 4 personas de 4 que marcan una frase, la proporción publicada no es 100%: es el límite inferior, y sube sola con las voces. Es lo que O1-4 exige publicar y lo que Rocío puede citar.
12. **Cada dato viaja con sus voces** (cuántas personas lo sostienen: la reseña más sus votos) y con el período de lo que lo sostiene. Es lo que separa un hecho de una anécdota, y lo que hace que la lista se lea con el peso que tiene.
13. **La lista destilada se reprocesa** a medida que entran reseñas, y eso se dice: la ficha de hoy no es la de ayer. Y **la frase destilada no es cita**: es síntesis, y se declara como tal.

Sobre estas bases se apoyan, sin contradecirlas, las cuatro decisiones que la completan: la atribución ([ADR-0065](0065-attribution-is-the-axis-not-a-split.md): la decide el eje, se publica como dos proporciones de personas), la derivación de carrera e institución con sus cortes ([ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md): la voz se suma, gate por cobertura, sin piso), la trayectoria y las comparaciones ([ADR-0067](0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md): hechos declarados, cohorte cerrada, lado a lado sin ranking), y el comentario ([ADR-0068](0068-comment-publishes-as-testimony-below-the-phrases.md): se publica como testimonio debajo de las frases, con chequeo previo, moderación de la exposición y la réplica al lado). Con eso "qué publicamos" queda cerrado entero.

## Alternativas consideradas

### A. Los dos números en escala 1 a 5, con encogimiento (la intención original)

Rechazada por tres razones, y las tres tienen literatura:

- **La evaluación docente ya dictaminó contra el promedio.** Los puntajes tipo Likert son ordinales; "el promedio general de datos de evaluación estudiantil es en el mejor caso engañoso y en el peor directamente inválido". Dos docentes con distribuciones opuestas (uno adorado y odiado, otro tibio para todos) dan el mismo 3.0. La práctica recomendada es reportar la distribución (qué proporción respondió cada cosa), nunca la media. Es exactamente nuestro caso, resuelto en contra.
- **Un número global absorbe todos los sesgos.** RateMyProfessors tuvo que matar el "chili pepper" en 48 horas después de que se mostrara que sesgaba el puntaje entero; análisis de millones de ratings muestran que el número global varía con el género del docente, la disciplina y la "facilidad" percibida. Los tags específicos ("tough grader", "caring") no cargan ese sesgo y son lo más útil del sitio.
- **Pierde la información que la tesis existe para dar.** "Gestión 1.9" no dice qué arreglar. La lista de frases sí.

### B. Un número global sin ejes (el puntaje único)

Rechazada antes de esta decisión, por el mapa de producto: "promediaba exigencia con gestión y escondía la segunda". Se registra acá porque es la razón de que los ejes existan aunque el número no.

### C. Frases curadas solo por nosotros, sin destilar

Rechazada: responde "¿qué falla?" solo con las fallas que se nos ocurrieron. Amazon ("Customers say") ya resolvió el problema con la misma arquitectura que adoptamos: la IA lee reseñas, agrupa por aspecto, cuenta menciones positivas y negativas por aspecto, y muestra el desglose con las reseñas más relevantes. Con dos advertencias que ellos aprendieron y adoptamos (punto 13): se reprocesa continuamente, y no es cita.

### D. Publicar el promedio simple sin encogimiento

Rechazada: con muestras chicas, 1 de 1 es 100% y no dice nada. Es el problema que Evan Miller documentó en 2009 ("How Not To Sort By Average Rating") y que resolvió medio internet (Reddit incluido) con el límite inferior de Wilson o el promedio bayesiano. Adoptamos la rueda con su nombre.

### E. Publicar el comentario literal como cuerpo de la ficha (la reseña escrita, como en el producto anterior)

Rechazada como cuerpo de la ficha, no como dato: cuarenta reseñas escritas son cuarenta anécdotas; cuarenta marcas en la misma frase son un hecho. Glassdoor resolvió lo mismo con "Pros" y "Contras" agregados de las reseñas (lo que más se repite, separado por lado) bajo el número general, nunca mezclados. Qué se hace con el comentario individual al publicar queda en la mesa abierta; lo que está decidido es que la ficha muestra frases con voces, no textos.

## Consecuencias

### Positivas

- **Todo lo publicado es citable sin fórmula secreta**: "37% de 120 personas" se entiende, se verifica y se discute. Lo único que requiere método es el encogimiento, y el método está publicado y es estándar.
- **La institución sabe qué arreglar**: no un número, sino cuáles frases suben.
- **Ninguna pieza es invento nuestro**: proporciones en vez de medias (literatura de evaluación docente), tags con conteo por aspecto (RateMyProfessors, Amazon), pros y contras separados (Glassdoor), Wilson/bayesiano para muestras chicas (Miller). Lo único nuestro es la separación exigencia/gestión y la atribución, que es la tesis.
- **El corpus crece de abajo**: las frases destiladas hacen que el producto responda con las fallas que la gente vivió, no con las que imaginamos.

### Negativas

- **Se pierde la comparación de un vistazo.** Valentina no ve "3.9 vs 2.6"; ve dos listas o una proporción de personas. Es un costo de UX real y se acepta a cambio de no mentir con un decimal.
- **La destilación necesita un pipeline con inteligencia y validación humana**, que no existe y es trabajo nuevo. Sin él, solo hay frases semilla.
- **La ficha cambia con el tiempo** y hay que decirlo; una cita de hoy puede no reproducirse mañana. Se mitiga con la fecha del dato y, cuando se decida, con cortes.

### A vigilar

- **La proporción "de personas que marcó algún problema" puede convertirse en el número que dijimos que no queríamos**, si la UI lo trata como puntaje. Es una proporción de personas y se muestra como tal ("7 de cada 10"), nunca como 0.7 ni como estrellas.
- **Wilson con n muy chico da proporciones muy bajas** para frases verdaderas: 2 de 2 puede publicarse como 34%. Es correcto (no sabemos más que eso) y hay que explicarlo en `metodo`; no es un bug.
- **La destilación puede inventar frases que nadie marcó**: por eso la frase destilada no se publica hasta que las voces la validen (punto 3).

## Refs

- [THESIS.md](../THESIS.md): "Qué recabamos" y "Qué publicamos".
- [ADR-0063](0063-the-product-is-a-pressure-instrument.md): el viraje que abre esta decisión. [ADR-0054](0054-metrica-sin-sustento-viaja-null-nunca-cero.md): una métrica sin sustento viaja null; acá, sin voces no hay proporción. [ADR-0047](0047-pass-rate-publico-desde-historial-privado.md): el precedente de publicar proporciones y no absolutos.
- **La completan** [ADR-0065](0065-attribution-is-the-axis-not-a-split.md) (atribución), [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (derivación, cobertura, sin piso) [ADR-0067](0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (trayectoria y comparaciones) y [ADR-0068](0068-comment-publishes-as-testimony-below-the-phrases.md) (el comentario como testimonio).
- **Supersede** a [ADR-0005](0005-reseña-anclada-al-enrollment.md) (la reseña ya no ancla a un `EnrollmentRecord`) y a [ADR-0060](0060-review-names-the-teacher-it-remembers.md) (ya no hay reseña de texto libre con docente reseñado), y, junto con [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md), a [ADR-0061](0061-ratings-aggregate-by-commission-and-roll-up-on-coverage.md) (acá los ratings por comisión; allá la derivación con gate de cobertura) y a [ADR-0047](0047-pass-rate-publico-desde-historial-privado.md) (acá la forma, proporción con su n; allá el piso).
- Evaluación docente contra el promedio: [Analysing Student Evaluations of Teaching: comparing means and proportions](https://www.tandfonline.com/doi/abs/10.1080/09500790.2011.603411); [Proposed metrics for summarizing SET data from balanced Likert surveys](https://www.tandfonline.com/doi/full/10.1080/2331186X.2023.2254665); [Analyzing and Interpreting Data From Likert-Type Scales](https://pmc.ncbi.nlm.nih.gov/articles/PMC3886444/).
- Sesgo del número global: [Rate My Professors ditches its chili pepper](https://www.insidehighered.com/news/2018/07/02/rate-my-professors-ditches-its-chili-pepper-hotness-quotient) (Inside Higher Ed, 2018).
- Frases por aspecto con conteo: [How Amazon's AI-generated review highlights work](https://www.aboutamazon.com/news/retail/amazon-ai-generated-review-highlights); pros y contras separados: [Glassdoor, analyzing reviews](https://www.glassdoor.com/blog/best-practices-glassdoor-reviews/).
- El encogimiento: [Evan Miller, How Not To Sort By Average Rating (2009)](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html) y [Bayesian Average Ratings](https://www.evanmiller.org/bayesian-average-ratings.html); [Jules Jacobs, Bayesian ranking of items with up and downvotes](https://julesjacobs.com/2015/08/17/bayesian-scoring-of-ratings.html).
