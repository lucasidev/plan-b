# ADR-0078: The questionnaire collects in pairs, the ficha reports by theme

- **Estado**: aceptado (2026-08-23)
- **Fecha**: 2026-08-23
- **Precisa**: [ADR-0064](0064-phrases-with-voices-not-scores.md), [ADR-0065](0065-attribution-is-the-axis-not-a-split.md), [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md), [ADR-0075](0075-the-published-proportion-has-a-z-a-denominator-and-one-voice-per-cursada.md)

## Contexto

La revisión del 2026-08-23 arrancó por una pregunta chica (cómo se ve la reputación de un sujeto) y terminó revisando el modelo de medición entero, con estas fallas encontradas en el camino:

1. **La cabecera dual no le sirve a nadie.** "7 de cada 10 marcaron alguien fallando" no dice qué arreglar ni qué elegir; y con el catálogo creciendo hacia lo material sufre el mismo defecto que mató al 1-5: mezcla la cuota con el trato con el laboratorio.
2. **El catálogo no cubría la vivencia entera.** Generando desde las premisas reales de queja y alabanza aparecieron familias completas sin una sola frase: economía, infraestructura, compatibilidad con la vida, promesa contra realidad. El desbalance medido (2 frases de exigencia contra 16 de gestión en cátedra) era síntoma de eso, no de que falten ejes.
3. **El catálogo como formulario induce.** Ofrecer 7 casilleros negativos y 2 positivos por familia sesga las marcas por oferta nuestra, no por vivencia.
4. **Un sumario ambiguo.** Mostrar el tema con el porcentaje de su frase más sostenida hace ilegible de quién es el número ("¿el 47% es del título o de los trámites?"), y esconder los demás hechos bajo uno.
5. **La entrada natural con LLM se evaluó y se descartó**: matchear texto libre contra el catálogo mete un juez en el medio (modelo), con el español coloquial (negación, ironía) como enemigo concreto, y un costo de infraestructura que este producto no quiere.

La investigación externa mostró que tres industrias convergen en el mismo patrón: la encuesta nacional de estudiantes del Reino Unido (NSS: ítems agrupados en temas, cuatro opciones sin punto medio, dos positivas y dos negativas, y publicación de la *positivity* por ítem y por tema, sin promedios), la literatura de evaluación docente (los ítems conductuales, tipo BARS, reducen los sesgos que cargan las calificaciones subjetivas) y las encuestas de clima (el *percent favorable* por factor como reporte estándar, con barras divergentes como visualización recomendada para pares sin neutro).

## Decisión

**Dos artefactos con papeles distintos: el cuestionario recolecta datos; la ficha calcula y presenta información sobre esos datos, con cada indicador definido por fórmula publicada en el Método.** La ficha no espeja el formulario ni el formulario anticipa la ficha: los une el mapeo publicado hecho → tema/eje/sentido.

### La frase gana su tercera coordenada

Cada hecho del catálogo lleva **sujeto** (de qué habla: a qué ficha va), **eje** (quién carga: la carrera siendo dura, o alguien fallando) y **tema** (qué parte de la vivencia es: enseñanza, evaluación, cumplimiento, trato, carga y vida, economía, infraestructura, trámites, y las que la curaduría sostenga). El tema organiza la recolección y el reporte; el eje viaja como etiqueta de cada hecho y conserva la alarma; el sujeto no cambia.

### El cuestionario (la recolección)

1. **Se recorre por temas**, pocas pantallas, todas salteables; el silencio no es dato y no se infiere.
2. **Cada hecho se ofrece con su opuesto al lado** (el par junto): la oferta queda balanceada por construcción y el sesgo de casilleros muere en la entrada. Marcar un lado es la afirmación de siempre; no marcar es no decir.
3. **La marca es binaria** (afirmás el hecho o no), no un grado de acuerdo: el matiz de un hecho es cuántas personas lo sostienen.
4. **El comentario se ancla al tema**: cada pregunta cierra con un "¿algo más de esto?" opcional. La curaduría recibe el texto ya clasificado por el propio autor, sin ningún modelo en el medio, y las frases nuevas de un tema nacen de textos escritos bajo ese tema.
5. **Presupuesto editorial**: un tema sostiene del orden de 6 a 10 hechos; antes de agregar el undécimo, la curaduría funde variantes. La compresión empieza en el catálogo.
6. **El instrumento se pilotea** antes de confiar: un grupo chico, ajuste de redacción de ítems, y recién después se recolecta en serio.

### La ficha (la información)

Indicadores admitidos, cada uno con definición publicable:

- **Frecuencia por hecho**: k afirmaciones sobre las n voces del sujeto, publicada con el encogimiento de ADR-0075 y el crudo al lado.
- **Prevalencia por tema**: personas con al menos una afirmación de sentido negativo en el tema, y aparte las de sentido positivo, contra el mismo denominador; una persona cuenta una vez. Es la *positivity* del NSS y el *percent favorable* de la industria, en las dos direcciones.
- **El retrato**: los hechos más sostenidos del sujeto, del signo que salgan; selección mecánica por frecuencia, sin curación.
- **La serie**: cualquier indicador cortado por período en que pasó, sin rótulo de tendencia: la conclusión la saca quien mira.
- **¿Responden?**: el canal de réplica (presente o vacante, con fecha de aviso) junto a la serie de lo señalado. La conducta del sujeto ante el señalamiento es parte de su reputación.
- Las derivadas y la trayectoria siguen como estaban (suma de voces con cobertura; cohortes cerradas).

