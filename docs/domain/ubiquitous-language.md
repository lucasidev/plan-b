# Ubiquitous Language (planb)

Glosario de términos del dominio. Es la referencia autoritativa para el uso de cada término en código, UI, documentación y conversación con stakeholders. Si un término aparece acá con un significado específico, no se usa con otro significado en otro lado.

Basado en los principios de DDD (Eric Evans). Cuando aparecen nuevos términos en conversación o código, se agregan acá antes de propagarse.

## Convenciones generales

- **Identificadores en código** (clases, tablas, propiedades): inglés. C# → `PascalCase`, SQL → `snake_case`, TypeScript → `camelCase`.
- **Strings de UI**: español rioplatense.
- **Mensajes de error internos** (logs, excepciones, códigos de error): inglés.
- **Documentación y ADRs**: narrativa en español, nombres de entidades en inglés cuando referencia al modelo (ej. "el `EnrollmentRecord` tiene estado `aprobada`").

## Producto, landing y datos

La distinción que se venía mezclando: los **datos de prueba** llenan la **aplicación** real (las herramientas funcionando); los **datos demo** ilustran esas herramientas en la **landing** (venta). No se cruzan: la landing no lee datos del backend.

| Término | Significado |
|---|---|
| **producto / aplicación** | El sistema real, plan-b (backend + frontend). Contiene las herramientas y los features de plataforma. Se prueba y se muestra cargándole datos de prueba. |
| **herramienta** | Feature de valor que un actor (alumno, docente, staff) usa para su tarea: Reseñas, Mi carrera (mapa de la carrera), Planificador, moderación, gestión de catálogo. Se nombran como las nombra la app. No es cualquier feature: los de plataforma (registro, login, recuperar contraseña, gestión de cuenta) habilitan el uso pero no son herramientas. |
| **landing** | La cara de venta del producto (marketing). Ilustra las herramientas con datos demo y puede idealizar. Es pública, pero eso no la define: hay herramientas públicas también (catálogo, reseñas de una materia). Lo que la separa es que ilustra, no ejecuta. |
| **datos de prueba** | Datos sembrados en la DB para probar y mostrar la aplicación real funcionando (desarrollo, tests, defensa ante el tribunal). Los consumen los endpoints reales. Implementados como el `SeedCorpus` en el host (gateado por `PLANB_SEED_CORPUS`) más los seeders por módulo (`AuthorsSeeder`, `EnrollmentsSeeder`, `ReviewsSeeder`). |
| **datos demo** | Datos de ejemplo hardcodeados en la UI de la landing (componentes `demo-*`), para ilustrar las herramientas. Marketing: no viven en el backend, no se fetchean, no pretenden exactitud. |

## Identidades y cuentas

| Término | Significado | Ubicación |
|---|---|---|
| **User** | Cuenta con credenciales (email, password). Rol único, inmutable después de creado salvo intervención admin. | `User` |
| **role** | Tipo funcional del usuario. Enum exclusivo. No acumulable. | `User.role` |
| **member** | Rol de usuario de comunidad académica. Puede tener perfiles de alumno y/o docente. Sin acceso administrativo. | `role = 'member'` |
| **moderator** | Rol staff para resolver reports y remover contenido inapropiado. No puede tener StudentProfile ni TeacherProfile. | `role = 'moderator'` |
| **admin** | Rol staff con permisos totales: moderación + gestión de catálogo académico + alta/baja de staff. | `role = 'admin'` |
| **university_staff** | Rol de cliente comercial. Accede al dashboard institucional con datos agregados de su universidad únicamente. | `role = 'university_staff'` |
| **StudentProfile** | Perfil de alumno vinculado a un `CareerPlan` específico. Un `member` puede tener múltiples (una por carrera cursada). | `StudentProfile` |
| **TeacherProfile** | Claim de identidad docente por parte de un `member`. Debe verificarse para activarse. | `TeacherProfile` |
| **verified (docente)** | `TeacherProfile` con `verified_at NOT NULL`. Única condición para responder reseñas. | |
| **verification_method** | Forma en que se verificó el `TeacherProfile`: `institutional_email` (automática) o `manual` (admin revisa evidencia). | `TeacherProfile.verification_method` |

## Dominio académico

