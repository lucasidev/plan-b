# User Stories — planb

Catálogo de user stories del MVP. Cada US se mapea 1:1 con un UC del catálogo (`actors-and-use-cases.md`). El UC describe el flow técnico-funcional; la US lo expresa como valor entregable al usuario.

**Convención de IDs**: `US-NNN` con el mismo número del UC origen. UCs nuevos del discovery (`UC-NEW-NN`) se renumeran al integrarse al doc canónico (próximo turno).

**Formato de cada US**:

```
US-NNN — <Título corto>
  Como <actor>, quiero <action> para <benefit>.

  AC:
  - <criterio 1>
  - <criterio 2>
  ...

  Refs: UC-NNN, ADR-X, ADR-Y
  Epic: EPIC-NN
  Phase: N
  Effort: S | M | L
```

**Effort**: Small ≈ 1-3 días, Medium ≈ 3-7 días, Large ≈ 1-2 semanas.

---

## EPIC-01 — Catálogo público y exploración

### US-001 — Explorar catálogo de universidades y carreras

Como **visitante anónimo**, quiero **navegar el catálogo de universidades, sus carreras, sus planes y sus materias** para tener contexto antes de registrarme o buscar reseñas.

AC:
- `GET /api/universities` retorna listado paginado con (name, short_name, country, city, slug).
- `GET /api/universities/{slug}/careers` retorna las carreras de una universidad.
- `GET /api/careers/{id}/plans` retorna sus CareerPlans con el vigente destacado (effective_to IS NULL).
- `GET /api/career-plans/{id}/subjects` retorna materias agrupadas por año + cuatrimestre con sus correlativas.
- Sin autenticación requerida.

Refs: UC-001, [ADR-0001](../decisions/0001-multi-universidad-desde-dia-1.md), [ADR-0002](../decisions/0002-versionado-de-planes-de-estudio.md).
Epic: EPIC-01. Phase: 3. Effort: M.

### US-002 — Ver materia con sus reseñas

Como **visitante anónimo**, quiero **ver una materia con sus reseñas anonimizadas y agregados** para evaluarla antes de inscribirme.

AC:
- `GET /api/subjects/{id}` retorna metadata + agregados (rating promedio, histograma, conteo).
- `GET /api/subjects/{id}/reviews` retorna lista paginada de reviews `published`, sin identidad del autor.
- Cada review muestra dificultad, textos, docente reseñado (nombre del Teacher), fecha relativa.

Refs: UC-002, [ADR-0009](../decisions/0009-anonimato-como-regla-de-presentacion.md).
Epic: EPIC-01. Phase: 4 (depende de que reseñas estén operativas). Effort: M.

### US-003 — Ver docente con sus reseñas

Como **visitante anónimo**, quiero **ver un docente con las reseñas donde aparece como `docente_reseñado`** para tener contexto al elegir comisión.

AC:
- `GET /api/teachers/{id}` retorna metadata + agregados.
- `GET /api/teachers/{id}/reviews` lista de reviews donde fue el docente reseñado, anonimizadas.

Refs: UC-003.
Epic: EPIC-01. Phase: 4. Effort: M.

### US-004 — Buscar materia o docente

Como **visitante anónimo**, quiero **buscar materia o docente por texto libre** para llegar rápido a lo que me interesa.

AC:
- `GET /api/search?q=<text>` busca en `Subject.name`, `Subject.code`, `Teacher.first_name`, `Teacher.last_name`.
- Ordenado por relevancia (prioridad a code exacto, luego prefix matches, luego full-text).
- Retorna mix de subjects y teachers con tipo discriminado.

Refs: UC-004.
Epic: EPIC-01. Phase: 4. Effort: S.

---

## EPIC-02 — Identidad y autenticación

### US-010 — Registrarse

Como **visitante**, quiero **registrarme con email + password** para crear mi cuenta y empezar a usar la plataforma.

AC:
- `POST /api/identity/register` acepta `{ email, password }`.
- Email validado: formato + unicidad case-insensitive entre users non-expired.
- Password ≥ 12 chars, hasheado con BCrypt cost 12.
- Crea User con role=member, email_verified_at=null.
- Genera VerificationToken (TTL 24h, opaque 256-bit base64url, purpose=UserEmailVerification).
- Envía email vía SMTP con link a `/verify-email?token=...`.
- Retorna 201 con `{ id, email }`; 409 si email duplicado; 400 si validación.
- **Status: ✓ Done en main** (slice B + cleanup).