Excluidos, con su razón: el **índice con pesos** (los pesos serían opinión editorial nuestra escondida en un número), el **promedio entre hechos** (mezcla inconmensurables y no dice cuál arreglar), el **neto** positivo menos negativo (esconde la división real de experiencias), y el **eje como cabecera** (las dos proporciones de atribución dejan de encabezar la ficha; la atribución vive en cada hecho).

### El nombre del conjunto

**Reputación**: lo que la ficha muestra de un sujeto: sus hechos sostenidos por tema, con voces, su serie y su réplica. **Nunca un número.** El término entra al glosario definido a la contra del uso común (los "reputation systems" son scores; esto es un expediente).

## Alternativas consideradas

**A. Espejo estricto** (la ficha muestra lo recolectado tal cual, sin indicadores). Descartada: confunde el instrumento con el reporte; la ficha es estadística descriptiva o no informa.

**B. Índice ponderado por tema** (las frases con pesos por sentido, un número por tema). Descartada con tres escenarios concretos: el catálogo decide el número (7 casilleros negativos contra 2 generan marcas por oferta), los pesos son opinión editorial indefendible ("¿el acoso pesa cuánto contra el cronograma?"), y el neto esconde la bimodalidad (500 a favor y 500 en contra da "ni bien ni mal").

**C. Entrada de texto libre con matcheo por modelo** (el catálogo como diccionario, confirmación del autor). Tiene virtudes reales (fricción, cobertura, sin sesgo de oferta) y se descartó por el LLM en el loop: juez intermedio, español coloquial como riesgo concreto, infraestructura que no queremos. El micro-comentario anclado conserva su mejor parte (texto pre-clasificado por el autor) sin ningún modelo.

**D. Más ejes** (economía, infraestructura como ejes nuevos). Descartada: cada familia temática cruza los dos ejes por adentro ("los materiales cuestan un ojo" es la carrera; "la cuota aumenta sin aviso" es alguien fallando), así que un eje temático dejaría sin responder la pregunta de atribución dentro de cada tema. El tema es coordenada nueva, no reemplazo del eje.

**E. Resumir el tema con su hecho más sostenido** (sin número de tema). Descartada por ambigua (el número parece del tema) y porque esconde los demás hechos.

## Consecuencias

- **Queda una decisión abierta, y es la más importante antes de construir la ficha**: muestra chica. El estándar (NSS) suprime bajo umbral; la tesis venía sin piso con encogimiento. Tercera vía nombrada: el hecho se publica siempre encogido y el sumario de tema exige un n mínimo. Se decide con la ficha en la mano.
- **Deroga el balance-por-eje del catálogo.** La regla 4 de [phrases.md](../product/phrases.md) pedía mantener el catálogo balanceado por eje porque la proporción agregada por eje (la cabecera dual) era sensible a cuántas frases se ofrecían de cada lado. Muerta la cabecera, cada frase reporta su propia frecuencia, independiente de las demás: el balance y la simetría dejan de ser un requisito del catálogo. Una frase va sola o en par según si su opuesto es un hecho que alguien afirma, no según un balance a sostener.
- **La sesión de curaduría cambia de forma**: ya no es "más frases para cátedra", es asignar el tema a las 46 y poblar las familias vacías (economía, infraestructura, carga y vida, promesa), con el presupuesto de 6 a 10 y la vara del eje. Las frases las escribe el equipo, no se delegan.
- **Propagación pendiente, planificada como rework y no hecha acá**: las stories de Reseñar (el flujo pasa a temas con pares), la ficha de Método (publica los indicadores y el mapeo), las fichas de pantalla y escenarios que citan la cabecera dual, y el catálogo con su columna nueva. Hasta esa propagación, los docs citados describen la versión anterior.
- ADR-0064 queda precisado (la unidad frase-con-voces sobrevive; su punto de cabecera se supera), ADR-0065 queda precisado (la atribución sobrevive como etiqueta del hecho; su forma de publicación en cabecera se supera), ADR-0075 sigue entero (z, denominador y voz por cursada valen para todos los indicadores nuevos).
- Los bocetos de trabajo de la revisión (reputación por temas; reseñar por preguntas) son material de la sesión, no contrato: el hi-fi real se hace cuando la propagación llegue a las pantallas.

## Refs

- [Office for Students, About the NSS data](https://www.officeforstudents.org.uk/data-and-analysis/national-student-survey-data/about-the-nss-data/): ítems en temas, cuatro opciones sin neutro, positivity por ítem y tema, supresión por muestra.
- [Rethinking bias in student evaluations (Assessment & Evaluation in Higher Education, 2025)](https://www.tandfonline.com/doi/full/10.1080/02602938.2025.2548923) y [BARS para evaluar la enseñanza (Teaching and Teacher Education)](https://www.sciencedirect.com/science/article/abs/pii/S0742051X16301561): los ítems conductuales reducen sesgos de las calificaciones subjetivas.
- [Culture Amp, Guide to understanding survey results](https://support.cultureamp.com/en/articles/7048601-guide-to-understanding-survey-results): percent favorable por factor como reporte estándar.
- [Robbins & Heiberger, Design of diverging stacked bar charts](https://www.researchgate.net/publication/289590282_Design_of_Diverging_Stacked_Bar_Charts_for_Likert_Scales_and_Other_Applications): la visualización para pares sin neutro.
- ADR-0064, ADR-0065, ADR-0075: lo que esta decisión precisa y lo que conserva.
