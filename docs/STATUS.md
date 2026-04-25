# Estado del proyecto — planb

Tracking de avance por fases del cronograma original. Documento orientado a evaluación académica (Ing. Copas) — estado al día concreto, sin jerga de dev.

**Última actualización**: 2026-04-25.

---

## Resumen ejecutivo

| Fase | Título | Estado | Progreso |
|---|---|---|---|
| 1 | Diseño y modelado de datos | ✓ Completa | 100% |
| 2 | Backend y autenticación | 🔄 En progreso | 40% (2 de 5 slices entregadas) |
| 3 | Precarga de planes + frontend base | ⏳ Pendiente | 0% |
| 4 | Simulador + sistema de reseñas | ⏳ Pendiente | 0% |
| 5 | Dashboard institucional + verificación de docentes | ⏳ Pendiente | 0% |
| 6 | Focus group cerrado + ajustes | ⏳ Pendiente | 0% |
| 7 | Lanzamiento público | ⏳ Pendiente | 0% |

---

## Fase 1 — Diseño y modelado de datos ✓

**Entregables completados**:

- **27 ADRs** (`docs/decisions/`) cubriendo decisiones de dominio, arquitectura, frontend, tooling y workflow.
- **5 documentos de dominio** (`docs/domain/`):
  - `ubiquitous-language.md` — glosario.
  - `actors-and-use-cases.md` — 34 UCs.
  - `enrollment-lifecycle.md`, `review-lifecycle.md`, `verification-flows.md` — state machines.
- **ERD consolidado** (`docs/architecture/data-model.md`) — modelo de datos por bounded context.
- **Documentos DDD táctico/estratégico** (`docs/domain/strategic/`, `docs/domain/tactical/`):
  - `eventstorming.md`, `bounded-contexts.md`, `context-map.md`, `aggregates.md`, `domain-events.md`, `value-objects.md`.
- **Catálogo de epics + user stories** (`docs/domain/epics.md`, `docs/domain/user-stories.md`) — 10 epics, 41 US.

---

## Fase 2 — Backend y autenticación 🔄

Subdividida en **5 slices end-to-end testeables**:

| # | Slice | Status | Detalle |
|---|---|---|---|
| A | Identity schema + primera migración EF Core | ✓ Done | Aggregate User, value objects (UserId, EmailAddress), domain events, primera migration (`identity` schema, tabla `users`, enum PG `user_role`) |
| B | UC-010 Register + email de verificación | ✓ Done | `POST /api/identity/register`, BCrypt password hash, VerificationToken, envío SMTP vía Mailpit, integration tests con WebApplicationFactory |
| C | UC-011 Verify email + refactor token a child entity | ⏳ Próximo | `GET /api/identity/verify`, marca email_verified_at, refactor `EmailVerificationToken` aggregate → `VerificationToken` child entity de User (ver ADR-0033) |
| D | UC-012 Create StudentProfile | ⏳ Pendiente | Aggregate StudentProfile, `POST /api/me/student-profiles` autenticado |
| E | JWT login flow + cookie + frontend wiring | ⏳ Pendiente | LoginCommand, JWT issuance, cookie httpOnly, getSession() RSC helper, layout guards |

**Posición exacta**: terminamos B (mergeado en main), próximo es C.

**Stack técnico funcionando**:

- .NET 10 + ASP.NET Core 10 + Wolverine 5.32 + Carter 10 + EF Core 10 + Npgsql 10.
- Postgres 17 + pgvector 0.8.
- Mailpit en dev y CI.
- BCrypt para password hashing.
- Wolverine outbox configurado pero no usado todavía (slice futuro).
- 51 unit tests + 8 integration tests passing.

**ADRs nuevos del discovery DDD reciente** (escritos pero pendientes de merge en este branch):

- ADR-0028 — Reseñas opcionales + premium features como reward (no gating del simulador).
- ADR-0029 — Bounded Context Planning separado.
- ADR-0030 — Cross-BC consistency vía Wolverine outbox.
- ADR-0031 — ReviewAuditLog como projection.
- ADR-0032 — Edit destructive de EnrollmentRecord invalida Review.
- ADR-0033 — VerificationToken como child entity (no aggregate independiente).

---

## Fase 3 — Precarga de planes + frontend base ⏳

Foundational para que la plataforma sea utilizable. Trabajo previsto:

**Backend**:
- Implementar Academic module (currently solo scaffold). Aggregates: University, Career, CareerPlan, Subject (con Prerequisite child), Teacher, AcademicTerm, Commission (con CommissionTeacher child).
- Backoffice CRUD endpoints (UC-060 a UC-065).
- Domain service `IPrerequisiteGraphValidator` para aciclicidad.
- Carga manual del plan UNSTA Tecnicatura — script de seed o CSV importer.

