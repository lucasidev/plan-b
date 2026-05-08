# EventStorming (planb)

Captura del discovery de DDD del proyecto. Reproducimos en formato markdown lo que típicamente sería un mural con sticky notes de colores siguiendo la metodología de Alberto Brandolini.

**Convenciones**:

- 🟧 **Domain Event** (en pasado): algo que ya pasó.
- 🟦 **Command** (en imperativo): intent que dispara algo.
- 🟨 **Actor**: quién ejecuta el command.
- 🟪 **Policy**: regla "cuando X event → entonces Y command".
- 🟩 **Read model**: query usada para validar invariantes o tomar decisiones.
- ⚠️ **Hot spot**: pregunta sin respuesta, ambigüedad, decisión pendiente al momento del discovery.

Este doc no es la verdad final del modelo: la verdad vive en `strategic/`, `tactical/` y los ADRs. Acá se captura el **proceso** que llevó a esas decisiones, para que un revisor o un futuro contribuidor pueda reconstruir el razonamiento.

---

## Loop central del negocio

El producto resuelve un loop concreto: **review-driven semester planning**.

```
[ONBOARDING: único por alumno]
  Visitor anónimo → registra cuenta → verifica email → crea StudentProfile → carga historial inicial

[LOOP: iterativo, cada cuatrimestre]
  Planifica → Cursa (off-system) → Registra resultado → Reseña (opcional pero esperada) → Reacciona ↻

[GOBERNANZA paralela: no en el loop]
  Admin precarga catálogo, modera staff, gestiona cuentas
  Moderador opera cola de reseñas en revisión
  Docente verificado responde reseñas sobre sí mismo
  University staff observa agregados de su universidad
```

Todo lo demás (búsqueda, exploración pública, etc.) son enablers o vistas de lectura sobre este esqueleto.

---

## 1. Onboarding del alumno

Ocurre una vez por alumno (o pocas: si crea profiles para múltiples carreras).

| Event 🟧 | Command 🟦 | Actor 🟨 | Read models 🟩 | Policies 🟪 |
|---|---|---|---|---|
| `UserRegistered` | `RegisterUser(email, password)` | Visitor | `EmailIsAvailable(email)` (no User no-expirado con ese email) | → `IssueVerificationToken(userId, purpose=UserEmailVerification)` |
| `VerificationTokenIssued` | `IssueVerificationToken(userId, purpose, ttl)` | System (policy de UserRegistered o Resend) | `UserExists(userId)`, `UserHasActiveTokenForPurpose(userId, purpose)` | → integration: enviar email vía SMTP (Mailpit dev, relay prod) |
| `VerificationTokenConsumed` | `ConsumeVerificationToken(rawValue)` | Visitor (click en link) | `TokenExists(rawValue)`, `TokenIsActive(rawValue)` | → `MarkUserEmailVerified(userId)` |
| `UserEmailVerified` | `MarkUserEmailVerified(userId)` | System (policy de TokenConsumed) |: | (none: capability "create profile" se desbloquea implícitamente) |
| `VerificationTokenInvalidated` | `InvalidateVerificationToken(tokenId, reason)` | System (en resend o expiry job) |: | → si reason='resend': `IssueVerificationToken(userId, purpose)` |
| `UnverifiedRegistrationExpired` | `ExpireUnverifiedRegistration(userId)` | System (scheduled job, daily) | `UserIsUnverified(userId)`, `RegisteredMoreThan(userId, 7.days)` | (none: terminal state; email queda re-claimable) |
| `StudentProfileCreated` | `CreateStudentProfile(userId, careerPlanId, enrollmentYear)` | Member verificado | `UserIsVerified(userId)`, `CareerPlanExists(careerPlanId)`, `NoActiveProfileForPair(userId, careerPlanId)` | (none: habilita commands sobre EnrollmentRecord para esta carrera) |
| `HistorialImportRequested` | `SubmitHistorialImport(studentProfileId, sourceType, raw)` | Alumno | `StudentProfileOwnedBy(profileId, userId)`, `SourceFormatValid(sourceType, raw)` | → `ProcessHistorialImport(importId)` (background worker, async) |
| `HistorialImportCompleted` | `CompleteHistorialImport(importId, results)` | System (worker) |: | → batch de `CreateEnrollmentRecord(...)` por cada row resuelto |
| `HistorialImportFailed` | `FailHistorialImport(importId, error)` | System (worker, en exception) |: | → integration: notificar alumno, sugerir flow manual |
| `EnrollmentRecordCreated` | `CreateEnrollmentRecord(profileId, subjectId, status, ...)` | Alumno (manual) o System (desde import) | `SubjectInPlan(subjectId, profile.careerPlanId)`, `NoDuplicate(profileId, subjectId, termId)`, invariantes de status/grade | (none: pero invalida queries de "materias disponibles" para simulador) |
| `EnrollmentRecordEdited` | `UpdateEnrollmentRecord(recordId, changes)` | Alumno (autor) | `EnrollmentRecordOwnedBy(recordId, userId)`, invariantes | → si edit destructive (cambio a status='cursando' habiendo Review): `InvalidateReview(reviewId)` cross-BC |

