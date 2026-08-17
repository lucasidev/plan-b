# ADR-0066: Derived cards sum voices and gate on coverage, not on a floor

- **Estado**: aceptado
- **Fecha**: 2026-08-16

## Contexto

Solo se reseña la cursada y el evento institucional ([THESIS.md](../THESIS.md), "Qué recabamos"). Todo lo demás que tiene ficha (la materia en todos sus períodos, la cátedra, la carrera en una institución, la institución) **se deriva**, y hasta acá ningún doc decía cómo. Lo que había:

- [ADR-0061](0061-ratings-aggregate-by-commission-and-roll-up-on-coverage.md) dejó la doctrina correcta para subir a carrera y universidad: solo cuando la cobertura lo respalda, nunca un número que "parece un dato" porque tres materias tienen reseña y treinta y siete no. Pero no fijó el umbral, y sus ratings por comisión ya no existen ([ADR-0064](0064-phrases-with-voices-not-scores.md)).
- El **piso** de personas estaba dicho de tres maneras incompatibles: el mapa de producto encendía la ficha por escalones (con una voz la primera frase, con cinco los dos números, con quince la atribución); [ADR-0047](0047-pass-rate-publico-desde-historial-privado.md) fijaba cinco personas como mínimo de todo agregado público, por re-identificación; y 0064 publica una frase con dos voces (Wilson la deja en 34%, y dice que es correcto). Además la revisión adversarial del catálogo ([grupo A](../domain/catalog-review-2026-08-16.md)) mostró que el piso como sistema de privacidad tenía cinco fallas y que ninguna se arreglaba con un umbral; la posición tomada fue descartarlo: no publicamos quién, y en un grupo chico la sospecha existe y no es nuestra para eliminar. Es el precio de reclamar, y se le dice al que reseña.
- **"Brecha"** aparece en el mapa junto a los dos números y no está definida en ningún lado.

Hacen falta cuatro definiciones para poder decidir: **voz** (una persona hablando de una cursada: la reseñó o la votó), **derivar** (armar la ficha de un sujeto que no se reseña sumando las voces de las cursadas que le pertenecen), **cobertura** (cuántas de las materias del plan tienen voces, sobre el total del plan; distinto de las voces: 850 voces en 3 materias es mucha voz y poca cobertura) y **piso** (un mínimo de voces por debajo del cual no se publica una proporción).

## Decisión

1. **Arriba de la cursada, la voz es (persona, cursada), y se suma.** Quien reseñó tres cursadas de una carrera son tres voces en esa carrera. No se deduplica por persona ni se promedian proporciones por materia: la proporción de una frase en cualquier nivel es voces que la marcaron sobre voces del nivel, y la cabecera (dicen que es dura / marcaron alguien fallando, [ADR-0065](0065-attribution-is-the-axis-not-a-split.md)) se calcula igual. Una línea en el método.

2. **Qué se deriva de qué.** La materia en todos sus períodos y la cátedra: la suma de sus cursadas. La **carrera en una institución**: la suma de todo lo marcado en las cursadas de las materias de su plan, con todos los sujetos (un trámite que falla mientras cursás es alguien fallando en tu carrera; cada frase muestra su sujeto). La misma carrera en dos instituciones son dos fichas. La **institución** son tres cosas separadas, y nunca un número que las mezcle: (a) lo que se dice de ella **como sujeto** (las frases con sujeto institución, administración o centro, vengan de una cursada o de un evento institucional: trámites, título, trato); (b) **sus cursadas** (los dos ejes sumando todas las cursadas de todas sus carreras); (c) su **cobertura**.

3. **Todo dato derivado viaja con su cobertura, y toda frase derivada dice en cuántas materias aparece.** "Hay clases que no se dan: 23% de 850 voces, en 12 de 40 materias" separa lo sistémico de lo local con un número.

4. **La cabecera derivada de carrera e institución se publica cuando más de la mitad de las materias del plan tiene voces.** Debajo de eso, la ficha muestra la cobertura, dice que todavía no derivamos, y deja leer materia por materia; las listas de frases con su "en N materias" se publican desde la primera voz, porque se autodeclaran. Para la institución el gate rige sobre (b), sumando los planes cargados; (a) no lo necesita, son voces directas sobre ella, y es su cabecera temprana. El gate no es un piso disfrazado: es lo de 0061, con corpus chico el número dice qué materias se tomaron el trabajo de reseñar, no cómo es la carrera, y se cita sin la nota al pie. "Más de la mitad" es defendible en una mesa; un tercio o "diez materias" son arbitrarios.

5. **No hay piso.** Todo se publica desde la primera voz, siempre como "X de N voces" más la proporción encogida (Wilson dice "poco sustento" mejor que un umbral, y a la vista). Nada se desbloquea; la escalera del mapa muere. Vale para todo lo publicado: frases, cabeceras, derivados, cruces y el CSV, que es lo que se publica y nada más. Lo que se le dice al que reseña, antes de publicar: no publicamos quién, nunca; en un grupo chico pueden sospechar, y eso no lo elimina ningún número. No prometemos anonimato estadístico; prometemos no publicar quién.

