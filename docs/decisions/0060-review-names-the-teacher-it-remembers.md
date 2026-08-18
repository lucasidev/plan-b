# ADR-0060: A review names the teacher it remembers, even when the roster moved on

- **Estado**: superado por [ADR-0064](0064-phrases-with-voices-not-scores.md) (la reseña de texto libre con docente reseñado se reemplaza por la reseña de la cursada con frases y voces; la idea que sobrevive, la cátedra como sujeto propio distinto del docente, quedó recogida en el glosario del producto nuevo)
- **Fecha**: 2026-07-30

## Contexto

El producto es para **alumnos que están cursando** y quieren planificar el cuatrimestre que viene. La valoración no vive en una sección aparte: aparece donde el alumno elige comisión, que es el momento en que decide. Y el historial no se le pide por adelantado, se construye a medida que usa la aplicación.

Dentro de ese alcance, un alumno activo puede reseñar cualquier materia que recuerde, incluidas las de primer año. Es deseable que lo haga: es el corpus que hace útil al planificador.

Y ahí choca con dos validaciones de `PublishReviewCommandHandler`:

| Línea | Qué exige | Por qué falla |
|---|---|---|
| `:62` (`EnrollmentWithoutCommission`) | Que la cursada tenga comisión cargada | De una materia de hace tres años el alumno no se acuerda de la comisión, y no tiene por qué |
| `:68-72` (`TeacherNotInEnrollmentCommission`) | Que el docente nombrado esté **hoy** en el plantel de esa comisión | El docente que le dio primer año en 2022 puede no estar en el plantel de 2026 |

El problema de fondo: **el plantel de una comisión afirma el presente y la reseña habla del pasado.** No hay dato que reconcilie los dos, y no lo hay porque no existe: quién dictó qué comisión en qué cuatrimestre no lo publica la universidad, no está en ningún registro, y solo lo sabe el alumno que estuvo ahí. Es justamente el dato que la reseña viene a aportar.

## Decisión

**El catálogo confirma que el docente existe como persona. No confirma que haya dictado esa comisión.**

1. `reviewed_teacher_id` pasa a **nullable**, y se suma `reviewed_teacher_name` con el nombre tal como lo escribió el alumno. El nombre está siempre; el id está cuando se pudo resolver contra el catálogo.
2. **La comisión deja de ser obligatoria** para publicar una reseña.
3. **Los agregados del docente cuentan solo las referencias resueltas.** Una reseña que nombra a alguien todavía no linkeado se lee completa en la página de la materia, porque su testimonio vale igual, y no mueve ningún número de ningún docente, porque no se sabe de quién habla.
4. Resolver una referencia es trabajo de staff, con candidatos por similitud. Al resolverla, las reseñas que la nombran se suman solas.

**Lo que no cambia, y conviene decirlo:** la reseña sigue anclada al `EnrollmentRecord` (ADR-0005), y la materia sigue teniendo que pertenecer al plan del alumno. El alumno activo cursa un plan vigente, así que esa validación no le molesta y sí protege al corpus.

## Alternativas consideradas

### A. Mantener la validación y versionar el plantel de la comisión

Darle vigencia a `CommissionTeacher` para saber quién dictaba en cada cuatrimestre.

Descartada porque **el dato no existe**. No es caro de conseguir: no hay de dónde. La universidad no publica el plantel histórico de cada comisión, y reconstruirlo a mano para cada comisión de cada año es un proyecto sin fuente. Pedirlo como precondición para reseñar es pedirle al sistema que ya tenga lo que la reseña produce.

### B. La reseña deja de nombrar docente

Reseñar solo la materia y evitar el problema.

Descartada porque el docente es la mitad del valor. La pregunta que el alumno se hace al elegir comisión no es "cómo es Bases de Datos", es "cómo es Bases de Datos con este docente".

### C. El docente como texto libre, sin entidad

Guardar el nombre y nada más.

Descartada porque sin id no hay agregación: no habría página de docente, ni promedio, ni forma de saber que dos reseñas hablan de la misma persona. Se pierde lo que hace consultable al corpus. Esta decisión guarda el texto **y** el id cuando se puede: no es una cosa o la otra.

## Consecuencias

**Positivas:**

- El alumno reseña lo que recuerda sin que el estado actual del catálogo se lo impida. Con un producto cuyo corpus arranca vacío, cada reseña que no se pierde importa.
- El catálogo puede estar incompleto sin bloquear a nadie: falta un dato y lo que pasa es que ciertos números quedan sin poblar, no que alguien no pueda usar el producto.
- Habilita cargar una cursada vieja sin inventar una comisión, que era el otro camino por el que el alumno mentía para poder avanzar.

**Negativas:**

- **Aparece trabajo de curación que antes no existía**: las referencias sin resolver necesitan una cola en el backoffice, con candidatos por similitud (`pg_trgm`, ya instalado) y decisión humana. Ese trabajo crece con el uso.
- **Se afloja un invariante del aggregate.** El borde concreto: un docente responde una reseña porque el id la nombra, así que una reseña sin resolver no se puede responder hasta que alguien la linkee.
- Dos reseñas pueden nombrar a la misma persona con dos grafías y quedar separadas hasta que alguien las resuelva.

**Mitigaciones:**

- La degradación es lo que hace segura la decisión: si nadie trabaja la cola, el producto no se rompe, se degrada. Las reseñas siguen entrando y mostrándose; solo quedan números sin poblar.
- El contador de pendientes va a la vista en el backoffice. Una cola sin contador es una cola que nadie sabe que creció.

**Cuándo revisitar:**

- Si el volumen de referencias sin resolver crece más rápido de lo que se puede curar, evaluar resolución automática por umbral de similitud, con el riesgo de fusionar dos personas distintas.
- Si alguna vez existe una fuente institucional del plantel histórico, la validación original vuelve a ser posible y hay que decidir si conviene.

**Referencias:**

- Supera parcialmente a [ADR-0005](0005-reseña-anclada-al-enrollment.md): se retira la regla de que el docente reseñado deba pertenecer al `CommissionTeacher` de la comisión del enrollment (su Decisión, punto 3). El anclaje de la reseña al `EnrollmentRecord`, que es el corazón de ese ADR, sigue vigente.
- Relacionado con [ADR-0009](0009-anonimato-como-regla-de-presentacion.md) y [ADR-0054](0054-metrica-sin-sustento-viaja-null-nunca-cero.md): el dato se guarda completo y la presentación decide cuánto vale.
- Flujo completo en [review-lifecycle.md](../history/domain-v1/review-lifecycle.md).