Refs: UC-010, [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md), ADR-0033.
Epic: EPIC-02. Phase: 2. Effort: M.

### US-011 — Verificar email

Como **user recién registrado**, quiero **clickear el link de verificación** para activar mi cuenta.

AC:
- `GET /api/identity/verify?token=<value>` consume el VerificationToken con purpose=UserEmailVerification.
- Idempotente: doble click no rompe (segundo retorna 200 sin cambio).
- Token inválido / expirado / consumido → 400 con error code distinguible.
- Marca `User.EmailVerifiedAt = now()`.
- Retorna 204 (o redirect a UI de confirmación según ADR de UX).
- **Slice C** — implementa este UC. Como parte del slice se refactoriza `EmailVerificationToken` → `VerificationToken` child entity de User (ADR-0033).

Refs: UC-011, ADR-0033.
Epic: EPIC-02. Phase: 2. Effort: S.

### US-012 — Crear StudentProfile

Como **member con email verificado**, quiero **crear un StudentProfile asociando una carrera + plan + año de ingreso** para desbloquear capabilities de alumno (cargar historial, simular, reseñar).

AC:
- `POST /api/me/student-profiles` con `{ careerPlanId, enrollmentYear }`.
- Requiere User authenticated + email_verified_at NOT NULL.
- Valida CareerPlan existe.
- Valida no haya StudentProfile activo del mismo user para el mismo plan.
- enrollmentYear ∈ [1950, año actual].
- Crea StudentProfile con status=active.
- Retorna 201.
- **Slice D**.

Refs: UC-012, [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).
Epic: EPIC-02. Phase: 2. Effort: M.

### US-068 — Deshabilitar cuenta member

Como **moderator o admin**, quiero **deshabilitar una cuenta member** para suspender el acceso ante abuso o pedido del usuario.

AC:
- `POST /api/admin/users/{id}/disable` con `{ reason }`.
- Requiere role moderator o admin.
- Setea `User.disabled_at`, `disabled_reason`, `disabled_by=actor.id`.
- User no puede loguearse mientras esté disabled.
- Sus reviews quedan en DB (soft delete); presentation hace soft-flag.
- Emite `UserDisabled` integration event.

Refs: UC-068, [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).
Epic: EPIC-02. Phase: 5. Effort: S.

### US-NEW-01 — Reenviar verification email

Como **user pendiente de verificar**, quiero **pedir reenvío del email de verificación** para recuperar el flujo si el email no llegó o el token expiró.

AC:
- `POST /api/identity/resend-verification` con `{ email }`.
- Si user no existe o ya está verificado: retorna 200 sin revelar diferencia (anti-enumeration).
- Si user existe y no está verificado: invalida tokens activos del purpose=UserEmailVerification y emite uno nuevo.
- Rate limit: ≤ 3 reenvíos por hora por user.
- Emite `VerificationTokenInvalidated` + `VerificationTokenIssued`.

Refs: nuevo (no existe UC documentado para esto).
Epic: EPIC-02. Phase: 2. Effort: S.

### US-NEW-02 — Expirar registro no verificado

Como **sistema (scheduled job)**, quiero **expirar registros que no fueron verificados en 7 días** para liberar el email y mantener limpio el state space.

AC:
- Job daily a las 3 AM UTC.
- Query: `User WHERE email_verified_at IS NULL AND expired_at IS NULL AND registered_at < now() - 7 days`.
- Por cada match: setea `expired_at = now()`. El email vuelve a estar disponible vía índice único parcial.
- Emite `UnverifiedRegistrationExpired` event.
- Logging: cantidad procesada por run.

Refs: nuevo.
Epic: EPIC-02. Phase: 5 (no es crítico para MVP funcional, pero antes del lanzamiento público).  Effort: S.

---

## EPIC-03 — Historial académico

### US-013 — Cargar historial manual

Como **alumno**, quiero **agregar entradas al historial materia por materia** para registrar lo que ya cursé.

