# Ubiquitous language de la versión anterior (planificador con reseñas de texto)

> **Historia (2026-08-17)**: estos términos describen la versión anterior del producto, que el código todavía contiene en retiro ([ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md), poda en [STATUS.md](../../STATUS.md)). Se sacaron del [glosario vigente](../../domain/ubiquitous-language.md) para que ese doc hable solo del producto de hoy. No se editan; se van cuando se vaya el código que nombran.

## Historial del alumno

| Término | Significado |
|---|---|
| **EnrollmentRecord** | Cursada específica del alumno. Una row por (alumno, materia, cuatrimestre). Ancla del historial y de las reseñas. |
| **status (de enrollment)** | Estado de la cursada: `cursando`, `regular`, `aprobada`, `reprobada`, `abandonada`. Son hechos observables. |
| **estado derivado** | Estado computado en query cruzando historial con correlativas: `disponible para cursar`, `bloqueada por correlativas`. No se persiste. |
| **approval_method** | Cómo se aprobó: `cursada` (promoción directa), `promocion`, `final`, `final_libre`, `equivalencia`. Solo aplica si `status = 'aprobada'`. |
| **equivalencia** | Aprobación por reconocimiento académico de otra carrera o universidad. Sin `commission_id` ni `term_id`. |
| **recursada** | Cursar una materia reprobada. Genera un `EnrollmentRecord` nuevo con otro `term_id`, sin tocar el anterior. |
| **regular / regularizar** | Cursada finalizada con los trabajos prácticos/parciales aprobados pero sin rendir el final. Habilita `para_cursar` de correlativas dependientes. |
| **HistorialImport** | Staging del output del parser de PDF/texto antes de normalizar a `EnrollmentRecord`. Guarda el crudo en JSONB para reprocesar. |


## Planificador

> **En retiro** (ADR-0063): esta sección describe el planificador de la versión anterior. Válida mientras el módulo `planning` y `/plan` existan; se elimina con la poda.