⚠️ **Hot spots resueltos durante este momento**:

- **HOT 1**: ¿Atomic o eventual la emisión del token? **Eventual via outbox.** El token se emite en una transacción separada al `UserRegistered`. Wolverine outbox garantiza durabilidad. Esto contradice la implementación actual de S0 (atomic) → flagged como deuda en S1.
- **HOT 2**: ¿Modelar stuck users? **Sí**, expire después de 7 días sin verificar. Email queda re-claimable vía índice único parcial `WHERE expired_at IS NULL`.

---

## 2. Loop iterativo: Planificación

El alumno usa el simulador para decidir qué cursar. La simulación en sí **no genera events** (es query/computación). Los events aparecen cuando el alumno **persiste** algo.

| Event 🟧 | Command 🟦 | Actor 🟨 | Notas |
|---|---|---|---|
| `SimulationDraftSaved` | `SaveSimulationDraft(profileId, materias[], termId)` | Alumno | Privado por default |
| `SimulationDraftEdited` | `UpdateSimulationDraft(draftId, changes)` | Alumno (autor) | Cambia composición |
| `SimulationDraftDeleted` | `DeleteSimulationDraft(draftId)` | Alumno (autor) | Hard delete; el draft no aporta a auditorías |
| `SimulationDraftShared` | `ShareSimulationDraft(draftId)` | Alumno (autor) | Pasa a corpus público-anónimo |
| `SimulationDraftUnshared` | `UnshareSimulationDraft(draftId)` | Alumno (autor) | Vuelve a privado |

⚠️ **Hot spots**:

- **HOT 9**: ¿`SimulationDraft` en BC propio (Planning) o dentro de Enrollments? **BC propio**: distinción semántica futuro vs pasado vale la separación.
- Discusión "¿reseñas obligatorias o opcionales?" se resolvió aquí: **opcionales con incentivos** (capability rewards en lugar de gating). Ver ADR-0028.

**Read models para el simulador** (no emiten events, son queries puras):

- `AvailableSubjectsForTerm(profileId, termId)`: devuelve subjects que cumplen correlativas para_cursar dado el historial.
- `BlockedSubjectsForTerm(profileId, termId)`: devuelve subjects bloqueadas + qué correlativa falta.
- `CombinationMetrics(profileId, materias[])`: carga horaria, dificultad ponderada, histograma de combinaciones similares.
- `PublicSimulations(careerPlanId, termId)`: simulations compartidas por otros, anonimizadas.

---

## 3. Loop iterativo: Registrar (idéntico a onboarding)

Mismos events que onboarding (`EnrollmentRecordCreated`, `EnrollmentRecordEdited`). En el loop iterativo se ejecutan con frecuencia.

---

## 4. Loop iterativo: Reseñar

| Event 🟧 | Command 🟦 | Actor 🟨 | Read models 🟩 / Policies 🟪 |
|---|---|---|---|
| `ReviewPublished` | `PublishReview(enrollmentRecordId, dificultad, subject_text?, teacher_text?, docente_reseñado)` | Alumno (autor del EnrollmentRecord) | RM: `FilterEvaluation(text)` (domain service `IReviewContentFilter`); 🟪: si filter clean → `published`; 🟪: kick async job de embedding |
| `ReviewQuarantined` | `QuarantineReview(reviewId, reason)` | System (policy de filter trigger O threshold de reports) | (none directo; mod queue lo recoge) |
| `ReviewEdited` | `EditReview(reviewId, changes)` | Alumno (autor) | RM: re-corre filter sobre nuevo texto; si previamente había TeacherResponse, marca "editada después de respuesta" |
| `ReviewInvalidated` | `InvalidateReview(reviewId, reason='enrollment_changed')` | System (policy cross-BC) | Disparado por `EnrollmentRecordEdited` (edit destructive) |
| `ReviewRemoved` | (resultante de `UpholdReport`) | System (policy) |: |
| `ReviewRestored` | `RestoreReview(reviewId)` | Moderator | Tras apelación |