AC:
- `POST /api/me/enrollment-records` con `{ subjectId, academicTermId, status, grade?, approvalMethod?, commissionId? }`.
- Valida subjectId ∈ subjects del CareerPlan del profile.
- Invariantes: status='aprobada' ⇒ grade NOT NULL, approvalMethod NOT NULL; status='cursando' ⇒ grade NULL, approvalMethod NULL; grade ∈ [0,10]; sin duplicados (profileId, subjectId, termId).
- Retorna 201.

Refs: UC-013, [ADR-0004](../decisions/0004-enrollment-guarda-hechos.md).
Epic: EPIC-03. Phase: 3. Effort: M.

### US-014 — Importar historial desde PDF/texto

Como **alumno avanzado**, quiero **subir mi historial en PDF o texto** para no cargar 30 materias a mano.

AC:
- `POST /api/me/historial-imports` con multipart o body texto + `{ sourceType }`.
- Crea HistorialImport status=pending.
- Worker async procesa: extrae materias, resuelve contra Subjects del plan via códigos.
- Por cada match: crea EnrollmentRecord (o actualiza si existía).
- Reporte de no-resueltos persiste como parte de HistorialImport.results.
- Cliente puede consultar status: `GET /api/me/historial-imports/{id}`.

Refs: UC-014, [ADR-0006](../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md).
Epic: EPIC-03. Phase: 5 (post-MVP funcional — el manual flow alcanza para focus group). Effort: L.

### US-015 — Editar entrada del historial

Como **alumno**, quiero **modificar una entrada de mi historial** para corregir datos o actualizar status (ej. de "cursando" a "aprobada" cuando termina el cuatrimestre).

AC:
- `PATCH /api/me/enrollment-records/{id}` con cambios.
- Valida ownership.
- Re-valida invariantes post-edit.
- Si edit destructive (cambio a status='cursando' habiendo Review existente): UI confirma + emite `EnrollmentRecordEdited` que Reviews observa para invalidar la review (pasa a `under_review`).

Refs: UC-015, ADR-0032.
Epic: EPIC-03. Phase: 4. Effort: S.

---

## EPIC-04 — Planificación de cuatrimestre

### US-016 — Simular inscripción

Como **alumno**, quiero **probar combinaciones de materias para el próximo cuatrimestre** para decidir cuáles cursar antes de inscribirme.

AC:
- `GET /api/me/simulator/available?termId=` retorna materias disponibles (cumplen correlativas para_cursar) y bloqueadas (con razón).
- `POST /api/me/simulator/evaluate` con `{ subjectIds[] }` retorna métricas: carga horaria total, dificultad promedio ponderada, histograma de combinaciones similares cursadas por otros con sus tasas.
- No persiste nada — solo computación de read models.
- Rechaza materias bloqueadas con detalle de qué correlativa falta.

Refs: UC-016, [ADR-0003](../decisions/0003-correlativas-con-dos-tipos.md), [ADR-0004](../decisions/0004-enrollment-guarda-hechos.md).
Epic: EPIC-04. Phase: 4. Effort: L.

### US-NEW-03 — Guardar simulación como draft

Como **alumno**, quiero **guardar una simulación que me cierra como draft privado** para volver a ella después.

AC:
- `POST /api/me/simulations/drafts` con `{ subjectIds[], termId, label? }`.
- Crea SimulationDraft visibility=private, owner=mi profile.
- `GET /api/me/simulations/drafts` lista mis drafts.
- `PATCH /api/me/simulations/drafts/{id}` actualiza composición.
- `DELETE /api/me/simulations/drafts/{id}` hard delete.

Refs: nuevo, ADR-0028, ADR-0029.
Epic: EPIC-04. Phase: 4. Effort: M.

### US-NEW-04 — Compartir simulación al corpus

Como **alumno**, quiero **publicar una simulación al corpus público (anonimizada)** para que otros alumnos vean opciones consideradas.

AC:
- `POST /api/me/simulations/drafts/{id}/share` flips visibility a 'shared'.
- `POST /api/me/simulations/drafts/{id}/unshare` la vuelve a privada.
- Mientras es shared, aparece en `GET /api/simulations/public?planId=&termId=` anonimizada.

Refs: nuevo, ADR-0028.
Epic: EPIC-04. Phase: 4. Effort: S.

### US-NEW-07 — Ver simulaciones públicas

Como **alumno con StudentProfile**, quiero **navegar simulaciones publicadas por otros alumnos del mismo plan + cuatrimestre** para ver qué combinaciones se están considerando.

