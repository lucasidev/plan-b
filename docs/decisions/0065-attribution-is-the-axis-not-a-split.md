# ADR-0065: Attribution is the axis, published as two proportions of voices, never a split

- **Estado**: aceptado; precisado por [ADR-0078](0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md) (la atribución por eje sigue, pero viaja como etiqueta de cada hecho; su publicación como cabecera dual se supera)
- **Fecha**: 2026-08-16

## Contexto

La tesis promete responder la pregunta de quien está eligiendo (US-129): *si lo que hace difícil a una carrera es la carrera o la facultad, porque una cosa la elijo y la otra la sufro*. A eso le llamamos **atribución**. La intención original (decisión 2 de la tesis, tal como aterrizó con [ADR-0063](0063-the-product-is-a-pressure-instrument.md)) la calculaba desde el cruce sujeto × eje de cada frase: exigencia-materia = "la carrera siendo dura"; gestión-cátedra o gestión-institución = "alguien fallando"; y prometía un split: "de todo lo que la hace difícil, el 65% es la institución fallando".

Tres cosas rompieron esa regla al intentar modelarla:

1. **La matriz tiene seis celdas y la regla cubre tres.** "Contenido de hace diez años" es sujeto materia y eje gestión: alguien falla, y la regla la manda a "carrera dura" o a ningún lado. "Exigen mucho, y se puede" es sujeto cátedra y eje exigencia: la regla la manda a "alguien falla", que es lo contrario de lo que dice. La primera está en el corpus del mapa (hallazgo G1 de la [revisión del catálogo](../history/reviews/2026-08-16-catalog.md)); la segunda, en el [catálogo de frases](../product/phrases.md) (F28), donde "Te la estudiás solo" quedó como cátedra y gestión: la cátedra que no enseña, no la materia que es difícil (F16).
2. **El sujeto es lista abierta** desde [ADR-0064](0064-phrases-with-voices-not-scores.md): materia, cátedra, institución, centro de estudiantes, administración, lo que traigan los eventos institucionales. Una regla por celda no escala con una lista abierta.
3. **El "65%" no tiene denominador honesto.** "De todo lo que la hace difícil" solo puede ser "de todas las marcas", y esa proporción es un artefacto del catálogo de frases: si ofrecemos veinte frases de gestión y ocho de exigencia, "el 65% de las marcas es gestión" sale solo, mecánicamente, diga lo que diga la gente. Además fuerza una complementariedad que no existe: una materia puede ser dura **y** estar mal llevada; 65/35 esconde que las dos son altas.

Y una cuarta cosa que la regla original mezclaba: quería que el sujeto respondiera dos preguntas distintas a la vez, *a qué ficha va la frase* y *de qué lado cae*. Son preguntas distintas.

## Decisión

**La atribución la decide el eje, y nada más.** Toda frase de eje **exigencia** es "la carrera siendo dura", venga de la materia, la cátedra, la institución o el sujeto que sea: exigencia es información, no defecto. Toda frase de eje **gestión** es "alguien fallando": alarma. El **sujeto** no atribuye: dice a qué ficha va la frase y, cuando es cátedra, institución o centro, quién. Seis celdas resueltas y cualquier sujeto futuro también, sin tabla.

**Se publica como dos proporciones de voces con el mismo denominador** (en la ficha de una cursada una voz es una persona; en las derivadas, una persona por cursada, [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)), que es la unidad que [ADR-0064](0064-phrases-with-voices-not-scores.md) fijó para la cabecera de la ficha: *"5 de cada 10 que reseñaron dicen que es dura. 7 de cada 10 marcaron alguien fallando."* Cada una encogida por Wilson como cualquier proporción. Abajo, por eje, la lista de frases con sus voces. **Nunca un split** ("el 65% de lo difícil"): no hay un denominador que lo sostenga.

**El catálogo de frases, con el sujeto y el eje de cada una, es una decisión editorial nuestra y se publica entero en Método.** Ahí vive la atribución, en la redacción y la clasificación de cada frase, criticable por quien nos audita. Una frase que admite las dos lecturas ("El final es otro nivel": ¿exigente, o toma lo que no se dio?) es un problema de redacción y se parte en dos, no un problema de atribución. Las frases destiladas reciben su sujeto y su eje al ser validadas, con la misma responsabilidad.

Lo que la atribución **no** dice: para una frase de gestión con sujeto materia ("Contenido de hace diez años"), el sujeto no nombra quién falla; lo dice la frase. No inventamos un culpable.