⚠️ **Hot spots resueltos**:

- **HOT 5**: ¿Edit destructive de EnrollmentRecord rechaza la edit, invalida la Review, o ignora? **Invalida la Review** (Review pasa a `under_review`). Cross-BC vía outbox. Ver ADR-0032.
- **Auto-filter**: domain service `IReviewContentFilter`, no parte del aggregate. App service obtiene el verdict y lo pasa al aggregate `Review.Publish(verdict)`.
- **`ReviewEmbedding`** no es event ni aggregate: es un read model derivado, computado async.

---

## 5. Loop iterativo: Reaccionar (governance interna del loop)

### 5a. Reportar

| Event 🟧 | Command 🟦 | Actor 🟨 |
|---|---|---|
| `ReviewReported` | `ReportReview(reviewId, reason, details?)` | User logueado (≠ author de Review) |
| (policy) `ReportThresholdReached` | (no es event, es trigger) → `QuarantineReview` | System |

🟩 RM: `UserAlreadyReported(userId, reviewId)`, `IsAuthor(userId, reviewId)` para validaciones del command.

### 5b. Moderador resuelve

| Event 🟧 | Command 🟦 | Actor 🟨 | Notas |
|---|---|---|---|
| `ReportUpheld` | `UpholdReport(reportId, resolutionNote)` | Moderator | 🟪 cascade: marca otros reports abiertos sobre la misma review como upheld; 🟪: `ReviewRemoved` |
| `ReportDismissed` | `DismissReport(reportId, resolutionNote)` | Moderator | Si era el único report open y review estaba `under_review`, `Review.status='published'` |

### 5c. Docente verificado responde

| Event 🟧 | Command 🟦 | Actor 🟨 |
|---|---|---|
| `TeacherResponsePublished` | `PostTeacherResponse(reviewId, text)` | Docente verificado (TeacherProfile.verified_at NOT NULL, teacher_id matching docente_reseñado_id) |
| `TeacherResponseEdited` | `EditTeacherResponse(reviewId, text)` | Docente autor de la response |

⚠️ **Hot spots resueltos**:

- **HOT 11**: Cross-BC consistency entre Enrollments → Reviews → Moderation. **Eventual via Wolverine outbox.** Ver ADR-0030.
- **HOT 10**: `ReviewAuditLog`: ¿aggregate o projection? **Projection.** Append-only, sin invariantes complejos. Listener escucha events de Review/Report/Response y persiste en `review_audit_log`.

---

## 6. Gobernanza paralela

No están en el loop iterativo del alumno. Tienen lifecycle propio.

### 6a. Admin: catálogo

| Event 🟧 | Aggregate / Entity |
|---|---|
| `UniversityCreated`, `UniversityUpdated` | University |
| `CareerCreated`, `CareerUpdated` | Career |
| `CareerPlanCreated`, `CareerPlanRetired` | CareerPlan |
| `SubjectCreated`, `SubjectUpdated`, `SubjectArchived` | Subject |
| `PrerequisiteAdded`, `PrerequisiteRemoved` | Subject (operación sobre el child Prerequisite) |
| `TeacherCreated`, `TeacherUpdated`, `TeacherDeactivated` | Teacher |
| `AcademicTermCreated`, `AcademicTermUpdated` | AcademicTerm |
| `CommissionCreated`, `CommissionUpdated`, `CommissionTeacherAssigned`, `CommissionTeacherUnassigned` | Commission (CommissionTeacher es child entity) |

Actor: Admin. Read models para validación de invariantes intra-aggregate.

⚠️ **Hot spots**:

- **HOT 12**: Aciclicidad del grafo de Prerequisites. **Domain service `IPrerequisiteGraphValidator`** simula la inserción + BFS para detectar ciclo. Cross-aggregate ⇒ no vive en ningún aggregate. Ver ADR-0029.
- **HOT 13**: Hard delete vs soft delete en catálogo. **Soft delete only** (`status='inactive'` o `archived_at`) para no perder auditoría. Hard delete rechazado si está referenciado downstream.

### 6b. Admin: gestión de cuentas

| Event 🟧 | Command 🟦 | Actor 🟨 |
|---|---|---|
| `StaffUserCreated` | `CreateStaffUser(email, password, role IN (moderator, admin, university_staff))` | Admin |
| `UserDisabled` | `DisableUser(userId, reason, byId)` | Moderator / Admin |
| `UserRestored` | `RestoreUser(userId)` | Moderator / Admin |