AC:
- `GET /api/simulations/public?planId=&termId=` retorna simulaciones shared anonimizadas con composición + métricas agregadas.
- Requiere authenticated + StudentProfile activo.

Refs: nuevo.
Epic: EPIC-04. Phase: 4. Effort: S.

### US-NEW-08 — Recibir simulación recomendada (post-MVP)

Como **alumno**, quiero **ver una recomendación automática de combinación de materias** para tener punto de partida sin armar desde cero.

AC: stub — feature post-MVP. Cuando se aborde, definir AC concretos basado en algoritmo elegido (collaborative filtering vs heurísticas vs embedding-based).

Refs: nuevo.
Epic: EPIC-04. Phase: post-MVP. Effort: L.

---

## EPIC-05 — Sistema de reseñas

### US-017 — Publicar reseña

Como **alumno**, quiero **publicar una reseña sobre una cursada finalizada** para aportar al corpus que otros leerán.

AC:
- `POST /api/me/reviews` con `{ enrollmentRecordId, difficulty, subjectText?, teacherText?, docenteResenadoId }`.
- Requiere ownership del EnrollmentRecord + status != 'cursando' + sin Review existente.
- Valida `docenteResenadoId` ∈ teachers de la commission del enrollment.
- Al menos uno de subjectText/teacherText no vacío.
- difficulty ∈ [1,5].
- Domain service `IReviewContentFilter` evalúa: clean → published; triggered → under_review.
- Emite `ReviewPublished` o `ReviewQuarantined`.
- Async kicks ReviewEmbedding job.

Refs: UC-017, [ADR-0005](../decisions/0005-resena-anclada-al-enrollment.md), [ADR-0007](../decisions/0007-pgvector-implementado-ui-gated-off.md), [ADR-0009](../decisions/0009-anonimato-como-regla-de-presentacion.md), [ADR-0013](../decisions/0013-embedding-gated-en-transiciones-a-published.md).
Epic: EPIC-05. Phase: 4. Effort: L.

### US-018 — Editar reseña propia

Como **autor de una reseña**, quiero **editar mi reseña** para corregir o ampliar.

AC:
- `PATCH /api/me/reviews/{id}`.
- Solo desde status='published' (ADR-0012).
- Re-corre filter sobre nuevo texto.
- Si tenía TeacherResponse: marca "editada después de respuesta".
- Emite `ReviewEdited` + entry en audit log.

Refs: UC-018, [ADR-0012](../decisions/0012-edicion-de-resena-solo-desde-published.md).
Epic: EPIC-05. Phase: 4. Effort: S.

### US-019 — Reportar reseña

Como **user logueado (no autor)**, quiero **reportar una reseña que considero inapropiada** para que la modere alguien.

AC:
- `POST /api/reviews/{id}/reports` con `{ reason, details? }`.
- Valida reporter ≠ author.
- UNIQUE (review_id, reporter_id) — no duplicar reports del mismo user.
- Crea ReviewReport status=open.
- Si count(reports open) ≥ threshold (env config): auto-quarantine de la review.
- Emite `ReviewReported`.

Refs: UC-019, [ADR-0010](../decisions/0010-threshold-auto-hide-configurable-por-env-var.md).
Epic: EPIC-05. Phase: 4. Effort: M.

### US-020 — Ver mis reports

Como **user que reportó**, quiero **ver el estado de mis reports** para cerrar el ciclo de confianza con la moderación.

AC:
- `GET /api/me/reports` lista mis reports con status, reason, resolution_note (si resuelto).

Refs: UC-020.
Epic: EPIC-05. Phase: 4. Effort: S.

---

## EPIC-06 — Claim e identidad docente

### US-030 — Iniciar claim de docente

Como **member verificado**, quiero **reclamar identidad docente sobre un Teacher del catálogo** para empezar el flow de verificación.

AC:
- `POST /api/me/teacher-claims` con `{ teacherId }`.
- Crea TeacherProfile verified_at=null.
- Valida no haya claim previo del mismo user al mismo teacher.

Refs: UC-030, [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).
Epic: EPIC-06. Phase: 5. Effort: S.

### US-031 — Verificar docente por email institucional

Como **member con claim pendiente**, quiero **verificar mi identidad docente vía email institucional** para desbloquear capability de responder reseñas.