| Término | Significado |
|---|---|
| **University** | Universidad. Entidad raíz del catálogo académico. Ej: UNSTA, SIGLO 21, USPT. |
| **institutional_email_domains** | Array de dominios de email válidos para verificación automática de docentes de la universidad. Ej: `['unsta.edu.ar']`. |
| **Career** | Carrera como concepto institucional estable. Ej: "Tecnicatura Universitaria en Desarrollo y Calidad de Software". |
| **CareerPlan** | Plan de estudios de una carrera para un año particular (`year`), con materias propias y un `label` editorial opcional. Ej: "Plan 2019", "Plan 2024". |
| **plan vigente** | `CareerPlan` con `status = Active`. Es el que se le ofrece a nuevos ingresantes; el plan anterior pasa a `Deprecated` pero sigue existiendo para los alumnos que ya lo cursan. |
| **Subject** | Materia. Pertenece a un `CareerPlan`. Tiene `year_in_plan` (año del plan), `term_kind` y `term_in_year`. |
| **carga horaria semanal** | `weekly_hours`: horas de cursada por semana. Rango 0 a 40. **0 no significa "sin trabajo"**: significa que la materia no tiene horario semanal fijo, como Proyecto Final (0 hs/sem y 350 totales en la TUDCS), una práctica profesional o una tesis. El techo de 40 es una jornada laboral completa; más que eso es un dato cargado mal. |
| **carga horaria total** | `total_hours`: horas de la materia en todo su período. Siempre positiva (una materia sin horas no existe) y nunca menor que la semanal. Es el número que el plan de estudios publica al lado de cada materia. |
| **Prerequisite** | Correlativa. Relación entre dos `Subject` del mismo plan con un `type`. |
| **para_cursar** | Tipo de correlativa: requiere que la materia requerida esté **regularizada** para inscribirse a la dependiente. |
| **para_rendir** | Tipo de correlativa: requiere que la materia requerida esté **aprobada** para rendir el final de la dependiente. |
| **Teacher** | Docente. Entidad del catálogo académico precargada, asociada a una universidad. Existe independientemente de si hay un `User` que la reclamó. |
| **Commission** | Comisión. Oferta concreta de una `Subject` en un `AcademicTerm`. Tiene nombre (A, B, Com 1), modalidad, capacidad. |
| **CommissionTeacher** | Asignación M:N entre `Teacher` y `Commission` con `role` (titular, adjunto, JTP, ayudante, invitado). |
| **AcademicTerm** | Período lectivo de una universidad. Tiene un `kind` (bimestral, cuatrimestral, semestral, anual) que define su duración. Ej: "2026-C1". |
| **term_kind** | Cadencia del período: `bimestral`, `cuatrimestral`, `semestral`, `anual`. Genérico para soportar universidades con distintos calendarios. |
| **cadencia (cómo se dice en la UI)** | `term_kind` mostrado al usuario: "1er cuatrimestre", "3er bimestre", "anual"; forma corta "1er cuatri". **Nunca codificada en letras** (`1c`, `3b`, `1s`): esas abreviaturas no están definidas en ninguna pantalla y no significan nada para quien las lee por primera vez. Fuente única: `frontend/src/lib/academic-terms.ts` ([ADR-0051](../decisions/0051-vocabulario-academico-canonico-en-la-ui.md)). |
| **período (cómo se dice en la UI)** | Un `AcademicTerm` mostrado al usuario: "2025 · 2do cuatrimestre". No confundir con el `label` que se persiste ("2025-C1"): ese es un identificador estable del período, no copy. Cambiar cómo se lee un período no debería reescribir filas. |

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