⚠️ **HOT 14**: Staff users **auto-verified** (`email_verified_at = creation_time`, sin token). Admin presume validez del email.

### 6c. Claim de identidad docente

| Event 🟧 | Command 🟦 | Actor 🟨 |
|---|---|---|
| `TeacherProfileClaimInitiated` | `InitiateTeacherClaim(userId, teacherId)` | Member verificado |
| `TeacherProfileInstitutionalEmailSubmitted` | `SubmitInstitutionalEmail(profileId, email)` | Claim owner |
| `VerificationTokenIssued` (purpose=TeacherInstitutionalVerification) | `IssueVerificationToken(claimOwnerId, purpose, ttl)` | System (policy) |
| `VerificationTokenConsumed` | `ConsumeVerificationToken(rawValue)` | Claim owner (link) |
| `TeacherProfileVerifiedByInstitutionalEmail` | `MarkTeacherProfileVerified(profileId, method=institutional_email)` | System (policy) |
| `TeacherProfileEvidenceSubmitted` | `SubmitManualEvidence(profileId, files[])` | Claim owner |
| `TeacherProfileVerifiedManually` | `ApproveTeacherProfile(profileId, byAdminId)` | Admin |
| `TeacherProfileVerificationRejected` | `RejectTeacherProfile(profileId, reason, byAdminId)` | Admin |

⚠️ **HOT 15**: ¿`VerificationToken` es aggregate independiente? **No, es child entity** dentro de User y dentro de TeacherProfile. Mismo shape de entity, parametrizada por `purpose`. Ver ADR-0033 (que también cubre Prerequisite, CommissionTeacher, TeacherResponse).

### 6d. Mod queue + Staff dashboard

No emiten events, son queries:

- 🟩 `ReviewsUnderReview()`: cola de moderación.
- 🟩 `ReviewAuditLogFor(reviewId)`: historial completo de una review.
- 🟩 `UniversityDashboard(universityId)`: agregados de reseñas + tasas de abandono + combinaciones que más fallan, scoped a la universidad del staff.

---

## Inventario emergente: aggregates y entities

Resumen de lo que apareció en el discovery. Detalle completo en `tactical/aggregates.md`.

**6 Bounded Contexts**: Identity, Academic, Enrollments, Reviews, Moderation, Planning.

**4 aggregates con complejidad interna (root + children)**:

- User (con VerificationToken como child entity)
- Subject (con Prerequisite como child)
- Commission (con CommissionTeacher como child)
- Review (con TeacherResponse como child)

**11 standalone entities** (single-entity aggregates, sin children pero con repositorio propio):

- StudentProfile, TeacherProfile, University, Career, CareerPlan, Teacher, AcademicTerm, HistorialImport, EnrollmentRecord, ReviewReport, SimulationDraft

**4 child entities** (viven dentro de un aggregate root):

- VerificationToken, Prerequisite, CommissionTeacher, TeacherResponse

**2 projections / read models**:

- ReviewEmbedding (computado async post-publish)
- ReviewAuditLog (alimentado por listener de events)

---

## Hot spots: index final

Para que un revisor pueda saltar al razonamiento de cualquiera:

| HOT | Tema | Resolución | Doc |
|---|---|---|---|
| 1 | Atomic vs eventual emisión de token | Eventual via outbox | this doc, sección 1 |
| 2 | Stuck users (registrados sin verificar) | Expire después de 7 días | this doc, sección 1 |
| 3 | (n/a: descartado) |: |: |
| 4 | (n/a: descartado) |: |: |
| 5 | Edit destructive de EnrollmentRecord | Invalida Review (status=under_review) | ADR-0032 |
| 6 | EnrollmentRecord events: batch o individuales | Individuales | this doc, sección 1 |
| 7 | (anulado por HOT 15) |: |: |
| 8 | (n/a: descartado) |: |: |
| 9 | Planning BC separado | Sí | ADR-0029 |
| 10 | ReviewAuditLog: aggregate o projection | Projection | ADR-0031 |
| 11 | Cross-BC consistency | Eventual via Wolverine outbox | ADR-0030 |
| 12 | Aciclicidad de Prerequisite | Domain service | this doc, sección 6a |
| 13 | Hard vs soft delete catálogo | Soft only | this doc, sección 6a |
| 14 | Staff users: verification flow | Auto-verified | this doc, sección 6b |
| 15 | VerificationToken: aggregate o entity | Child entity | ADR-0033 |
