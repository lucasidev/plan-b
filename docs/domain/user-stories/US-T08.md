# US-T08: backfill de cobertura de lógica de valor y dominio puro

**Status**: Done
**Sprint**: S9
**Epic**: [EPIC-00](../epics/EPIC-00.md)
**Priority**: High
**Effort**: L
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)

## Como equipo, quiero cerrar los gaps de cobertura que dejó el audit para que la pirámide de tests (ADR-0036) se cumpla y el corpus proteja el comportamiento real, no solo los caminos de error

Un barrido de cobertura del repo (código vs tests por capa, cada gap confirmado por dos revisores independientes) encontró **28 gaps reales**. El patrón es consistente: los caminos de error (404, 409, authz, validación de entrada) están cubiertos por integration tests, pero **la lógica de valor y el dominio puro no están cubiertos en ninguna capa**: parsers, el loop central de importar, las máquinas de estado de los aggregates, el anti-abuso (rate limit) y el filtro de PII. Es justo lo que la pirámide manda testear barato con unit tests, y hoy tiene cero.

Esta US cierra esos 28 gaps, cada uno en su capa correcta (domain unit / handler unit / integration / vitest), sin agregar features ni cobertura por cobertura.

## Acceptance Criteria

Cada ítem = un test (o set de casos) en su capa, verde en CI. Agrupados por módulo.

### Backend (domain unit / handler unit)

**academic**
- [x] `CareerPlanParser` (unit): headers `año X`/`cuatrimestre Y`, override `anual` (termKind=Anual, termInYear=null), detección de nombre, scoring de confidence. Casos: `Primer año`→year=1, materia `anual`, materia sin año→Low+issue, texto sin código→Items vacío.
- [x] `ProcessCareerPlanImportCommandHandler` (handler unit): PDF vacío/encriptado/sin-texto/rawText-blanco→MarkFailed, excepción de extractor/parser→MarkFailed, timeout 60s→FailAndSave, import inexistente→drop, MarkParsing sobre no-Pending→drop.
- [x] `CareerPlanImport` aggregate (domain unit): guardas Create (CareerNameRequired, PlanYearOutOfRange) + transiciones (MarkParsing/Parsed/Failed/Approved).
- [x] `ApproveCareerPlanImportCommandHandler` (handler unit): reuse-or-create Career, skip materias inválidas, todas inválidas→NoItemsSelected, materialización + publica CareerPlanImported.
- [x] `CareerPlan` aggregate (domain unit): Create valida año (YearOutOfRange); MarkOfficial idempotente.

**enrollments**
- [x] `HistorialImport` aggregate (domain unit): máquina de estados (MarkParsing/Parsed/Failed/Confirmed) con guardas de transición.
- [x] `ConfirmHistorialImportCommandHandler` (handler unit): camino feliz, create-por-item + skip de (student,subject,term) existente → CreatedCount/SkippedCount (valor central de US-014).
- [x] `ProcessHistorialImportCommandHandler` (handler unit): ramas de fallo (encriptado, vacío, excepción de extracción/parser, profile/plan inexistente, timeout)→Failed.

**reviews**
- [x] `RegexReviewContentFilter` (unit): reglas PII (email, teléfono AR, DNI), Clean vs Triggered por patrón.
- [x] `Review.Edit` (domain unit): invariante post-patch (vaciar ambos textos→AtLeastOneTextRequired) + semántica de patch parcial (`*Provided` vs null).
- [x] `FinalGrade.Create` (domain unit): redondeo 2 decimales AwayFromZero + cotas [0,10].

**moderation**
- [x] `ReportReviewCommandHandler` (handler unit): rama rate-limit (`!Allowed`→RateLimitExceeded 429) con IRateLimiter mockeado.
- [x] `ReviewReport.Create` (domain unit): trim de details + MaxDetailsLength→DetailsTooLong.
- [x] `UpholdReport`/`DismissReportCommandHandler` (handler unit): report null→ReportNotFound (404).

**identity**
- [x] `User.Deactivate` (domain unit): swap de email anonimizado, PasswordHash sentinel, limpieza de owned collections, raise del domain event, guarda AlreadyDeactivated.
- [x] `User.UpdateActiveStudentProfile` (domain unit): AccountNotActive, StudentProfileNotFound, DisplayNameInvalid (trim), YearOfStudyOutOfRange, LegajoInvalid.
- [x] `User.ChangePassword` (domain unit): PasswordTooLong (>200), same-as-current ordinal, orden de guardas.
- [x] `SignInCommandHandler` (handler unit): anti-enumeration, email malformado→InvalidCredentials (no 400).

### Frontend (vitest)

- [x] `add-enrollment/schema` (Zod): 5 refines cross-field (Aprobada, Regular, Cursando, Equivalencia, FinalLibre).
- [x] `change-password/actions`: map ProblemDetails.title→kind + limpieza de cookies en 204.
- [x] `import-career-plan/actions`: branch multipart (File) vs JSON (rawText), gates de tamaño + `.pdf`.
- [x] `write-review/schema` (Zod): transform ''→undefined + refine condicional (min 50 solo si hay texto), rangos.
- [x] `write-review/actions`: guardas pre-fetch (docenteResenadoId faltante, JSON.parse con catch, gate text requerido).
- [x] `moderate-reports/actions`: gate isStaff(), gate MAX_NOTE, flag conflict en 409.
- [x] `change-password/schema` (Zod): refines newPassword===confirm y currentPassword!==newPassword.
- [x] `import-career-plan/components/preview-table`: selección inicial por confianza + armado del payload.
- [x] `settings/components/toggle-setting`: update optimista + rollback-on-error.

## Out of scope

- **No** features nuevas: solo tests sobre código existente.
- **No** cobertura por cobertura: cada gap es lógica real confirmada, no getters/setters.
- **`DapperReportQueueReader.olderThan`** (filtro SQL): es un gap real pero solo testeable en integration (Postgres real); se difiere junto con cualquier otro gap que requiera infra a un slice de integración separado si hace falta. El resto de esta US no necesita infra.
- **Rama de timeout de 60s** de los workers async (`ProcessHistorialImportCommandHandler`, `ProcessCareerPlanImportCommandHandler`): `ProcessingTimeout` es un `static readonly` de 60s no inyectable, así que testear esa rama pediría esperar 60s reales o un cambio de producción (inyectar el timeout / un `TimeProvider`). Se difiere: cerrarla es tarea de producción, no de test. (Descubierto de forma independiente por dos agentes, lo que valida el hallazgo.)

## Notas de implementación

- **Cada test en su capa** (regla dura ADR-0036): dominio puro → domain unit (xUnit + Shouldly, sin mocks, `FixedClock` para el reloj); handler con deps → handler unit (xUnit + NSubstitute); solo lo que necesita SQL/wiring real → integration.
- **Forward-compat con NSubstitute 6** (US en vuelo): en los handler unit tests, usar null-forgiving (`!`) en la primera desreferencia de los predicados `Arg.Is<T>(x => x.Member)`.
- **El audit dejó la lista**: no se re-descubre; se cierra ítem por ítem.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Pirámide: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
- Convenciones: [`docs/testing/conventions.md`](../../testing/conventions.md)
- Relacionada: [US-T07-b](US-T07-b.md) (architecture tests), [US-T04-b](US-T04-b.md)
