# ADR-0090: An official datum is a dated claim with value, source and status

- **Estado**: propuesto (2026-09-07), para que R6 construya sobre esto una vez que Lucas apruebe el modelo y las pantallas
- **Fecha**: 2026-09-07

## Contexto

[ADR-0085](0085-three-instruments-and-official-data.md) decidió que los datos oficiales van al lado de las voces con su fuente y su fecha, y que la transparencia relevada "necesita su propia tabla (afirmación, estado, fuente, fecha)". Un año de sprints después no hay entidad, tabla ni pantalla para eso ([campo por campo](../history/reviews/2026-09-07-official-data-fields.md), F03), y el [recorrido de Valentina](../history/reviews/2026-09-07-valentina-walk.md) dejó a la vista que sin ellos la persona que el producto existe para servir no puede elegir dónde estudiar (V01, V02, V04).

El [relevamiento de fuentes](../history/reviews/2026-09-07-official-data-sources.md) y el de las [cuatro carreras sembradas](../history/reviews/2026-09-07-official-data-survey.md) mostraron cómo son esos datos en la realidad:

- **Ningún dato de carrera viene de una sola fuente ni con la misma forma.** El plan y su duración salen del sitio institucional y de SIPES (la resolución ministerial); el egreso y la duración real, por carrera, no están publicados en ninguna fuente pública: la SPU publica series por institución y por disciplina, y el sistema de consulta que las abría por título ya no está en línea.
- **El mismo campo cambia de significado con el nivel.** "Acreditación" es CONEAU para el grado y no existe para el pregrado, donde lo que hay es la validez nacional del título por resolución.
- **Lo que no está publicado también es un dato.** Que una universidad privada no publique nómina ni presupuesto, que la SPU no publique cohortes, o que el sitio de una facultad no responda el día del relevamiento, es exactamente lo que la ficha de institución tiene que decir con fecha.
- **Las fuentes publican más de lo que la tesis pidió** (ingresantes por año y por disciplina, modalidad, cargos docentes por dedicación, autoridades, auditorías, cupos, fechas de inicio) y algo de eso va a entrar cuando Lucas lo elija, sin que cada dato nuevo sea una migración.

Cinco columnas fijas en `Career` no pueden decir "no publicado", no pueden cargar dos fuentes que no cierran entre sí (la resolución de SIPES y la del sitio de la facultad), y no aguantan un dato nuevo sin migrar.

## Decisión (propuesta)

**Un dato oficial es una afirmación fechada: un sujeto, un campo, un valor con su unidad, el período al que refiere, la fuente de la que salió, la fecha en que se relevó y el estado que dice cuánto vale.**

### El modelo

Una entidad `OfficialFact` en el módulo `academic`, sin navegación cruzada ([ADR-0017](0017-persistence-ignorance.md)):

| Campo | Qué guarda |
|---|---|
| `Subject` | A qué se afirma: la **institución**, la **unidad académica** (que entra como entidad con esto, como ADR-0085 pidió) o la **oferta** (una carrera en una institución). El sujeto se guarda como tipo más id. |
| `Field` | El código del campo, en inglés, de un vocabulario curado en código: `paper_duration`, `real_duration`, `cohort_graduation`, `current_plan`, `accreditation`, `national_validity`, `admission_regime`, `minutes_published`, `budget_published`, `staff_roster_published`, `interim_share`, `institutional_evaluation`, `institution_type`, `academic_unit`, y los que el relevamiento agregue. El vocabulario es abierto: un código nuevo es una constante nueva y una regla de render, no una migración. |
| `Value` + `Unit` | El valor tal como se publica: un número con su unidad (`years`, `percent`, `count`, `currency_ars`), un texto (la resolución, el régimen), un booleano (publicado o no), o una fecha. Se guarda como texto tipado más unidad, no como cinco columnas opcionales. |
| `Period` | A qué período refiere el dato (un año, un rango, una cohorte), distinto de cuándo se relevó. |
| `Source` | Nombre de la fuente, URL exacta, documento o cuadro dentro de la fuente, y la fecha en que se bajó la muestra. Obligatoria aunque el estado sea "no publicado": ahí la fuente es dónde se buscó. |
| `Status` | `Published` (el valor está tal cual en la fuente), `Derived` (calculado con una regla escrita, con el id de la regla), `NotPublished` (se buscó y no está, con la fecha), `Requested` (se pidió por Ley 27.275 o al DIU, con la fecha), `NotApplicable` (el campo no existe para ese sujeto, con la razón). |
| `Note` | Una frase para la ficha cuando el estado lo necesita ("las tecnicaturas no se acreditan: el título tiene validez nacional por RM 2495/2018"). |
| `RelievedAt`, `RelievedBy` | La fecha del relevamiento y quién lo hizo (el registro de [US-216](../product/team/cut-the-access/stories/US-216-log-author-and-date-per-action/README.md)). |

