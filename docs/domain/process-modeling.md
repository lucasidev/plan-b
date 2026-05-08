# Process Modeling Level (planb)

Este doc cubre el **nivel 2 de EventStorming (Brandolini)**: Process Modeling. Conecta el Big Picture (level 1, ver [eventstorming.md](eventstorming.md)) con el Software Design (level 3, ver [tactical/aggregates/](tactical/aggregates/)).

Foco: **Actors → Commands → Aggregates → Events → Policies → Read Models → External Systems**. Las policies ("whenever X then Y") son la pieza clave porque definen los reactive flows que viajan por el Wolverine outbox (ver [ADR-0030](../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md)).

A diferencia del Big Picture, que captura la línea de tiempo y los hot spots, el Process Modeling reordena los stickies en **flujos operacionales reactivos**: cada event puede disparar policies, cada policy emite nuevos commands, y los read models se materializan a partir de los events. El nivel 3 (Software Design) viene después y elige los consistency boundaries (aggregates) que ejecutan cada command.

## Notación

| Sticky | Color | Significado |
|---|---|---|
| Actor | yellow | Quién dispara el command (Visitor, Member, Alumno, Moderator, Admin, Docente verificado, System, Worker) |
| Command | blue | Intención de cambiar estado (`RegisterUser`, `VerifyEmail`, `PublishReview`, ...) |
| Aggregate | orange | Consistency boundary que ejecuta el command (`User`, `Review`, ...) |
| Event | orange (light) | Hecho ocurrido emitido por el aggregate (`UserRegistered`, ...) |
| Policy | purple | "Whenever X happens, Y must happen". Reacción automática al event |
| Read Model | green | Vista materializada que se actualiza por events o se computa on-demand |
| External System | pink | SMTP (Mailpit en dev), scheduled jobs, pgvector, third-party APIs |

## Momentos (alineados con eventstorming.md)

Los tres momentos del Big Picture ([eventstorming.md](eventstorming.md)) reordenados acá como flujos reactivos: Onboarding (one-shot por alumno), Loop core (iterativo cada cuatrimestre) y Governance (paralelo, sin loop). Cada step muestra el sticky completo: quién dispara, qué command, qué aggregate, qué event, qué policy reactiva queda enganchada, qué read model se afecta y qué external system participa.

### 1. Onboarding (Visitor → Member verificado → Alumno con StudentProfile)

| # | Actor | Command | Aggregate | Event emitido | Policy reactiva (whenever X then Y) | Read Model | External System |
|---|---|---|---|---|---|---|---|
| 1 | Visitor | `Register(email, passwordHash)` | User | `UserRegistered` | whenever `UserRegistered` then `IssueVerificationToken(userId, purpose=UserEmailVerification)` | `EmailIsAvailable(email)` (uniqueness check pre-command) |: |
| 2 | System (policy de step 1) | `IssueVerificationToken(rawValue, purpose, ttl)` | User | `VerificationTokenIssued` (+ `VerificationTokenInvalidated` si había activos del mismo purpose) | whenever `VerificationTokenIssued (purpose=UserEmailVerification)` then enviar email con link de verificación | `UserHasActiveTokenForPurpose(userId, purpose)` | SMTP (Mailpit dev, relay prod) |
| 3 | Visitor (click link) | `MarkEmailVerifiedFor(rawValue)` | User | `VerificationTokenConsumed` + `UserEmailVerified` | whenever `UserEmailVerified` then habilitar capability "create StudentProfile" (implícito, sin command) | `TokenExists(rawValue)`, `TokenIsActive(rawValue)` |: |
| 4 | Member verificado (resend explícito) | `IssueVerificationToken(...)` (re-issue) | User | `VerificationTokenInvalidated` (token previo) + `VerificationTokenIssued` (nuevo) | whenever `VerificationTokenIssued` then enviar email |: | SMTP |
| 5 | System (scheduled job, daily) | `ExpireUnverifiedRegistration()` (sobre cada user `email_verified_at IS NULL` registrado hace > 7 días) | User | `UnverifiedRegistrationExpired` | whenever `UnverifiedRegistrationExpired` then liberar email para re-registro (terminal state, sin command) | `UserIsUnverified(userId)`, `RegisteredMoreThan(userId, 7.days)` | Scheduled job runner |
| 6 | Member verificado | `Create(userId, careerPlanId, enrollmentYear)` | StudentProfile | `StudentProfileCreated` | (none: habilita commands sobre EnrollmentRecord para esa carrera) | `UserIsVerified(userId)`, `CareerPlanExists(careerPlanId)`, `NoActiveProfileForPair(userId, careerPlanId)` |: |
| 7 | Alumno | `Request(studentProfileId, sourceType, rawPayload)` | HistorialImport | `HistorialImportRequested` | whenever `HistorialImportRequested` then worker consume y procesa el payload | `StudentProfileOwnedBy(profileId, userId)`, `SourceFormatValid(sourceType, raw)` | Worker (background job) |
| 8 | Worker (system) | `MarkProcessing()` | HistorialImport | (sin event público) |: |: |: |
| 9 | Worker (system, on success) | `Complete(results)` | HistorialImport | `HistorialImportCompleted` | whenever `HistorialImportCompleted` then por cada row resuelto: `Create(profileId, subjectId, termId, status, ...)` sobre EnrollmentRecord; notificar al alumno |: | SMTP (notificación opcional) |
| 10 | Worker (system, on error) | `Fail(error)` | HistorialImport | `HistorialImportFailed` | whenever `HistorialImportFailed` then notificar al alumno y sugerir flow manual | `FailedHistorialImportLine` (projection) | SMTP |
| 11 | Admin | `CreateStaff(email, passwordHash, role)` | User | `StaffUserCreated` | (none: staff queda auto-verified, sin token email; ver eventstorming HOT 14) | `EmailIsAvailable(email)` |: |