| Término | Significado |
|---|---|
| **Planificador** | La herramienta con la que el alumno arma su período académico. Vive en `/plan` (UI "Planificar"). Planifica el **período en curso** y permite crear **borradores** de períodos futuros. **No se llama "simulador"**: simular es una acción dentro del planificador, no el nombre de la herramienta. |
| **período (de planificación)** | La unidad que el planificador arma: un `AcademicTerm` de la universidad del alumno. Su cadencia la define el régimen de la universidad (`term_kind`): bimestre, cuatrimestre, semestre o año. **Año y semestre pueden ser el mismo período** según la universidad, y el planificador los trata como lo mismo: un único concepto de período, sin flujos separados por cadencia. |
| **en curso** | El plan del período actual del alumno. Se edita en el planificador (tab "En curso"); no es un borrador. |
| **borrador** | Plan de un período que **no es el actual** o es uno futuro. Crear y ajustar borradores es **simular**. Es el `SimulationDraft` cuando se persista (US-023); hoy vive solo en la sesión. |
| **simular** | Armar y evaluar un borrador de un período no actual: elegir materias, ver carga/dificultad/cohorte sin inscribirse a nada. Es una **capacidad del planificador**, no su nombre. Los identificadores `EvaluateSimulation` y `/api/me/simulator/*` nombran esta acción. |
| **simulación** | Combinación de materias que el alumno está considerando cursar el período que viene. Es una **intención**, no un hecho: no lo inscribe a nada ni queda registrada como cursada. Esa distinción entre futuro e pasado es la razón de que Planning sea un BC separado de Enrollments ([ADR-0029](../decisions/0029-planning-bc-separado.md)). |
| **SimulationDraft** | La simulación guardada. Aggregate del BC Planning. **Todavía no existe**: US-016 evalúa sin persistir nada; la persistencia llega con US-023, que es premium ([ADR-0028](../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md)). |
| **materia disponible** | Materia del plan que el alumno puede cursar el próximo período: tiene todas sus correlativas `para_cursar` regularizadas o aprobadas, y no la aprobó, regularizó ni la está cursando. |
| **materia bloqueada** | Materia que no puede cursar porque le falta alguna correlativa `para_cursar`. El sistema siempre informa **cuáles** faltan: "no podés" sin el motivo no le sirve al alumno para decidir qué hacer. |
| **combinación** | El conjunto de materias de una simulación. Dos combinaciones son la misma si tienen exactamente las mismas materias, sin importar el orden en que se eligieron. |
| **cohorte** | Los alumnos que cursaron **exactamente la misma combinación** de materias en un mismo período. Responde "¿cómo les fue a otros que se anotaron a esto mismo?". Ver la desambiguación: no es la camada de ingreso. |
| **muestra mínima** | Piso de alumnos por debajo del cual no se muestran las tasas de una cohorte (5, [ADR-0047](../decisions/0047-pass-rate-publico-desde-historial-privado.md)). Con menos, el dato permitiría deducir el resultado académico de un compañero puntual. El **tamaño** de la muestra sí se muestra siempre: un porcentaje sin saber sobre cuántos casos se calculó es peor que no mostrar nada. |

## Reseñas y moderación

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

| Término | Significado |
|---|---|
| **ReviewEmbedding** | Vector (768 dims) del texto de una reseña. Generado con modelo open source `intfloat/multilingual-e5-base` ejecutado local. |
| **model_name / model_version** | Identifica qué modelo produjo un embedding. Permite convivencia de múltiples embeddings por reseña cuando cambiamos de modelo. |
| **gated feature** | Feature implementada en código pero no expuesta en UI hasta que se cumple una condición (ej. volumen mínimo de reseñas para que el clustering tenga señal). |

## Desambiguación

Términos que se prestan a confusión. La columna "Uso correcto" es la regla que aplicamos en todo el proyecto.

