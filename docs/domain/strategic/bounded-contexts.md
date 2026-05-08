# Bounded Contexts (planb)

Seis BCs definen el modelo de dominio. Cada uno tiene **lenguaje propio** (un mismo término puede significar cosas distintas en BCs distintos), **decisiones que lo gobiernan**, y un **contract con otros BCs** explícito.

La división se materializa físicamente como módulos en `backend/modules/<context>/` (ver [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md)).

| BC | Carpeta | Propósito en una línea |
|---|---|---|
| **Identity** | `backend/modules/identity/` | Cuentas, autenticación, perfiles académicos del usuario. |
| **Academic** | `backend/modules/academic/` | Catálogo precargado: universidades, carreras, planes, materias, docentes, comisiones, cuatrimestres. |
| **Enrollments** | `backend/modules/enrollments/` | Historial académico del alumno: imports, registros de cursadas. |
| **Reviews** | `backend/modules/reviews/` | Reseñas de cursadas, respuestas docentes, embeddings semánticos. |
| **Moderation** | `backend/modules/moderation/` | Reports, audit log, flujo de moderación. |
| **Planning** | `backend/modules/planning/` (a crear) | Simulaciones de inscripción guardadas, públicas y recomendadas. |

Las relaciones entre BCs se documentan en [`context-map.md`](context-map.md). Los aggregates y entities de cada BC en [`../tactical/aggregates.md`](../tactical/aggregates.md).

---

## Identity

**Capacidad**: gestiona la identidad del usuario en la plataforma: quién es, cómo se autentica, qué identidades académicas tiene reclamadas.

**Aggregates**: User, StudentProfile, TeacherProfile.

**Decisiones que lo gobiernan**:

- [ADR-0008](../../decisions/0008-roles-exclusivos-profiles-como-capacidades.md): roles mutuamente exclusivos (`member` / `moderator` / `admin` / `university_staff`) + profiles como unlockers de capabilities. Un docente que también es alumno tiene un solo `User`-`role=member` con dos profiles distintos.
- [ADR-0009](../../decisions/0009-anonimato-como-regla-de-presentacion.md): anonimato de autores en presentación pública.
- ADR-0033: VerificationToken vive como child entity dentro de User (y dentro de TeacherProfile), no como aggregate independiente.

**Lenguaje propio**:

- "User" = cuenta autenticable. NO es un alumno ni un docente; es la identidad técnica.
- "Member" = role del User; comunidad académica (alumnos y docentes).
- "Profile" = identity académica reclamada (StudentProfile, TeacherProfile). Profiles desbloquean capabilities, no son roles.
- "Verified" = en User significa email confirmado; en TeacherProfile significa identidad docente confirmada (vía email institucional o aprobación manual).

**Lo que expone a otros BCs** (contract):

- IDs como tokens opacos: `UserId`, `StudentProfileId`, `TeacherProfileId`.
- Eventos integration: `UserDisabled` (relevante a Reviews para hide reviews del autor disabled), `TeacherProfileVerified` (relevante a Reviews para habilitar response-to-review).
- Read API: `IdentityQueryService.IsVerified(userId)`, `IdentityQueryService.GetActiveProfilesFor(userId)` para que otros BCs validen authorization sin acoplarse a internal aggregates.

---

## Academic

**Capacidad**: representar la realidad fija del mundo académico: universidades, sus carreras, sus planes de estudio, sus materias, sus correlativas, sus docentes, sus comisiones, sus cuatrimestres. Es **catálogo precargado**: las altas/modificaciones las hace admin desde backoffice, no se generan por flujo de usuario.

**Aggregates**: University, Career, CareerPlan, Subject (con Prerequisite como child), Teacher, AcademicTerm, Commission (con CommissionTeacher como child).

**Decisiones que lo gobiernan**:

- [ADR-0001](../../decisions/0001-multi-universidad-desde-dia-1.md): multi-universidad desde día 1.
- [ADR-0002](../../decisions/0002-versionado-de-planes-de-estudio.md): versioning de planes (CareerPlan).
- [ADR-0003](../../decisions/0003-correlativas-con-dos-tipos.md): Prerequisites con dos tipos: `para_cursar` y `para_rendir`.
- ADR-0029: Planning BC separado (ergo Academic NO incluye SimulationDraft, aunque la simulación use materias del catálogo).

**Lenguaje propio**:

- "Subject" en Academic = materia como definición curricular (código, nombre, horas, plan al que pertenece). NO incluye estado de cursada.
- "Commission" = comisión específica de una materia para un cuatrimestre. Hay N por materia por cuatrimestre.
- "Term" en Academic = `AcademicTerm`, el cuatrimestre/bimestre con sus fechas. NO confundir con "term_kind" que es el tipo (cuatrimestre, bimestre, anual).
- "Teacher" = docente como entidad del catálogo, exista o no un User reclamando esa identidad. Un Teacher puede no tener TeacherProfile (Identity) hasta que el docente real cree cuenta.

**Lo que expone a otros BCs**:

- IDs opacos: `UniversityId`, `CareerPlanId`, `SubjectId`, `TeacherId`, `CommissionId`, `AcademicTermId`.
- Read API:
  - `AcademicQueryService.IsSubjectInPlan(subjectId, careerPlanId)` para Enrollments.
  - `AcademicQueryService.GetCommissionTeachers(commissionId)` para Reviews (al validar `docente_reseñado_id`).
  - `AcademicQueryService.GetSubjectsAvailableForTerm(careerPlanId, termId)` para Planning (simulador).

---

## Enrollments

**Capacidad**: capturar el historial académico real del alumno: qué cursó, cuándo, con qué resultado, en qué comisión. Es **input del usuario** (manual o vía import), opera sobre la realidad ya ocurrida (cursadas finalizadas o en curso).

**Aggregates**: HistorialImport, EnrollmentRecord.

**Decisiones que lo gobiernan**:

- [ADR-0004](../../decisions/0004-enrollment-guarda-hechos.md): EnrollmentRecord guarda hechos, no estados derivados. El estado del grafo (materia disponible / bloqueada) se computa al vuelo, no se persiste.
- [ADR-0006](../../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md): HistorialImport.raw_payload es JSONB (shape variable según `source_type`). EnrollmentRecord es columnas tipadas.
- ADR-0032: Edit destructive de EnrollmentRecord (cambio a `cursando` cuando había Review) emite event cross-BC `EnrollmentRecordEdited` que Reviews consume para invalidar la reseña.

**Lenguaje propio**:

- "EnrollmentRecord" = registro de cursada (un (alumno, materia, cuatrimestre)). Distinto de "matrícula formal en la universidad": acá modelamos lo que el alumno reporta, no lo que la universidad inscribe.
- "Status" en Enrollments = estado de la cursada del alumno: cursando / aprobada / desaprobada / abandonada / equivalencia.
- "Approval method" = cómo se aprobó: parcial / final / promoción / equivalencia.

**Lo que expone a otros BCs**:

- IDs opacos: `EnrollmentRecordId`, `HistorialImportId`.
- Read API: `EnrollmentQueryService.GetRecordsFor(profileId)`, `EnrollmentQueryService.GetTakenSubjects(profileId)` para Planning (simulador).
- Eventos integration: `EnrollmentRecordEdited` para que Reviews invalide cuando aplique.

---

## Reviews

**Capacidad**: reseñas anclas a EnrollmentRecord. Una reseña dice cómo fue la experiencia de esa cursada específica: dificultad percibida, comentarios sobre materia, comentarios sobre docente. El BC también owns las **respuestas docentes** y los **embeddings semánticos** (read model gated off en MVP).

**Aggregates**: Review (con TeacherResponse como child).

**Projections**: ReviewEmbedding.

**Decisiones que lo gobiernan**:

- [ADR-0005](../../decisions/0005-reseña-anclada-al-enrollment.md): reseña anclada a EnrollmentRecord (no a User + Subject).
- [ADR-0007](../../decisions/0007-pgvector-implementado-ui-gated-off.md): pgvector pipeline implementado, UI gated hasta tener volumen.
- [ADR-0009](../../decisions/0009-anonimato-como-regla-de-presentacion.md): anonimato del autor en presentación pública.
- [ADR-0011](../../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md): cascade de reports al upheld; sin reversión al restore.
- [ADR-0012](../../decisions/0012-edicion-de-resena-solo-desde-published.md): edit solo desde `published`.
- [ADR-0013](../../decisions/0013-embedding-gated-en-transiciones-a-published.md): embedding job en transiciones a `published`.
- ADR-0028: reseñas opcionales + premium features como reward (no gating del simulador).

**Lenguaje propio**:

- "Review" = una reseña sobre una cursada específica. UNIQUE por `enrollment_record_id`.
- "Docente reseñado" = el Teacher al que apunta la reseña (de los teachers asignados a la commission del enrollment).
- "Status" en Reviews = lifecycle de la reseña: published / under_review / removed.
- "Filter" = auto-evaluación de toxicidad/spam ejecutada por domain service `IReviewContentFilter` antes de Publish.
- "Embedding" = vector pgvector para clustering / semantic search.