**Policies que cruzan BC**: ninguna en onboarding. Todo Identity-internal hasta que aparezca StudentProfile, que vive también en Identity.

### 2. Loop core (Alumno cursa → registra → reseña → reacciona → simula)

Iterativo cada cuatrimestre. El simulador en sí no emite events (es query pura sobre read models); los events aparecen cuando el alumno persiste algo (`SimulationDraftSaved`, `EnrollmentRecordCreated`, `ReviewPublished`).

#### 2.1. Registrar el resultado de la cursada

| # | Actor | Command | Aggregate | Event emitido | Policy reactiva | Read Model | External System |
|---|---|---|---|---|---|---|---|
| 1 | Alumno | `Create(profileId, subjectId, termId, status, grade?, approvalMethod?)` | EnrollmentRecord | `EnrollmentRecordCreated` | whenever `EnrollmentRecordCreated` then habilita el command `Publish` sobre Review (si `status != cursando`); invalida cache del read model `AvailableSubjectsForProfile` | `SubjectInPlan(subjectId, profile.careerPlanId)`, `NoDuplicate(profileId, subjectId, termId)` |: |
| 2 | Alumno | `Edit(changes)` | EnrollmentRecord | `EnrollmentRecordEdited` (+ `EnrollmentRecordEditedIntegrationEvent` cross-BC si destructive) | whenever `EnrollmentRecordEditedIntegrationEvent` then `Invalidate(reviewId, reason='enrollment_changed')` sobre Review (ADR-0032) | `EnrollmentRecordOwnedBy(recordId, userId)` |: |

#### 2.2. Reseñar (opcional pero esperada)