AC:
- `POST /api/me/teacher-claims/{id}/institutional-email` con `{ email }`.
- Valida domain ∈ Teacher.University.institutional_email_domains.
- Genera VerificationToken purpose=TeacherInstitutionalVerification, TTL 24h.
- Envía email al institutional_email con link.
- `GET /api/me/teacher-claims/verify?token=` consume y marca verified.
- UNIQUE: un Teacher tiene un solo TeacherProfile verified.

Refs: UC-031, [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md), ADR-0033.
Epic: EPIC-06. Phase: 5. Effort: M.

### US-032 — Solicitar verificación manual

Como **member con claim pendiente** sin email institucional disponible, quiero **subir evidencia (DNI, contrato, etc.)** para que un admin verifique manualmente.

AC:
- `POST /api/me/teacher-claims/{id}/evidence` con archivos.
- Persiste referencias a archivos (S3-style storage en dev = local).
- Claim queda en cola de admin.

Refs: UC-032.
Epic: EPIC-06. Phase: 5. Effort: M.

### US-040 — Responder reseña

Como **docente verificado**, quiero **responder una reseña sobre mí** para dar mi perspectiva.

AC:
- `POST /api/reviews/{id}/teacher-response` con `{ text }`.
- Valida author = TeacherProfile verificado donde teacher_id = review.docente_reseñado_id.
- Una sola response por review.
- Emite `TeacherResponsePublished`.

Refs: UC-040.
Epic: EPIC-06. Phase: 5. Effort: S.

### US-041 — Editar respuesta docente

Como **docente autor de la response**, quiero **editar mi respuesta** para corregir o ampliar.

AC:
- `PATCH /api/reviews/{id}/teacher-response`.
- Solo el author original puede editar.
- Emite `TeacherResponseEdited`.

Refs: UC-041.
Epic: EPIC-06. Phase: 5. Effort: S.

### US-066 — Verificar TeacherProfile manual (admin)

Como **admin**, quiero **revisar evidencia subida por members con claim pendiente** y aprobar o rechazar.

AC:
- `GET /api/admin/teacher-claims/pending` lista cola.
- `POST /api/admin/teacher-claims/{id}/approve` setea verified_at, verification_method='manual', verified_by=admin.id.
- `POST /api/admin/teacher-claims/{id}/reject` setea rejection_reason.
- Si ya hay otro TeacherProfile verified para mismo Teacher, no se puede aprobar; admin debe contactar al solicitante o de-verificar el previo.

Refs: UC-066, [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).
Epic: EPIC-06. Phase: 5. Effort: M.

---

## EPIC-07 — Moderación

### US-050 — Ver cola de reseñas under_review

Como **moderator**, quiero **ver cola de reseñas en revisión** ordenada por urgencia para priorizar mi trabajo.

AC:
- `GET /api/admin/reviews/queue` retorna reviews status='under_review' ordenadas por count(reports open) DESC, antigüedad ASC.

Refs: UC-050.
Epic: EPIC-07. Phase: 4. Effort: S.

### US-051 — Resolver report

Como **moderator**, quiero **resolver un report como upheld o dismissed** para limpiar la cola.

AC:
- `POST /api/admin/reports/{id}/uphold` con `{ resolutionNote }` → setea report status=upheld + cascade upheld a otros reports abiertos de la misma review + Review.status=removed + audit log.
- `POST /api/admin/reports/{id}/dismiss` con `{ resolutionNote }` → setea report status=dismissed; si era el único open y review estaba under_review → vuelve a published.

Refs: UC-051, [ADR-0011](../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md).
Epic: EPIC-07. Phase: 4. Effort: M.

### US-052 — Restaurar reseña removida

Como **moderator**, quiero **restaurar una reseña removida** ante apelación del autor.

AC:
- `POST /api/admin/reviews/{id}/restore` con `{ justification }`.
- Setea Review.status=published.
- Reports upheld históricos NO se revierten (ADR-0011).
- Audit log entry con action='restored'.

Refs: UC-052, [ADR-0011](../decisions/0011-cascade-on-uphold-sin-reversion-on-restore.md).
Epic: EPIC-07. Phase: 4. Effort: S.

### US-053 — Ver audit log

Como **moderator**, quiero **ver el historial completo de events de una reseña** para tener contexto al moderar.