**Lo que expone a otros BCs**:

- IDs: `ReviewId`, `TeacherResponseId` (aunque la última es child entity, el ID se usa como referencia externa).
- Eventos integration: `ReviewPublished`, `ReviewRemoved`, `ReviewQuarantined` (relevantes a Moderation).

---

## Moderation

**Capacidad**: gobernanza de la calidad del contenido. Reports de los usuarios, decisiones de moderadores, audit log completo. Es el sub-sistema que se ASEGURA que la plataforma no se llene de basura.

**Aggregates**: ReviewReport.

**Projections**: ReviewAuditLog.

**Decisiones que lo gobiernan**:

- [ADR-0010](../../decisions/0010-threshold-auto-hide-configurable-por-env-var.md): threshold de auto-hide configurable por env var.
- ADR-0031: ReviewAuditLog como projection, no aggregate.
- [ADR-0008](../../decisions/0008-roles-exclusivos-profiles-como-capacidades.md) (referencial): moderators no tienen profiles académicos, no pueden reseñar ni responder; rol exclusivo evita conflicto de interés.

**Lenguaje propio**:

- "Report" = reporte de un usuario sobre una review. Tiene su propio lifecycle (open → upheld | dismissed).
- "Resolution" = decisión del moderador sobre el report.
- "Cascade" = cuando un report se upheld y la review se remueve, otros reports abiertos sobre la misma review se cierran automáticamente como upheld.
- "Audit log" = registro append-only de TODOS los events que afectan a una review (publishing, edits, reports, removals, restores, responses).

**Lo que expone a otros BCs**:

- Reads internos para Moderator UI (cola, audit log, etc.).
- Eventos integration: `ReviewRemoved` (Reviews ya re-emite este después del cascade), `ReviewRestored`.

---

## Planning

**Capacidad**: capturar el lado **futuro** del alumno: qué planea cursar el próximo cuatrimestre. Es la herramienta de decisión (simulador) + la capa de social-proof (ver simulaciones de otros) + la recomendación.

**Aggregates**: SimulationDraft.

**Decisiones que lo gobiernan**:

- ADR-0028: premium features (save / share / recommend) en lugar de gating del simulador. La feature core (simular sin guardar) es libre.
- ADR-0029: Planning como BC separado de Enrollments.

**Lenguaje propio**:

- "Simulation" / "SimulationDraft" = combinación tentativa de materias para un cuatrimestre futuro. NO es inscripción.
- "Saved" = el alumno guardó el draft (privado por default).
- "Shared" = el alumno publicó el draft al corpus público-anónimo (visible a otros alumnos).
- "Recommended" = simulación generada por el sistema basada en historial + corpus (post-MVP).

**Lo que expone a otros BCs**:

- En MVP, Planning no expone APIs a otros BCs: es feature de cara al alumno.
- Consume reads de Academic (subjects, plans) y Enrollments (historial para "available subjects").

---

## Por qué seis y no más, no menos

- **¿Identity vs Academic combinados?** No: Identity habla de cuentas y Academic habla del mundo académico fijo. El catálogo existe sin usuarios; los usuarios existen sin haber reclamado identidad académica. Lenguajes distintos.
- **¿Enrollments vs Reviews combinados?** No: Enrollments captura hechos académicos (qué cursé), Reviews captura opinión/experiencia. Lifecycles distintos, autoridades distintas (en Enrollments el alumno edita libre; en Reviews hay gobernanza de moderación).
- **¿Reviews vs Moderation combinados?** Discutible. Los separamos porque la lógica de gobernanza (reports, threshold, cascade, audit) tiene su propio lenguaje y reglas que no contaminan la lógica de "publicar / editar / eliminar reseña". Mantenerlos separados aclara que Moderation es un sub-sistema operacional (lo usa staff), Reviews es contenido (lo usan visitantes).
- **¿Planning como BC separado o dentro de Enrollments?** Lo separamos porque hablan de tiempos distintos: Enrollments es pasado (qué cursé), Planning es futuro (qué pienso cursar). Mismo dato shape (alumno + materia + cuatrimestre) pero significado y lifecycle distintos. Ver ADR-0029.

---

## Cuándo revisitar esta división

- Si Planning crece a tener varios aggregates (recomendaciones, sharing avanzado, comparaciones), confirmamos la separación.
- Si Reviews + Moderation empiezan a duplicar lógica (ej. ambos persisten estado de "review removed"), consolidamos en uno solo.
- Si aparece un nuevo dominio del producto (ej. notificaciones, mensajería interna, integraciones con sistemas universitarios), evaluamos si entra a alguno existente o requiere BC nuevo.