| # | Actor | Command | Aggregate | Event emitido | Policy reactiva | Read Model | External System |
|---|---|---|---|---|---|---|---|
| 3 | Alumno autor del EnrollmentRecord | `Publish(verdict)` (verdict viene del domain service `IReviewContentFilter`) | Review | `ReviewPublished` (verdict Clean) o `ReviewQuarantined` (verdict Triggered) | whenever `ReviewPublished` then encolar job de embedding (gated en transición a `published`, ADR-0013); whenever `ReviewQuarantined` then notificar al autor + agregar a `ModeratorQueue` | `IReviewContentFilter` (domain service); `ReviewAggregatesForSubject`, `ReviewAggregatesForTeacher` (se actualizan al publicar) | pgvector (storage del embedding) |
| 4 | Alumno autor | `Edit(changes)` | Review | `ReviewEdited` | whenever `ReviewEdited` then re-correr `IReviewContentFilter`; si texto cambió, re-enqueue embedding job (reemplaza el anterior por mismo `model_name + model_version`, ADR-0013) | (filter re-run) | pgvector |
| 5 | System (policy de step 2 cross-BC) | `Invalidate(reviewId, reason='enrollment_changed')` | Review | `ReviewInvalidated` | whenever `ReviewInvalidated` then notificar autor (UI muestra "tu reseña queda pendiente"); el moderador puede skip-resolve (cola filtrable por reason) |: |: |
| 6 | Docente verificado (TeacherProfile.verified_at NOT NULL, teacher_id == DocenteResenadoId) | `PostTeacherResponse(authorTeacherProfileId, text)` | Review (sobre child TeacherResponse) | `TeacherResponsePublished` | whenever `TeacherResponsePublished` then notificar al autor de la review |: | SMTP |
| 7 | Docente author de la response | `EditTeacherResponse(authorTeacherProfileId, newText)` | Review (sobre child TeacherResponse) | `TeacherResponseEdited` | whenever `TeacherResponseEdited` then marcar review como "respuesta editada"; audit log entry |: |: |

#### 2.3. Planificar próximo cuatrimestre (Simulador)

Las consultas al simulador (qué materias podés cursar, métricas de combinaciones) no emiten events: son queries puras sobre read models cross-BC. Los events aparecen cuando el alumno **persiste** la simulación.

| # | Actor | Command | Aggregate | Event emitido | Policy reactiva | Read Model | External System |
|---|---|---|---|---|---|---|---|
| 8 | Alumno (premium feature, ADR-0028) | `Save(profileId, subjects, termId)` | SimulationDraft | `SimulationDraftSaved` | (none: telemetría de uso) | `AvailableSubjectsForProfile`, `BlockedSubjectsForProfile`, `CombinationMetrics` |: |
| 9 | Owner del draft | `Update(subjects)` | SimulationDraft | `SimulationDraftEdited` | (none) | (mismas validaciones que Save) |: |
| 10 | Owner del draft | `Share()` | SimulationDraft | `SimulationDraftShared` | whenever `SimulationDraftShared` then actualizar read model `PublicSimulationDrafts` (corpus público anónimo) | `PublicSimulationDrafts` |: |
| 11 | Owner del draft | `Unshare()` | SimulationDraft | `SimulationDraftUnshared` | whenever `SimulationDraftUnshared` then quitar del corpus público | `PublicSimulationDrafts` |: |
| 12 | Owner del draft | `Delete()` | SimulationDraft | `SimulationDraftDeleted` | (hard delete, sin audit) |: |: |

### 3. Governance (reportes, moderación, audit, gestión de cuentas)

Paralelo al loop core, sin retorno automático al alumno. Tiene tres sub-flujos: reportar/moderar reseñas, claim/verificación de identidad docente, gestión de cuentas.

#### 3.1. Reportar y moderar reseñas

| # | Actor | Command | Aggregate | Event emitido | Policy reactiva | Read Model | External System |
|---|---|---|---|---|---|---|---|
| 1 | User logueado (≠ author) | `Open(reviewId, reporterId, reason, details?)` | ReviewReport | `ReviewReported` | whenever `ReviewReported` then incrementar `count(reports open por reviewId)`; si `count >= MODERATION_AUTO_HIDE_THRESHOLD` (default 3, ADR-0010) then `Quarantine(reason='ReportThreshold')` sobre Review | `UserAlreadyReported(userId, reviewId)`, `IsAuthor(userId, reviewId)` |: |
| 2 | System (policy de step 1) | `Quarantine(reason)` | Review | `ReviewQuarantined` | whenever `ReviewQuarantined` then notificar al autor; agregar a `ModeratorQueue` ordenada por count(reports open) | `ModeratorQueue` | SMTP (notificación al autor) |
| 3 | Moderator | `Uphold(moderatorId, resolutionNote)` | ReviewReport | `ReportUpheld` (+ `ReportUpheldIntegrationEvent` cross-BC) | whenever `ReportUpheldIntegrationEvent` then: (a) cascade upheld a otros reports `Status='open'` de la misma review (ADR-0011); (b) `Remove(reason)` sobre Review; (c) notificar reporters via UC-020 |: |: |
| 4 | System (cascade de step 3) | `Uphold(...)` (sobre cada report sibling open) | ReviewReport | `ReportUpheld` | (sin cascade ulterior; los siblings ya están cerrados al heredar `resolution_note` y `moderator_id`) |: |: |
| 5 | System (policy de step 3) | `Remove(reason)` | Review | `ReviewRemoved` | whenever `ReviewRemoved` then append entry a `ReviewAuditLog` projection (ADR-0031); notificar autor | `ReviewAuditLog` | SMTP |
| 6 | Moderator | `Dismiss(moderatorId, resolutionNote)` | ReviewReport | `ReportDismissed` | whenever `ReportDismissed` then: si era el único report open y review estaba `under_review`, restore review a `published` (UC-052 path); audit log entry | `ReviewAuditLog` |: |
| 7 | Moderator | `Restore(restoredBy)` | Review | `ReviewRestored` | whenever `ReviewRestored` then: append entry a `ReviewAuditLog`; **NO** revertir reports cascade-upheld a `open` (ADR-0011: "sin reversión on restore"); re-enqueue embedding job si no existía (ADR-0013) | `ReviewAuditLog` | pgvector |
| 8 | Sistema (policy de transición a published por step 6 o 7) | (kick async embedding job) | ReviewEmbedding (projection, no aggregate) | (sin event de dominio; es read model) | (job worker computa el embedding y lo persiste en pgvector) | `ReviewEmbedding` | pgvector |