| Término | Significado |
|---|---|
| **Planificador** | La herramienta con la que el alumno arma su período académico. Vive en `/plan` (UI "Planificar"). Planifica el **período en curso** y permite crear **borradores** de períodos futuros. **No se llama "simulador"**: simular es una acción dentro del planificador, no el nombre de la herramienta. |
| **período (de planificación)** | La unidad que el planificador arma: un `AcademicTerm` de la universidad del alumno. Su cadencia la define el régimen de la universidad (`term_kind`): bimestre, cuatrimestre, semestre o año. **Año y semestre pueden ser el mismo período** según la universidad, y el planificador los trata como lo mismo: un único concepto de período, sin flujos separados por cadencia. |
| **en curso** | El plan del período actual del alumno. Se edita en el planificador (tab "En curso"); no es un borrador. |
| **borrador** | Plan de un período que **no es el actual** o es uno futuro. Crear y ajustar borradores es **simular**. Es el `SimulationDraft` cuando se persista (US-023); hoy vive solo en la sesión. |
| **simular** | Armar y evaluar un borrador de un período no actual: elegir materias, ver carga/dificultad/cohorte sin inscribirse a nada. Es una **capacidad del planificador**, no su nombre. Los identificadores `EvaluateSimulation` y `/api/me/simulator/*` nombran esta acción. |
| **simulación** | Combinación de materias que el alumno está considerando cursar el período que viene. Es una **intención**, no un hecho: no lo inscribe a nada ni queda registrada como cursada. Esa distinción entre futuro e pasado es la razón de que Planning sea un BC separado de Enrollments ([ADR-0029](../../decisions/0029-planning-bc-separado.md)). |
| **SimulationDraft** | La simulación guardada. Aggregate del BC Planning. **Todavía no existe**: US-016 evalúa sin persistir nada; la persistencia llega con US-023, que es premium ([ADR-0028](../../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md)). |
| **materia disponible** | Materia del plan que el alumno puede cursar el próximo período: tiene todas sus correlativas `para_cursar` regularizadas o aprobadas, y no la aprobó, regularizó ni la está cursando. |
| **materia bloqueada** | Materia que no puede cursar porque le falta alguna correlativa `para_cursar`. El sistema siempre informa **cuáles** faltan: "no podés" sin el motivo no le sirve al alumno para decidir qué hacer. |
| **combinación** | El conjunto de materias de una simulación. Dos combinaciones son la misma si tienen exactamente las mismas materias, sin importar el orden en que se eligieron. |
| **cohorte** (planificador) | Los alumnos que cursaron **exactamente la misma combinación** de materias en un mismo período. Se retira con el planificador: en el producto nuevo "cohorte" es la camada de ingreso (ver [El producto nuevo](#el-producto-nuevo-qué-recabamos)). |
| **muestra mínima** | Piso de alumnos por debajo del cual no se muestran las tasas de una cohorte (5, [ADR-0047](../../decisions/0047-pass-rate-publico-desde-historial-privado.md)). Con menos, el dato permitiría deducir el resultado académico de un compañero puntual. El **tamaño** de la muestra sí se muestra siempre: un porcentaje sin saber sobre cuántos casos se calculó es peor que no mostrar nada. |


## Reseñas y moderación (versión anterior, en retiro)

| Término | Significado |
|---|---|
| **Review** | Reseña de una cursada específica. Anclada a un `EnrollmentRecord` finalizado (no `cursando`). Una por enrollment. |
| **docente_reseñado** | El `Teacher` al que apunta el texto libre del docente dentro de la reseña. Debe pertenecer al `CommissionTeacher` de la comisión del enrollment. |
| **difficulty_rating** | Rating de dificultad global de la cursada, 1-5. Input del planificador para promedios combinados. |
| **ReviewReport** | Reporte de un usuario sobre una reseña (spam, datos personales, lenguaje inapropiado, difamación). Múltiples reportes posibles sobre una misma reseña. |
| **TeacherResponse** | Respuesta pública de un `Teacher` verificado a una reseña donde fue el `docente_reseñado`. Una por reseña. |
| **ReviewAuditLog** | Log inmutable de cambios sobre una reseña (edit, report, remove, restore) con diffs en JSONB. Uso interno de moderación y auditoría. |
| **moderación reactiva** | Política de moderación: las reseñas se publican automáticamente; los moderadores intervienen solo cuando hay reportes o el filtro automático marca. |
| **filtro automático** | Chequeo básico al publicar (insultos, links sospechosos, longitudes anómalas). Si marca, `Review.status = 'under_review'`. |
| **under_review** | Estado de reseña en cola de moderación. No es visible al público hasta que un moderador decide. |
| **anonimato** | Regla de **presentación** (no de storage): la identidad del reseñador siempre se conserva en DB, nunca se expone en la capa pública. Permite moderación y cumplimiento judicial. |


## Búsqueda semántica e infraestructura analítica

> Diseño diferido: la revisión (2026-07-26) de [ADR-0007](../../decisions/0007-pgvector-implementado-ui-gated-off.md) borró el andamiaje (extensión pgvector, entidad, pipeline) hasta que exista un consumidor real. Los términos de esta sección describen ese diseño, no algo implementado hoy.

| Término | Significado |
|---|---|
| **ReviewEmbedding** | Vector (768 dims) del texto de una reseña. Generado con modelo open source `intfloat/multilingual-e5-base` ejecutado local. |
| **model_name / model_version** | Identifica qué modelo produjo un embedding. Permite convivencia de múltiples embeddings por reseña cuando cambiamos de modelo. |
| **gated feature** | Feature implementada en código pero no expuesta en UI hasta que se cumple una condición (ej. volumen mínimo de reseñas para que el clustering tenga señal). |


## Actores y sus boundaries de responsabilidad

| Actor | Qué puede hacer | Qué NO puede hacer |
|---|---|---|
| **Visitante anónimo** | Leer reseñas publicadas, ver catálogo de carreras/materias/docentes. | Publicar, reportar, simular. |
| **Alumno** (member + StudentProfile) | Gestionar historial propio, simular inscripciones, publicar/editar reseñas, reportar contenido, responder como docente si además tiene TeacherProfile verificado. | Moderar reseñas de otros. Ver identidad de otros reseñadores. |
| **Docente verificado** (member + TeacherProfile verificado) | Responder públicamente a reseñas donde fue el `docente_reseñado`. Editar su respuesta. | Ver identidad del reseñador. Moderar reseñas. Remover reseñas sobre él. |
| **Moderador** | Ver cola de reviews `under_review`, resolver reports, remover reseñas, ver identidad de reseñadores para detectar abuso. | Publicar reseñas. Responder como docente. Editar contenido ajeno. |
| **Admin** | Todo lo del moderator + gestión de catálogo académico + alta/baja de cuentas staff + verificación manual de docentes. | Editar reseñas ajenas (solo remover con motivo). |
| **University staff** | Dashboard institucional con agregados de su universidad únicamente. | Ver identidades individuales. Acceso a reseñas sin agregar. Acceso a datos de otra universidad. |

## Desambiguación (filas de la versión anterior)

| Término | Uso incorrecto | Uso correcto |
|---|---|---|
| **reseña** | Usado como sinónimo de "reporte" | `Review` ≠ `ReviewReport`. Reseña es contenido publicado por un alumno. Reporte es una denuncia contra una reseña. |
| **sin datos** | Mostrar `0` cuando una métrica todavía no tiene reseñas que la sustenten | `0.0/5` se lee "facilísima" y `0%` se lee "no la recomienda nadie": son mediciones, no ausencia de dato. Una métrica sin sustento dice **`sin datos`** (`NO_DATA_YET` en `lib/copy.ts`), nunca `s/d`, que es una abreviatura que la app nunca definió. |
| **estado de materia** | "Lo que muestra la UI (disponible/bloqueada/cursando/etc.)" | La UI muestra una mezcla de estados persistidos (`status` del enrollment) y estados derivados (computados desde correlativas). Solo los persistidos son "status" en el modelo. |
| **simulación** | "Una inscripción" | No inscribe a nada ni reserva un cupo: es una combinación que el alumno está evaluando. Lo que registra un hecho es el `EnrollmentRecord`. |
| **simulador** | "El nombre de la herramienta de planificación" | La herramienta es el **Planificador** (`/plan`, UI "Planificar"). Simular es la acción de armar borradores de períodos no actuales dentro de él. Los identificadores de esa acción (`EvaluateSimulation`, `/api/me/simulator/*`) son correctos; llamar "simulador" a la herramienta, no. |