Varias afirmaciones pueden convivir para el mismo sujeto y campo (dos fuentes que no cierran, dos períodos): la ficha muestra la vigente y Método muestra la historia. No hay `IsOfficial` en ningún otro lado: `Career.DurationYears` y `CareerPlan.IsOfficial` se migran a afirmaciones con su fuente o se retiran.

### Las reglas de los derivados

Cada `Derived` cita una regla escrita en Método, con su fórmula, sus insumos y sus sesgos. La primera, del relevamiento: **el egreso por cohorte no está publicado por carrera; el proxy de flujo es egresados del año t sobre nuevos inscriptos del año t menos la duración en el papel, por institución o por disciplina, y sesga hacia abajo cuando la matrícula crece.** Un derivado nunca se muestra con la forma de un dato publicado: lleva su etiqueta y su link a la regla.

### Las pantallas

- **Ficha de carrera** ([SC-001](../product/student/choose-where-to-study/screens/SC-001-career/README.md)): el bloque de datos oficiales muestra los seis campos de la oferta, cada uno con su valor y "Fuente · período" al lado, o con lo que su estado dice: "No publicado: la SPU no publica egreso por carrera; pedido a la universidad el [fecha]", "Derivado: proxy de flujo, ver Método", "No aplica: las tecnicaturas no se acreditan; validez nacional por RM 2495/2018". El régimen de ingreso entra a esta ficha (F02). Nunca un espacio en blanco, nunca un número sin fuente.
- **Dónde estudiarla** ([SC-008](../product/student/choose-where-to-study/screens/SC-008-where-to-study/README.md)): la misma carrera canónica en las instituciones de la ciudad, los mismos seis campos con la misma forma por tarjeta, cada celda con su estado; sin compuesto ni ganador; con una sola oferta cargada, "no hay con qué comparar todavía". Los sesgos de un derivado se dicen una vez, arriba, y no por tarjeta.
- **Ficha de institución** ([SC-005](../product/reviewed/reply/screens/SC-005-institution/README.md)): el checklist de transparencia son afirmaciones con sujeto institución (o unidad académica), una fila por campo con su estado y su fecha, y "Ver fuentes" lista las URL relevadas.
- **Método** ([SC-021](../product/student/take-the-data/screens/SC-021-method/README.md)): las reglas de los derivados, en idioma de estudiante, y la lista de fuentes con su cadencia.
- **Backoffice**: Sofía carga y corrige afirmaciones desde el Catálogo, con la fuente obligatoria ([US-194](../product/team/sustain-the-catalog/stories/US-194-check-a-correction-against-the-source/README.md), [US-202](../product/team/sustain-the-catalog/stories/US-202-mark-a-field-as-unofficial-source/README.md)); una afirmación sin fuente no se guarda.

### El proceso

R6 carga a mano las afirmaciones de las cuatro carreras sembradas desde el relevamiento, por seed y por el backoffice. No se scrapea nada: las fuentes son formularios con sesión (SIPES, la Guía SIU), grillas con postback (CONEAU) o PDF sin texto (la Síntesis), y el valor del dato está en la verificación editorial, no en bajarlo. La única importación que vale la pena automatizar cuando haya más de una ciudad es la del anuario de la SPU (XLSX y CSV, una vez por año); la API de la AGN queda anotada para el checklist de auditorías.

## Alternativas consideradas

**Cinco columnas fijas en `Career` (duración real, egreso, plan, acreditación, ingreso).** Es lo que el código insinúa con `DurationYears`. No puede decir "no publicado" ni "derivado", no carga fuente ni período, y cada dato nuevo del inventario es una migración. Descartada.

**Un `key-value` genérico sin estado ni fuente.** Aguanta cualquier dato pero no puede cumplir la única regla que la tesis pone: ningún dato oficial sin fuente y fecha. Descartada.

**Scrapear primero y modelar después.** Las fuentes son frágiles y el dato que importa (egreso, duración real) no está en ninguna; el scraping traería lo que no hace falta y no traería lo que falta. Descartada.

**Guardar el dato en el plan (`CareerPlan`).** Mezcla dos cosas: el plan es una pieza del catálogo con materias; el dato oficial es una afirmación sobre la oferta, con vida propia y varias fuentes. Descartada.

## Consecuencias

- `academic` gana `AcademicUnit` y `OfficialFact` con su tabla, su read Dapper para las fichas y su endpoint de carga con policy de admin.
- La ficha de carrera, Dónde estudiarla (nueva) y la ficha de institución cambian de forma; Método gana la sección de reglas y fuentes; el Catálogo gana la carga de afirmaciones.
- El vocabulario de campos vive en código, en inglés, y cada código tiene su regla de render; el glosario nombra cada campo en español una sola vez.
- `Career.DurationYears` y `CareerPlan.IsOfficial` se retiran cuando sus afirmaciones existan.
- Las stories del checklist de transparencia (F01) y el proxy de egreso (regla escrita) entran a R6 con este ADR como contrato técnico.