#### 3.2. Claim y verificación de identidad docente

| # | Actor | Command | Aggregate | Event emitido | Policy reactiva | Read Model | External System |
|---|---|---|---|---|---|---|---|
| 1 | Member verificado | `InitiateClaim(userId, teacherId)` | TeacherProfile | `TeacherProfileClaimInitiated` | (none: pasa a pending) | `TeacherExists(teacherId)`, `NoActiveClaim(userId, teacherId)` |: |
| 2 | Owner del profile | `SubmitInstitutionalEmail(emailAddress)` | TeacherProfile | `TeacherProfileInstitutionalEmailSubmitted` | whenever `TeacherProfileInstitutionalEmailSubmitted` then `IssueVerificationToken(profileOwner, purpose=TeacherInstitutionalVerification)` (post-MVP) | `Teacher.University.institutional_email_domains` (validación de dominio) | SMTP |
| 3 | Owner via link | `VerifyByInstitutionalEmail(rawToken)` | TeacherProfile | `TeacherProfileVerifiedByInstitutionalEmail` (+ `TeacherProfileVerifiedIntegrationEvent` cross-BC) | whenever `TeacherProfileVerifiedIntegrationEvent` then habilitar capability `review:respond` en Reviews (el docente puede `PostTeacherResponse` en sus reviews) |: |: |
| 4 | Owner del profile | `SubmitEvidence(evidenceFileIds)` | TeacherProfile | `TeacherProfileEvidenceSubmitted` | whenever `TeacherProfileEvidenceSubmitted` then agregar a cola admin de revisión manual | (cola admin) |: |
| 5 | Admin | `VerifyManually(approvedByAdminId)` | TeacherProfile | `TeacherProfileVerifiedManually` (+ `TeacherProfileVerifiedIntegrationEvent`) | whenever `TeacherProfileVerifiedIntegrationEvent` then habilitar capability `review:respond` (mismo handler que step 3) |: | SMTP |
| 6 | Admin | `RejectVerification(reason, rejectedByAdminId)` | TeacherProfile | `TeacherProfileVerificationRejected` | whenever `TeacherProfileVerificationRejected` then notificar al user con razón |: | SMTP |

#### 3.3. Gestión de cuentas (admin/moderator)

| # | Actor | Command | Aggregate | Event emitido | Policy reactiva | Read Model | External System |
|---|---|---|---|---|---|---|---|
| 1 | Admin / Moderator | `Disable(byId, reason)` | User | `UserDisabled` (+ `UserDisabledIntegrationEvent` cross-BC) | whenever `UserDisabledIntegrationEvent` then: (a) Reviews soft-flag las reviews del user (handler `SoftFlagReviewsForPresentationOnUserDisabled`, ADR-0030); (b) Moderation appendea audit log entry; cascade soft delete (lógico) a SimulationDrafts si aplica |: |: |
| 2 | Admin / Moderator | `Restore()` | User | `UserRestored` | whenever `UserRestored` then audit log entry (no se re-publican reviews soft-flagged automáticamente) |: |: |
| 3 | Alumno (status) | `MarkGraduated(graduatedAt)` | StudentProfile | `StudentProfileMarkedGraduated` | (none: telemetría) |: |: |
| 4 | Alumno (status) | `MarkAbandoned()` | StudentProfile | `StudentProfileMarkedAbandoned` | (none: telemetría) |: |: |