| Término | Uso incorrecto | Uso correcto |
|---|---|---|
| **docente** | "Un rol de usuario" | Se refiere a `Teacher` (entidad catálogo) o a un `TeacherProfile` verificado. Nunca es un `role` de `User`. |
| **alumno** | "Un rol de usuario" | Se refiere a un `member` con `StudentProfile`. El rol es `member`. |
| **rol** | "Algo que un usuario puede tener varios a la vez" | Un `User` tiene exactamente un `role` del enum. Los profiles suman **capacidades**, no roles. |
| **carrera** | "Un plan de estudios específico" | `Career` es el concepto estable. `CareerPlan` es la versión específica. Un alumno cursa una `Career` bajo un `CareerPlan` determinado. |
| **reseña** | Usado como sinónimo de "reporte" | `Review` ≠ `ReviewReport`. Reseña es contenido publicado por un alumno. Reporte es una denuncia contra una reseña. |
| **comisión** | "Cursada del alumno" | `Commission` es la oferta (materia + cuatrimestre + docentes). `EnrollmentRecord` es la cursada específica del alumno en esa comisión. |
| **cuatrimestre** | Como sinónimo de cualquier período | `AcademicTerm` generaliza a bimestral/cuatrimestral/semestral/anual. "Cuatrimestre" es un `AcademicTerm` con `kind='cuatrimestral'`. Vale también para el código: concatenar una "c" fija al formatear un período asume la cadencia de UNSTA y rompe la generalidad que compró [ADR-0001](../decisions/0001-multi-universidad-desde-dia-1.md). |
| **sin datos** | Mostrar `0` cuando una métrica todavía no tiene reseñas que la sustenten | `0.0/5` se lee "facilísima" y `0%` se lee "no la recomienda nadie": son mediciones, no ausencia de dato. Una métrica sin sustento dice **`sin datos`** (`NO_DATA_YET` en `lib/copy.ts`), nunca `s/d`, que es una abreviatura que la app nunca definió. |
| **moderador-docente** | "Un docente puede moderar" | Estructuralmente imposible: `moderator` y `member` son roles exclusivos. Un docente que quiera moderar necesita una segunda cuenta con rol `moderator`. |
| **anónimo** | "Los datos del autor no existen en DB" | El anonimato es de **presentación**, no de storage. La identidad siempre se preserva internamente. |
| **estado de materia** | "Lo que muestra la UI (disponible/bloqueada/cursando/etc.)" | La UI muestra una mezcla de estados persistidos (`status` del enrollment) y estados derivados (computados desde correlativas). Solo los persistidos son "status" en el modelo. |
| **cohorte** | "La camada de ingreso" (la acepción universitaria habitual: "la cohorte 2020") | En planb es el grupo de alumnos que cursó **la misma combinación de materias** en un período, sin importar cuándo ingresaron. El sentido de camada de ingreso **no se usa** en el producto; si algún día hace falta, va con otro nombre. |
| **simulación** | "Una inscripción" | No inscribe a nada ni reserva un cupo: es una combinación que el alumno está evaluando. Lo que registra un hecho es el `EnrollmentRecord`. |
| **simulador** | "El nombre de la herramienta de planificación" | La herramienta es el **Planificador** (`/plan`, UI "Planificar"). Simular es la acción de armar borradores de períodos no actuales dentro de él. Los identificadores de esa acción (`EvaluateSimulation`, `/api/me/simulator/*`) son correctos; llamar "simulador" a la herramienta, no. |
| **backoffice** | "Un módulo del backend, con su propio namespace de API (`/api/admin/...`)" | Es la **unión de las features no-públicas de cada agregado**, un corte transversal sobre los módulos que ya existen. No es un bounded context ni un prefijo de ruta: cada feature de backoffice vive en su módulo dueño y expone `/api/<modulo>/...` (ej. el CRUD de carreras es `/api/academic/...`). Ver [ADR-0050](../decisions/0050-backoffice-como-corte-transversal.md). |
| **admin** | "Un módulo, un área del backend, o un namespace de API" | Es un `role` de `User` (ver Identidades y cuentas). Nombra al **actor**, no a un lugar del sistema. Al conjunto de pantallas que ese actor usa se lo llama **backoffice**; en el frontend "admin" sí nombra algo real, pero es una sección de UI (`src/app/(staff)/admin/`), no un módulo del backend. |

## Actores y sus boundaries de responsabilidad

| Actor | Qué puede hacer | Qué NO puede hacer |
|---|---|---|
| **Visitante anónimo** | Leer reseñas publicadas, ver catálogo de carreras/materias/docentes. | Publicar, reportar, simular. |
| **Alumno** (member + StudentProfile) | Gestionar historial propio, simular inscripciones, publicar/editar reseñas, reportar contenido, responder como docente si además tiene TeacherProfile verificado. | Moderar reseñas de otros. Ver identidad de otros reseñadores. |
| **Docente verificado** (member + TeacherProfile verificado) | Responder públicamente a reseñas donde fue el `docente_reseñado`. Editar su respuesta. | Ver identidad del reseñador. Moderar reseñas. Remover reseñas sobre él. |
| **Moderador** | Ver cola de reviews `under_review`, resolver reports, remover reseñas, ver identidad de reseñadores para detectar abuso. | Publicar reseñas. Responder como docente. Editar contenido ajeno. |
| **Admin** | Todo lo del moderator + gestión de catálogo académico + alta/baja de cuentas staff + verificación manual de docentes. | Editar reseñas ajenas (solo remover con motivo). |
| **University staff** | Dashboard institucional con agregados de su universidad únicamente. | Ver identidades individuales. Acceso a reseñas sin agregar. Acceso a datos de otra universidad. |