## Alternativas consideradas

**A. Matriz sujeto × eje con una regla por celda.** Completar las tres celdas huérfanas a mano (materia-gestión → alguien fallando; cátedra-exigencia → carrera dura; institución-exigencia → carrera dura). Termina idéntica a la decisión, salvo que alguna celda vaya contra su eje (por ejemplo, cátedra-exigencia como "alguien fallando"), y eso contradice la tesis: exigencia no es defecto. Más reglas para el mismo resultado, y no escala con sujeto abierto. Descartada.

**B. Un tercer tag curado por frase, independiente del eje.** Permitiría frases de gestión que "no son falla" o de exigencia que "sí lo son". Cada caso así es una frase mal redactada, y un tag que puede contradecir al eje vacía de sentido a los dos ejes de la tesis. Descartada.

**C. Que la persona declare, por frase, "es la materia" o "es la facultad".** Cuesta tiempo (Lucía no lo hace), invita el sesgo de quien está enojado, y la tesis ya dice que la atribución se calcula. Descartada.

**D. El split de marcas como número de cabecera** ("el 65% de lo difícil es la institución"). Es la promesa original y la más golpeadora. Descartada por las tres razones del contexto: depende de cuántas frases hay por eje en el catálogo, fuerza una complementariedad falsa, y no es la unidad de 0064. Dos proporciones de voces pegan igual y son defendibles.

## Consecuencias

- **La atribución deja de ser un mecanismo aparte**: es la lectura de los ejes. La decisión 2 de la tesis se reescribe a eso y la oración del 65% desaparece.
- **La responsabilidad se corre al catálogo de frases**: la clasificación (sujeto, eje) de cada frase es una decisión editorial publicada. Un error de eje en una frase es un error de atribución en todas las fichas que la usan; se corrige en un lugar y se reprocesa (0064 ya dice que la lista se reprocesa y se declara).
- **La cabecera de la ficha son dos proporciones de voces**, una por eje, con el mismo denominador y con Wilson. La cabecera y las listas cuentan lo mismo de dos maneras: no hay un tercer número.
- **El CSV de US-180** lleva sujeto y eje por fila; la columna "atribución" es el eje y no se duplica.
- **La familia ternaria del mapa (materia / cátedra / institución) y la atribución binaria de la tesis no compiten**: la ternaria es sujeto, la binaria es eje. El hallazgo 3 del [product-map](../product/map.md) se cierra.
- **Riesgo aceptado**: la proporción de voces por eje sigue siendo algo sensible a cuántas frases hay por eje (más frases de gestión, más chances de marcar al menos una). Menos que el split, más que la proporción por frase, que es inmune. Se mitiga con un catálogo balanceado y publicado, no con una fórmula.

## Precedente

El instrumento de evaluación docente más estudiado, el SEEQ de Marsh, resuelve el mismo problema por diseño: son nueve factores y **"workload/difficulty" es uno propio**, separado de organización, exámenes, trato individual y los demás; y la carga de trabajo está entre las variables que se hipotetizaron como sesgo de las otras dimensiones y contra las que las evaluaciones resultaron "relativamente inafectadas". Es exactamente "exigencia no es defecto: es información". Y nadie le pregunta al alumno a qué factor pertenece un ítem: el ítem ya viene clasificado. Ahí, como acá, la atribución es la redacción del ítem, no una pregunta.

## Refs

- [THESIS.md](../THESIS.md), decisión 2 y "Qué publicamos". [ADR-0064](0064-phrases-with-voices-not-scores.md): la unidad de publicación (proporción de voces por frase y por eje, con Wilson) que esta decisión aplica a la atribución. **Completa** a 0064.
- [Marsh, H. W. (1987). Students' Evaluations of University Teaching: Research Findings, Methodological Issues, and Directions for Future Research](https://eric.ed.gov/?id=ED338629) (los nueve factores del SEEQ, workload/difficulty entre ellos; multidimensionalidad). [Marsh & Roche (1997). Making students' evaluations of teaching effectiveness effective](https://www.researchgate.net/publication/228466142_Making_students'_evaluations_of_teaching_effectiveness_effective_The_critical_issues_of_validity_bias_and_utility) (American Psychologist 52(11): la carga de trabajo entre los sesgos hipotetizados que no afectan las demás dimensiones).
- Hallazgo G1 de la [revisión del catálogo del 2026-08-16](../history/reviews/2026-08-16-catalog.md) y hallazgo 3 de la auditoría del [product-map](../product/map.md).