#### 3.4. Catálogo (admin)

CRUD-flavored, sin integration events cross-BC en MVP. Cada command emite su event correspondiente que solo alimenta audit interno y read models del propio Academic. Detalle en [tactical/aggregates/](tactical/aggregates/) (University, Career, CareerPlan, Subject, Teacher, AcademicTerm, Commission). Una policy notable:

| # | Actor | Command | Aggregate | Event emitido | Policy reactiva | Read Model | External System |
|---|---|---|---|---|---|---|---|
| 1 | Admin | `AddPrerequisite(subjectId, prerequisiteSubjectId, type)` | Subject (sobre child Prerequisite) | `PrerequisiteAdded` | whenever `AddPrerequisite` (pre-command) then validar aciclicidad vía domain service `IPrerequisiteGraphValidator` (cross-aggregate, simula inserción + BFS); si genera ciclo, command rechazado (ADR-0029, eventstorming HOT 12) | `IPrerequisiteGraphValidator` |: |

## Catálogo de Policies (whenever X then Y)

Tabla resumida de **todas** las policies del sistema. Cada policy es un handler reactivo en código (Wolverine handler que escucha al event y dispara el command resultante). El outbox garantiza at-least-once delivery (ADR-0030).

| Trigger event | Policy (whenever X then Y) | Aggregates afectados | ADR / Source |
|---|---|---|---|
| `UserRegistered` | enviar verification email vía SMTP (vía `IssueVerificationToken` + handler que dispara mail) | User (token re-issue) | eventstorming §1, HOT 1 |
| `VerificationTokenIssued (purpose=UserEmailVerification)` | enviar email con link al user | (external: SMTP) | eventstorming §1 |
| `VerificationTokenIssued (purpose=TeacherInstitutionalVerification)` | enviar email institucional al claim owner (post-MVP) | (external: SMTP) | eventstorming §6c |
| `UserEmailVerified` | habilitar capability "create StudentProfile" (sin command, capability check) | StudentProfile | ADR-0008 |
| `TeacherProfileVerifiedIntegrationEvent` | habilitar capability `review:respond` para `PostTeacherResponse` | Review (TeacherResponse) | tactical/aggregates/Review §1, ADR-0030 |
| `UserDisabledIntegrationEvent` | (a) soft-flag reviews del user para presentación; (b) cascade soft-delete a SimulationDrafts del user; (c) audit log | Review, SimulationDraft, ReviewAuditLog | ADR-0030 |
| `EnrollmentRecordEditedIntegrationEvent` (destructive) | `Invalidate(reviewId, reason='enrollment_changed')` sobre Review anclada | Review | ADR-0032 |
| `ReviewPublished` | encolar job de embedding (gated, solo en transiciones a `published`) | ReviewEmbedding (projection) | ADR-0013 |
| `ReviewEdited` | re-correr `IReviewContentFilter`; si texto cambió, re-enqueue embedding job | ReviewEmbedding (projection) | ADR-0013, tactical/aggregates/Review |
| `ReviewRestored` | re-enqueue embedding job si no existía previamente | ReviewEmbedding (projection) | ADR-0013 |
| `ReviewReported` | si `count(reports open) >= MODERATION_AUTO_HIDE_THRESHOLD`, `Quarantine(reason='ReportThreshold')` sobre Review | Review | ADR-0010 |
| `ReportUpheldIntegrationEvent` | (a) cascade upheld a otros reports `Status='open'` de la misma review; (b) `Remove(reason)` sobre Review; (c) notificar reporters | Review, ReviewReport (siblings) | ADR-0011, ADR-0030 |
| `ReportDismissed` | si era el único report open y review estaba `under_review`, restore review a `published` | Review | ADR-0011 |
| `ReviewQuarantined` / `ReviewRemoved` / `ReviewRestored` / `ReviewEdited` / `TeacherResponsePublished` / `TeacherResponseEdited` | append entry a `ReviewAuditLog` projection | ReviewAuditLog (projection) | ADR-0031, eventstorming HOT 10 |
| `HistorialImportRequested` | worker procesa el payload (parsing + matching contra plan) | HistorialImport, EnrollmentRecord (batch create) | tactical/aggregates/HistorialImport |
| `HistorialImportCompleted` | por cada row resuelto: `Create(...)` sobre EnrollmentRecord; notificar al alumno | EnrollmentRecord | tactical/aggregates/HistorialImport |
| `HistorialImportFailed` | notificar al alumno y sugerir flow manual |: | tactical/aggregates/HistorialImport |
| `SimulationDraftShared` | actualizar read model `PublicSimulationDrafts` (corpus público anónimo) | (read model only) | tactical/aggregates/SimulationDraft |
| `SimulationDraftUnshared` | quitar del corpus público | (read model only) | tactical/aggregates/SimulationDraft |
| Pre-command: `AddPrerequisite` | validar aciclicidad vía `IPrerequisiteGraphValidator` (BFS); rechazar si ciclo | Subject (Prerequisite child) | ADR-0029, eventstorming HOT 12 |
| Scheduled (daily): `User WHERE email_verified_at IS NULL AND registered > 7.days.ago` | `ExpireUnverifiedRegistration()` sobre cada uno | User | eventstorming §1, HOT 2 |

