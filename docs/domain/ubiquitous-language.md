# Ubiquitous Language (planb)

Glosario de términos del dominio. Es la referencia autoritativa para el uso de cada término en código, UI, documentación y conversación con stakeholders. Si un término aparece acá con un significado específico, no se usa con otro significado en otro lado.

Basado en los principios de DDD (Eric Evans). Cuando aparecen nuevos términos en conversación o código, se agregan acá antes de propagarse.

## Convenciones generales

- **Identificadores en código** (clases, tablas, propiedades): inglés. C# → `PascalCase`, SQL → `snake_case`, TypeScript → `camelCase`.
- **Strings de UI**: español rioplatense.
- **Mensajes de error internos** (logs, excepciones, códigos de error): inglés.
- **Documentación y ADRs**: narrativa en español, nombres de entidades en inglés cuando referencia al modelo (ej. "el `EnrollmentRecord` tiene estado `aprobada`").

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
| **CareerPlan** | Versión específica del plan de estudios de una carrera, con fechas de vigencia y materias propias. Ej: "Plan 2019", "Plan 2024". |
| **plan vigente** | `CareerPlan` con `effective_to IS NULL`. Es el que se le ofrece a nuevos ingresantes. |
| **Subject** | Materia. Pertenece a un `CareerPlan`. Tiene `year_in_plan` (año del plan), `term_kind` y `term_in_year`. |
| **Prerequisite** | Correlativa. Relación entre dos `Subject` del mismo plan con un `type`. |
| **para_cursar** | Tipo de correlativa: requiere que la materia requerida esté **regularizada** para inscribirse a la dependiente. |
| **para_rendir** | Tipo de correlativa: requiere que la materia requerida esté **aprobada** para rendir el final de la dependiente. |
| **Teacher** | Docente. Entidad del catálogo académico precargada, asociada a una universidad. Existe independientemente de si hay un `User` que la reclamó. |
| **Commission** | Comisión. Oferta concreta de una `Subject` en un `AcademicTerm`. Tiene nombre (A, B, Com 1), modalidad, capacidad. |
| **CommissionTeacher** | Asignación M:N entre `Teacher` y `Commission` con `role` (titular, adjunto, JTP, ayudante, invitado). |
| **AcademicTerm** | Período lectivo de una universidad. Tiene un `kind` (bimestral, cuatrimestral, semestral, anual) que define su duración. Ej: "2026-C1". |
| **term_kind** | Cadencia del período: `bimestral`, `cuatrimestral`, `semestral`, `anual`. Genérico para soportar universidades con distintos calendarios. |

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

## Reseñas y moderación

| Término | Significado |
|---|---|
| **Review** | Reseña de una cursada específica. Anclada a un `EnrollmentRecord` finalizado (no `cursando`). Una por enrollment. |
| **docente_reseñado** | El `Teacher` al que apunta el texto libre del docente dentro de la reseña. Debe pertenecer al `CommissionTeacher` de la comisión del enrollment. |
| **difficulty_rating** | Rating de dificultad global de la cursada, 1-5. Input del simulador para promedios combinados. |
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
| **cuatrimestre** | Como sinónimo de cualquier período | `AcademicTerm` generaliza a bimestral/cuatrimestral/semestral/anual. "Cuatrimestre" es un `AcademicTerm` con `kind='cuatrimestral'`. |
| **moderador-docente** | "Un docente puede moderar" | Estructuralmente imposible: `moderator` y `member` son roles exclusivos. Un docente que quiera moderar necesita una segunda cuenta con rol `moderator`. |
| **anónimo** | "Los datos del autor no existen en DB" | El anonimato es de **presentación**, no de storage. La identidad siempre se preserva internamente. |
| **estado de materia** | "Lo que muestra la UI (disponible/bloqueada/cursando/etc.)" | La UI muestra una mezcla de estados persistidos (`status` del enrollment) y estados derivados (computados desde correlativas). Solo los persistidos son "status" en el modelo. |

## Actores y sus boundaries de responsabilidad

| Actor | Qué puede hacer | Qué NO puede hacer |
|---|---|---|
| **Visitante anónimo** | Leer reseñas publicadas, ver catálogo de carreras/materias/docentes. | Publicar, reportar, simular. |
| **Alumno** (member + StudentProfile) | Gestionar historial propio, simular inscripciones, publicar/editar reseñas, reportar contenido, responder como docente si además tiene TeacherProfile verificado. | Moderar reseñas de otros. Ver identidad de otros reseñadores. |
| **Docente verificado** (member + TeacherProfile verificado) | Responder públicamente a reseñas donde fue el `docente_reseñado`. Editar su respuesta. | Ver identidad del reseñador. Moderar reseñas. Remover reseñas sobre él. |
| **Moderador** | Ver cola de reviews `under_review`, resolver reports, remover reseñas, ver identidad de reseñadores para detectar abuso. | Publicar reseñas. Responder como docente. Editar contenido ajeno. |
| **Admin** | Todo lo del moderator + gestión de catálogo académico + alta/baja de cuentas staff + verificación manual de docentes. | Editar reseñas ajenas (solo remover con motivo). |
| **University staff** | Dashboard institucional con agregados de su universidad únicamente. | Ver identidades individuales. Acceso a reseñas sin agregar. Acceso a datos de otra universidad. |
