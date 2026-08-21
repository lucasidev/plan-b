# ADR-0061: Ratings aggregate by commission, and roll up only when coverage backs them

- **Estado**: superado por [ADR-0064](0064-phrases-with-voices-not-scores.md) y [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (los ratings por comisión se reemplazan por frases con voces; la derivación de carrera e institución y el gate de cobertura, que acá quedó sin umbral, quedan fijados: más de la mitad de las materias del plan con voces)
- **Fecha**: 2026-07-31

## Contexto

El alumno **no elige si cursa una materia**: está en su plan y tarde o temprano la cursa. Lo único que elige de verdad es **cuándo** y **en qué comisión**. Esa segunda elección es la única pantalla donde el producto puede darle algo que la universidad no le da.

Y es justo la pantalla que hoy no tiene nada. El planificador le entrega esto al elegir comisión:

```
AvailableCommissionItem(Id, Name, Modality, Capacity, TeacherNames, Schedule)
```

Nombre, modalidad, cupo, quiénes dan y horarios. Todo eso la facultad también lo publica. Cero señal de reseñas.

Del otro lado, los agregados que existen responden por materia (`DapperSubjectInsightsQueryService`, `DapperSubjectPassRateReader`) o por docente (`DapperTeacherInsightsQueryService`), nunca por la combinación. "Cómo es este docente en general" mezcla las tres materias distintas que da, y no es la pregunta que alguien se hace parado en el picker.

Hace falta decidir dos cosas que se confunden pero son distintas: **sobre qué se agrega abajo**, y **cómo (y si) eso sube** a carrera y universidad.

## Decisión

**La valoración se agrega por (materia, comisión). Sube a carrera y universidad solo cuando la cobertura la respalda.**

1. **La unidad es la comisión, no el docente.** El alumno se inscribe en una comisión; el docente es lo que esa comisión tiene este cuatrimestre.

2. **La vigencia del plantel se mide y se muestra, no se esconde.** Cada agregado por comisión informa **cuántas de sus reseñas nombran al docente que dicta hoy**, comparando `reviewed_teacher_name` contra el plantel actual. Treinta reseñas de las cuales tres corresponden al docente actual siguen siendo un dato, y el lector sabe cuánto de él le aplica.

3. **Carrera y universidad llevan puntaje calculado**, de abajo hacia arriba: la carrera promedia las materias de su plan que tienen puntaje, la universidad promedia sus carreras que tienen puntaje.

4. **El gate de esos dos niveles es cobertura, no muestra.** Si el plan tiene 40 materias y solo 3 tienen puntaje, el de la carrera viaja `null` ([ADR-0054](0054-a-metric-without-backing-travels-null-never-zero.md)). Cuando el número sale, sale **junto a la cobertura que lo respalda**. Los niveles de abajo siguen con el piso de muestra de [ADR-0047](0047-public-pass-rate-from-private-enrollment-history.md), que cuenta personas y no reseñas ponderadas.

**Lo que habilita el punto 2, y conviene decirlo:** [ADR-0060](0060-review-names-the-teacher-it-remembers.md) dejó que la reseña guarde **siempre** el nombre del docente que el alumno nombró, resuelto contra el catálogo o no. Eso convierte al corpus de reseñas en la única fuente del plantel histórico, que ningún registro publica. La vigencia es medible porque las reseñas reconstruyen lo que el catálogo no sabe.

## Alternativas consideradas

### A. Agregar por (materia, docente)

Atar la valoración al docente, y que la comisión sea apenas el camino para llegar a él.

Es tentador porque el docente es lo que se está juzgando, y porque sobrevive a que lo muevan de comisión. Descartada porque **la pregunta del alumno es sobre la comisión**: es en lo que se inscribe, y lo que elige incluye horario y modalidad, que son de la comisión y no del docente. Un agregado por docente además obliga al lector a hacer el cruce mental de qué comisión da ese docente este cuatrimestre, que es trabajo que el producto tiene que hacer por él.

### B. Agregar por comisión sin medir la vigencia del plantel

La versión simple del punto 1: promediar todas las reseñas de la comisión y listo.

Descartada porque **envejece en silencio**, que es el peor modo de falla. Si comisión 1 tiene treinta reseñas y veinticinco son de cuando la daba otro docente que ya no está, el número describe algo que el alumno no va a cursar, y nada en la pantalla se lo dice. Y no se puede resolver por el catálogo: [ADR-0060](0060-review-names-the-teacher-it-remembers.md) estableció que el plantel histórico de una comisión no existe en ningún registro.

### C. Puntaje de carrera y universidad como promedio simple de lo que haya

Promediar las materias con puntaje, sin mirar cuántas del plan quedaron afuera.

Descartada porque el número queda **dominado por cuáles materias tienen reseña**, no por la carrera. Con corpus chico, "la carrera vale 3.2" en realidad dice "las tres materias que alguien se tomó el trabajo de reseñar eran duras". Es peor que no tener el número, porque parece un dato.

### D. No tener puntaje de carrera ni de universidad, solo cobertura

Mostrar cuántas materias tienen reseña, cuántos docentes, qué tan fresco está el corpus, y ningún promedio institucional.

Se argumentó a favor: nadie elige universidad con planb (ya está inscripto, la pregunta no existe), promedia cosas incomparables, y es un ranking público de instituciones publicado por un proyecto que una de esas instituciones co-posee.

**Descartada por decisión del dueño del proyecto**, con el gate del punto 4 como la condición que la hace defendible: el número existe, no se muestra sin respaldo, y cuando se muestra viaja con la cobertura al lado. La cobertura no desaparece: deja de ser el reemplazo del puntaje y pasa a ser su gate y su contexto.

## Consecuencias

**Positivas:**

- La pantalla donde el alumno decide deja de mostrar solo lo que la facultad ya publica.
- El número no envejece sin avisar: el cambio de docente se ve en el mismo lugar donde se lee el promedio.
- El corpus de reseñas empieza a valer como reconstrucción del plantel histórico, que es un dato que no existe en ninguna otra parte.
- El puntaje institucional no puede mentir por omisión: sin cobertura no hay número.

**Negativas:**

- **Un agregado más que mantener.** A materia y docente se suma comisión, y el de comisión es el que más se va a consultar (vive en el picker), así que es el que más presión de performance tiene.
- **La comisión con docente nuevo arranca sin señal útil**, aunque la materia tenga corpus. Es correcto y es incómodo: el alumno ve "30 reseñas, 0 del docente actual" y tiene que decidir igual.
- **El puntaje de carrera y universidad va a estar `null` por mucho tiempo.** Con 40 materias por plan, la cobertura necesaria tarda. Hay que sostener la disciplina de no bajar el piso para que "se vea algo".
- **La comparación de `reviewed_teacher_name` contra el plantel es por texto**, con los errores de tipeo y las variantes de nombre que eso arrastra. Es la contracara de que ADR-0060 acepte referencias sin resolver.

## Refs

- [ADR-0047](0047-public-pass-rate-from-private-enrollment-history.md): piso de muestra y disclaimer de auto-reporte.
- [ADR-0054](0054-a-metric-without-backing-travels-null-never-zero.md): la métrica sin sustento viaja `null`, nunca su valor neutro.
- [ADR-0060](0060-review-names-the-teacher-it-remembers.md): la reseña guarda siempre el nombre del docente, resuelto o no.
- US: [US-098](../history/domain-v1/stories/US-098.md) implementa el agregado por comisión y su lectura en el picker.