AC:
- `GET /api/admin/reviews/{id}/audit-log` retorna entries de ReviewAuditLog ordenadas por at DESC.
- Cada entry: at, action, actor (con identidad visible para mod, no anonimizado), before/after diff.

Refs: UC-053.
Epic: EPIC-07. Phase: 4. Effort: S.

---

## EPIC-08 — Backoffice de catálogo

### US-060 — Gestionar University

Como **admin**, quiero **CRUD de Universities** para mantener el catálogo institucional.

AC: CRUD completo con validaciones de slug único, dominios institucionales normalizados.

Refs: UC-060, [ADR-0001](../decisions/0001-multi-universidad-desde-dia-1.md).
Epic: EPIC-08. Phase: 3. Effort: M.

### US-061 — Gestionar Career + CareerPlan

Como **admin**, quiero **gestionar Careers y sus versiones de plan** para reflejar cambios curriculares.

AC: crear Career bajo University, agregar CareerPlans con effective_from/to. Multiple plans por Career a lo largo del tiempo.

Refs: UC-061, [ADR-0002](../decisions/0002-versionado-de-planes-de-estudio.md).
Epic: EPIC-08. Phase: 3. Effort: M.

### US-062 — Gestionar Subject + Prerequisite

Como **admin**, quiero **CRUD de Subjects y sus correlativas** para definir el plan de estudios.

AC: agregar Subjects al CareerPlan; agregar Prerequisites validando aciclicidad del grafo (domain service); separar para_cursar vs para_rendir.

Refs: UC-062, [ADR-0003](../decisions/0003-correlativas-con-dos-tipos.md).
Epic: EPIC-08. Phase: 3. Effort: M.

### US-063 — Gestionar Teacher

Como **admin**, quiero **CRUD de Teachers** para tener el catálogo docente que después se claim-eará.

AC: nombre con normalización (lowercase storage, title case display), bio, photo_url. Soft delete via IsActive.

Refs: UC-063.
Epic: EPIC-08. Phase: 3. Effort: S.

### US-064 — Gestionar AcademicTerm

Como **admin**, quiero **CRUD de AcademicTerms** para que los EnrollmentRecords y Commissions tengan cuatrimestres a referenciar.

AC: year, number, kind, start/end_date, enrollment_opens/closes; label se computa.

Refs: UC-064.
Epic: EPIC-08. Phase: 3. Effort: S.

### US-065 — Gestionar Commission + CommissionTeacher

Como **admin**, quiero **CRUD de Commissions y asignación de teachers** para que los alumnos puedan referenciar comisiones reales.

AC: Subject + AcademicTerm + name + modality + capacity. Asignar teachers con role.

Refs: UC-065.
Epic: EPIC-08. Phase: 3. Effort: M.

---

## EPIC-09 — Backoffice de cuentas staff

### US-067 — Crear cuentas staff

Como **admin**, quiero **crear cuentas con role moderator/admin/university_staff** para incorporar gente al equipo operativo.

AC:
- `POST /api/admin/staff-users` con `{ email, password, role }`.
- email auto-verified (ADR-0014, HOT 14).
- No hay flow de auto-registro para estos roles ([ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md)).

Refs: UC-067, [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).
Epic: EPIC-09. Phase: 5. Effort: S.

---

## EPIC-10 — Dashboard institucional

### US-080 — Dashboard institucional

Como **university staff**, quiero **ver agregados anónimos de mi universidad** para tener insight sobre tasas de aprobación, dificultad de materias, combinaciones que más fallan.

AC:
- `GET /api/staff/dashboard` retorna agregados scoped a la universidad del staff.
- Métricas: rating + cantidad por subject/teacher; tasas de abandono y recursadas; combinaciones de cursada con peores tasas.
- Sin acceso a reseñas individuales ni identidades.

Refs: UC-080, [ADR-0009](../decisions/0009-anonimato-como-regla-de-presentacion.md).
Epic: EPIC-10. Phase: 5. Effort: L.

---

## Status snapshot

| Status | US count |
|---|---|
| Done | 1 (US-010) |
| In Progress | — |
| Not Started | 33 (todos los demás) |

Tracking operacional vive en Notion (DB `plan-b — User Stories`). Este doc es el catálogo canónico — Notion lo refleja con cross-link a este file vía property `Doc link`.