**Nota sobre el cascade de `UserDisabled`**: el handler `SoftFlagReviewsForPresentationOnUserDisabled` (Reviews) y el cascade a SimulationDrafts (Planning) son consumidores **distintos** del mismo `UserDisabledIntegrationEvent`. Wolverine despacha el integration event a ambos handlers de forma independiente. Si uno falla, el otro sigue su curso (at-least-once por consumer).

## External systems

| System | Uso | Dev | Prod |
|---|---|---|---|
| SMTP server | envío de verification emails (UserEmailVerification, TeacherInstitutionalVerification post-MVP) y notificaciones (review notif, mod resolution) | Mailpit | TBD (relay externo, ADR pendiente) |
| Scheduled job runner | UC-022 expirar registros no verificados (daily 3 AM UTC); en futuro: cleanup de tokens expirados, etc. | TBD (Wolverine scheduled jobs candidato natural) | TBD |
| pgvector | embedding storage para Review (read model `ReviewEmbedding`); habilitado pero UI gated off (ADR-0007) | dentro de Postgres 17 (extensión) | idem |
| Worker async (HistorialImport processor) | procesa PDFs y texto plano contra el CareerPlan; emite `HistorialImportCompleted` o `HistorialImportFailed` | proceso del backend (Wolverine handler) | idem |
| `IReviewContentFilter` (domain service) | clasifica texto pre-publish (Clean / Triggered) | implementación in-process; reglas heurísticas iniciales | idem (modelo entrenable a futuro) |

## Read models cross-BC

Vistas materializadas o computadas on-demand alimentadas por events de uno o más BCs. Algunas son projections explícitas (event-sourced sobre la cola), otras son queries Dapper que cruzan tablas read-side.