**Frontend (Next.js 15)**:
- Layout público con route group `(public)`.
- Páginas de catálogo: universidades, carreras, planes, materias.
- Visualización del grafo de correlativas como árbol/graph interactivo (eligir librería: react-flow, dagre, etc.).
- Interfaz de carga de historial (UC-013) — formulario por entrada, validaciones cliente-servidor.
- Vista de "mi historial" para alumno autenticado.

**Salida esperada**: alumno UNSTA puede registrarse, login, agregar StudentProfile a la carrera Tecnicatura, cargar manualmente sus cursadas pasadas. Visitor puede explorar el catálogo.

---

## Fase 4 — Simulador + sistema de reseñas ⏳

El loop core del producto.

**Backend**:
- Implementar Reviews module: aggregate Review (con TeacherResponse child), domain service `IReviewContentFilter` (auto-filter), pipeline de embeddings.
- Implementar Moderation module: aggregate ReviewReport, projection ReviewAuditLog, mod queue.
- Implementar Planning module: aggregate SimulationDraft, queries para "available subjects".
- Cross-BC integration events vía Wolverine outbox (ADR-0030).
- Edit destructive de EnrollmentRecord invalida Review (ADR-0032).

**Frontend**:
- Simulador interactivo (UC-016): selección visual de materias, cálculo de métricas en cliente o server, feedback inmediato.
- Formulario de publicación de reseña (UC-017).
- Vistas públicas de reseñas (visitor) — UC-002, UC-003.
- Search box (UC-004).
- Reportar / ver mis reports (UC-019, UC-020).
- Mod UI: cola, audit log, resolver reports (UC-050, UC-051, UC-052, UC-053).

**Premium features de Planning**:
- Guardar/editar/borrar simulación (US-NEW-03 a US-NEW-06).
- Compartir / ver simulaciones públicas (US-NEW-04, US-NEW-07).

---

## Fase 5 — Dashboard institucional + verificación de docentes ⏳

**Backend**:
- TeacherProfile aggregate con flow de claim (UC-030 a UC-032, UC-066, UC-040, UC-041).
- VerificationToken purpose=TeacherInstitutionalVerification.
- Backoffice de staff users (UC-067).
- Dashboard institucional: queries agregadas scoped a University del staff.

**Frontend**:
- Flow de claim para member.
- UI de respuesta docente bajo reseñas.
- Admin UI de aprobación de claims pendientes.
- Dashboard staff con métricas y filtros.

---

## Fase 6 — Focus group cerrado + ajustes ⏳

Pre-condición: **MVP funcional** — al menos UC-001 a UC-020 más UC-050/051 operativos. Plan:

- Convocar 8-12 alumnos UNSTA.
- Sesión guiada de 60 min: registrarse, cargar historial, simular cuatrimestre real, leer reseñas, escribir una.
- Captura cualitativa: qué confunde, qué falta, qué les gusta.
- Backlog de ajustes priorizados.
- Iteración corta (1-2 semanas) sobre los issues más graves.

---

## Fase 7 — Lanzamiento público ⏳

Timing: sincronizar con el período de inscripción de UNSTA (febrero/julio según cuatrimestre que arranca).

Pre-conditions:
- MVP funcional + ajustes de focus group integrados.
- Staff de moderación operando (al menos 2 moderators más yo).
- Catálogo UNSTA completo (todas las carreras + planes vigentes).
- Hardening: rate limits, alertas operativas, backups automáticos.
- Observabilidad básica: dashboards de uso, errores, latencia.

Métricas de éxito (a definir antes del launch):
- Cantidad de alumnos UNSTA registrados.
- Cantidad de reseñas publicadas.
- Cantidad de simulaciones guardadas.
- Tasa de "vuelve después de la primera visita".

---

## Cómo seguir el avance

- **Este doc** se actualiza al cerrar cada slice o pasar de fase.
- **Notion** (`Plan-b project`) para tracking operacional de tareas individuales.
- **GitHub** (`https://github.com/lucasidev/plan-b`) para commits, PRs, CI status.
- **CHANGELOG.md** para release-style log técnico.

Para preguntas sobre decisiones de diseño puntuales: `docs/decisions/`. Para lenguaje del dominio: `docs/domain/ubiquitous-language.md`. Para el "qué hace el sistema": `docs/domain/actors-and-use-cases.md`.