## Alternativas consideradas

**A. Deduplicar la voz por persona arriba de la cursada** ("de 300 personas que reseñaron algo de la carrera, 7 de cada 10 marcaron alguien fallando en al menos una"). Hace depender la proporción de cuántas cursadas reseñó cada uno: el que reseñó ocho tiene ocho chances de haber marcado algo. Descartada.

**B. Promediar las proporciones por materia** (cada materia pesa igual). Es un promedio de promedios, lo que 0064 rechazó; esconde las voces y le da a una materia con dos voces el mismo peso que a una con doscientas. Descartada.

**C. Sin gate de cobertura: mostrar siempre la cabecera derivada con la cobertura al lado.** Es lo más honesto en la pantalla y lo menos honesto fuera de ella: el número se cita sin la nota al pie, y con tres materias de cuarenta dice qué materias duelen, no cómo es la carrera. Descartada; la cobertura al lado queda igual, como obligación además del gate.

**D. Gate por cantidad fija** (diez materias con voces) o por fracción menor (un tercio). Ninguno se defiende en una mesa; "más de la mitad del plan habló" sí. Descartada.

**E. Piso de cinco voces, estadístico** (el de 0047 sin el argumento de privacidad). Wilson ya hace ese trabajo sin esconder nada, y un piso reabre la escalera de desbloqueos y "cuántos faltan para que se encienda". Descartada.

**F. La escalera del mapa (1 / 5 / 15).** Era el piso en tres escalones, y contradecía tanto a 0047 como a 0064. Descartada con el piso.

## Consecuencias

- **La carrera y la institución van a estar sin cabecera derivada mucho tiempo.** Con cuarenta materias por plan, más de la mitad con voces tarda. Es la misma disciplina que 0061 aceptó: no bajar el gate para que "se vea algo". Mientras tanto la carrera muestra cobertura y frases con "en N materias", y la institución muestra lo que se dice de ella como sujeto.
- **T2-4 se reescribe**: la promesa deja de ser "ningún conteo por debajo del piso" y pasa a ser "no publicamos quién, y te lo decimos antes: en un grupo chico pueden sospechar". **O8-1** deja de hablar de piso: el CSV es lo que se publica. **T2-3 y T3-4** dejan de hablar de desbloqueos: la ficha crece desde la primera voz.
- **La escalera de desbloqueos del mapa muere**, y con ella la "consistencia verificada" que la daba por buena.
- **"Brecha" deja de flotar**: la define [ADR-0067](0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) como la duración real menos la nominal, en años.
- **[ADR-0047](0047-pass-rate-publico-desde-historial-privado.md) y [ADR-0061](0061-ratings-aggregate-by-commission-and-roll-up-on-coverage.md) quedan superados**: la forma de 0047 (proporción con su n) vive en 0064; su piso, acá; y la derivación con gate de 0061 queda fijada.
- **La sospecha en grupos chicos es real** y ahora está declarada en vez de escondida detrás de un umbral que no la eliminaba. Se le dice al que reseña, en el momento de publicar, con las palabras de la tesis.

## Precedente

Las universidades que publican sus evaluaciones docentes usan dos cortes distintos: no generan el reporte con menos de cinco respuestas, **por confidencialidad** (el argumento que acá se descartó: no publicamos autoría), y además fijan umbrales de tasa de respuesta **por representatividad**, que es nuestra cobertura ([Washington](https://www.washington.edu/assessment/course-evaluations/course-eval-faq/), [Toronto](https://teaching.utoronto.ca/course-evaluations/for-instructors-and-administrators/a-step-by-step-guide-to-reviewing-course-evaluations/)). Rotten Tomatoes deja ver el Tomatometer temprano y reserva el sello *Certified Fresh* para cuando hay ochenta reseñas (cuarenta en estreno limitado) y al menos cinco de críticos principales ([FAQ](https://www.rottentomatoes.com/faq)): el dato existe desde el principio, la afirmación fuerte espera al sustento. Es exactamente listas desde la primera voz, cabecera con gate.

## Refs

- [THESIS.md](../THESIS.md), "Qué publicamos" y "Posición". [ADR-0064](0064-phrases-with-voices-not-scores.md): la unidad (proporción de voces con Wilson) que acá se suma hacia arriba; **completa** a 0064. [ADR-0065](0065-attribution-is-the-axis-not-a-split.md): la cabecera que se deriva.
- [ADR-0054](0054-metrica-sin-sustento-viaja-null-nunca-cero.md): debajo del gate no hay un cero, hay "todavía no derivamos" con la cobertura a la vista.
- Grupo A de la [revisión adversarial del catálogo](../domain/catalog-review-2026-08-16.md) (el piso como sistema, descartado) y "Reglas del corpus" del [product-map](../domain/product-map.md) (la escalera).