| Read Model | Alimentado por | Consumido por | Implementación |
|---|---|---|---|
| `AvailableSubjectsForProfile(profileId, termId)` | `EnrollmentRecordCreated`/`Edited` historial + Subject + Prerequisite (Academic) | UC-016 simulator/available | Dapper query on-demand |
| `BlockedSubjectsForProfile(profileId, termId)` | idem (con razón de bloqueo: qué correlativa falta) | UC-016 | Dapper query on-demand |
| `CombinationMetrics(profileId, materias[])` | EnrollmentRecord (carga horaria histórica), Reviews (dificultad ponderada) | UC-016 simulator | Dapper query on-demand |
| `ReviewAggregatesForSubject(subjectId)` | `ReviewPublished` + `ReviewRemoved` + `ReviewRestored` + `ReviewInvalidated` | UC-002 página de Subject | EF projection con triggers en events |
| `ReviewAggregatesForTeacher(teacherId)` | idem scoped por docente reseñado | UC-003 página de Teacher | idem |
| `PublicSimulationDrafts(careerPlanId, termId)` | `SimulationDraftShared` / `SimulationDraftUnshared` | UC-027 ver simulaciones públicas | EF projection event-driven |
| `InstitutionalDashboard(universityId)` | múltiples aggregates (Reviews, Enrollments) scoped por University | UC-080 dashboard staff | Dapper query on-demand |
| `ReviewAuditLog(reviewId)` | events de Review (Published/Edited/Quarantined/Invalidated/Removed/Restored) + TeacherResponse (Published/Edited) + ReviewReport (Reported/Upheld/Dismissed) | UC-053 audit log | append-only projection (Moderation BC, ADR-0031) |
| `ModeratorQueue` | reviews `status=under_review` ordenadas por `count(reports open por reviewId)` | UC-050 cola del moderador | Dapper query on-demand (filtrable por `reason`) |
| `ReviewEmbedding` | `ReviewPublished` + `ReviewEdited` (text-changed) + `ReviewRestored` | búsqueda semántica (UI gated off, ADR-0007) | pgvector (Postgres extensión); pipeline async via job worker |
| `FailedHistorialImportLine(importId)` | `HistorialImportCompleted` con rows no resueltos | UI de revisión post-import | EF projection |

## Cómo se materializa todo esto en código

Mapeo del nivel 2 al nivel 3 (concretización en .NET 10 + Wolverine):

- **Commands**: clases `XxxCommand` (records) que viajan por Wolverine como mediator. Llamados desde Carter endpoints o desde otros handlers.
- **Aggregates**: roots con métodos que mutan estado y emiten domain events vía `Raise(...)`. Ver [`docs/decisions/0017-persistence-ignorance.md`](../decisions/0017-persistence-ignorance.md).
- **Handlers (commands)**: clases `XxxCommandHandler` que cargan el aggregate, llaman al método, persisten vía `IUnitOfWork.SaveChangesAsync` (mismo transaction scope que el outbox de Wolverine).
- **Domain events**: emitidos como parte del save. `DomainEventDispatcher` los enrolla al outbox de Wolverine en la misma transacción Postgres.
- **Integration events**: traducidos por handlers locales del BC origen ("translator") que los publican al outbox para cross-BC. Ver `tactical/domain-events.md` § "Domain → Integration translation".
- **Policies**: handlers Wolverine que escuchan events (domain o integration) y disparan más commands. At-least-once delivery via outbox.
- **Read models**: Dapper queries (computación on-demand) o EF projections (materializadas event-driven, append-only en Moderation `ReviewAuditLog`).
- **External systems**: adapters detrás de interfaces (`ISmtpEmailSender`, `IClock`/`IDateTimeProvider`, `IReviewContentFilter`, `IPrerequisiteGraphValidator`). Implementaciones concretas inyectadas en composition root.

Ver [`docs/decisions/0017-persistence-ignorance.md`](../decisions/0017-persistence-ignorance.md) para el contrato dominio ↔ infra y [`tactical/domain-events.md`](tactical/domain-events.md) para el patrón de translation domain → integration.

## Refs

- Big Picture (level 1): [eventstorming.md](eventstorming.md)
- Software Design (level 3): [tactical/aggregates/](tactical/aggregates/)
- Domain events index: [tactical/domain-events.md](tactical/domain-events.md)
- Outbox y eventual consistency: [ADR-0030](../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md)
- Cascade rules de moderación: [ADR-0011](../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md)
- Auto-quarantine threshold: [ADR-0010](../decisions/0010-threshold-auto-hide-configurable-por-env-var.md)
- Edit destructive invalida Review: [ADR-0032](../decisions/0032-edit-destructive-enrollment-invalida-review.md)
- Embedding gating: [ADR-0013](../decisions/0013-embedding-gated-en-transiciones-a-published.md)
- Reseñas opcionales con premium features: [ADR-0028](../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md)
- Edit de Review solo desde published: [ADR-0012](../decisions/0012-edicion-de-resena-solo-desde-published.md)
- ReviewAuditLog como projection: [ADR-0031](../decisions/0031-review-audit-log-como-projection.md)
- Wolverine como mediator: [ADR-0015](../decisions/0015-wolverine-como-mediator-y-message-bus.md)
