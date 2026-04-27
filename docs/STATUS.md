# Estado del proyecto — planb

Tracking operativo del avance por sprints de 7 días. La cadencia real del proyecto es **sprint**, no fase. Las fases del cronograma original del PFI quedan como anexo al final del doc para referencia académica del Ing. Copas.

**Última actualización**: 2026-04-27.

---

## Resumen ejecutivo (sprints)

| Sprint | Rango | Foco | Status |
|---|---|---|---|
| S0 (pre-sprint) | hasta 2026-04-25 | Foundations + Identity slices A+B | ✓ Done |
| S1 | 2026-04-27 a 2026-05-03 | Auth slice completo (register UI + verify + login + sign-out) | 🔄 En progreso |
| S2 | siguiente | UC-012 StudentProfile (slice D) + cleanup auth (resend, expire) | ⏳ Pendiente |
| S3+ | next | Backoffice catálogo / catálogo público (Fase 3) | ⏳ Pendiente |

Convenciones:

- IDs de US: `US-NNN-x` con sufijo `-b` (backend), `-f` (frontend), `-i` (infra), `-t` (tooling). Sin sufijo cuando la US es uni-capa o documental.
- Sprints: 7 días, identificados como `S1`, `S2`, etc. `S0 (pre-sprint)` agrupa retroactivamente todo el trabajo done previo a la formalización del sprint cycle.
- Definition of Done por US: [`docs/domain/definition-of-done.md`](domain/definition-of-done.md).

---

## S0 (pre-sprint) ✓ Done

**Rango**: hasta 2026-04-25 (todo el trabajo previo a la formalización del cycle de sprints).

**Foco**: foundations del repo, modelo DDD, primer slice end-to-end de Identity.

### Entregables documentales

- **33 ADRs** (`docs/decisions/`) cubriendo decisiones de dominio, arquitectura, frontend, tooling, workflow y outcomes recientes del DDD discovery (ADR-0028 a ADR-0033).
- **Documentos de dominio** (`docs/domain/`):
  - `ubiquitous-language.md`: glosario.
  - `actors-and-use-cases.md` + `use-cases/`: índice y 41 archivos individuales por UC.
  - `enrollment-lifecycle.md`, `review-lifecycle.md`, `verification-flows.md`: state machines.
  - `definition-of-done.md`: criterios mínimos por US.
- **ERD consolidado** (`docs/architecture/data-model.md`): modelo de datos por bounded context.
- **Documentos DDD táctico/estratégico** (`docs/domain/strategic/`, `docs/domain/tactical/`):
  - `eventstorming.md`, `bounded-contexts.md`, `context-map.md`, `aggregates.md`, `domain-events.md`, `value-objects.md`.
- **Catálogo de epics + user stories** (`docs/domain/epics/`, `docs/domain/user-stories/`): 11 epics (incluye EPIC-00 Foundations) y ~52 user stories en archivos individuales.

### User stories cerradas (8)

> Nota: US-010-f figuraba "done" en S0 pero la página de signup no estaba implementada. Se movió a S1 con scope ajustado (sign-up tab del AuthView compartido).

| US | Título | Epic |
|---|---|---|
| US-F01-b | Scaffolding modular monolith backend | EPIC-00 |
| US-F01-f | Scaffolding frontend Next.js | EPIC-00 |
| US-F02-t | Tooling: Justfile + Lefthook + Conventional Commits | EPIC-00 |
| US-F03-i | Infra local: Docker Postgres pgvector + Mailpit | EPIC-00 |
| US-F04-i | CI baseline GitHub Actions | EPIC-00 |
| US-F05 | ADRs base 0001-0033 | EPIC-00 |
| US-F06 | DDD formalization (strategic + tactical + epics + US) | EPIC-00 |
| US-010-b | Register backend (slice A+B) | EPIC-02 |

### Stack técnico funcionando

- .NET 10 + ASP.NET Core 10 + Wolverine 5.32 + Carter 10 + EF Core 10 + Npgsql 10.
- Postgres 17 + pgvector 0.8.
- Redis 7 (cache + ephemeral state, ADR-0034). Container levantado por `just infra-up`. Sin consumidor todavía; primer uso en US-021-b.
- Mailpit en dev y CI.
- BCrypt para password hashing.
- Wolverine outbox configurado pero no usado todavía (sprint futuro).
- 51 unit tests + 8 integration tests passing.

### ADRs nuevos del discovery DDD reciente

- ADR-0028 Reseñas opcionales + premium features como reward (no gating del simulador).
- ADR-0029 Bounded Context Planning separado.
- ADR-0030 Cross-BC consistency vía Wolverine outbox.
- ADR-0031 ReviewAuditLog como projection.
- ADR-0032 Edit destructive de EnrollmentRecord invalida Review.
- ADR-0033 VerificationToken como child entity (no aggregate independiente).
- ADR-0034 Redis como cache + ephemeral state.

---

## S1 (sprint actual) 🔄 En progreso

**Rango**: 2026-04-27 a 2026-05-03.

**Foco**: **cerrar el slice de auth completo end-to-end**. Cuando S1 cierre, alguien puede registrarse, verificar su email, iniciar sesión, usar la app, cerrar sesión. Sin esto, el resto del producto no se puede demostrar.

### User stories incluidas

| US | Título | Epic | Status |
|---|---|---|---|
| US-011-b | Verify email backend | EPIC-02 | ✓ Done en main |
| US-010-f | Register frontend (sign-up tab del AuthView) | EPIC-02 | Pendiente |
| US-011-f | Verify email frontend (rehecho con design system) | EPIC-02 | Pendiente (revertido en PR #14) |
| US-028-b | Login backend | EPIC-02 | Pendiente |
| US-028-f | Login frontend (sign-in tab del AuthView) | EPIC-02 | Pendiente |
| US-029-i | Sign-out integrated | EPIC-02 | Pendiente |

### Entregables agrupados por PR

1. **`feat/identity-login-backend`** (US-028-b): `POST /api/identity/sign-in` + JWT HS256 + refresh token con revocation list en Redis (patrón #1 de redis-key-patterns) + `DevSeedHostedService` con las 4 personas de [docs/domain/personas.md](domain/personas.md). Tests integration cubren los 3 paths de error (401 invalid creds, 403 unverified, 403 disabled).
2. **`feat/auth-view-and-verify`** (US-010-f + US-011-f + US-028-f): componente `AuthView` shared con tabs sign-up/sign-in (per mockup `screens.jsx`), 3 rutas `(auth)/sign-up`, `(auth)/sign-in`, `(auth)/verify-email`, server actions wireadas. Sign-up al register backend ya en main, sign-in al login del PR previo, verify-email rehecho sobre `AuthSplit`.
3. **`feat/identity-sign-out`** (US-029-i): endpoint trivial `POST /api/identity/sign-out` que limpia revocation list + cookies, botón en frontend, integration test.

### Definition of Done de S1

- `just dev` levanta backend + frontend.
- Lucía (`lucia.mansilla@gmail.com` / `lucia.mansilla.12`) puede iniciar sesión.
- Mateo, Paula, Martín seedeados producen los caminos esperados (signin OK / 403 disabled / 403 unverified).
- Un user nuevo se puede registrar desde la UI, verifica el email, queda logueado.
- "Cerrar sesión" del menú deja al user en `/sign-in`.

---

## S2 (próximo) ⏳ Pendiente

**Foco previsto**: cleanup del flujo de auth (lo que quedó fuera de S1) + arrancar StudentProfile.

### User stories previstas

| US | Título | Epic |
|---|---|---|
| US-021-b | Resend verification backend | EPIC-02 |
| US-021-f | Resend verification frontend | EPIC-02 |
| US-022-i | Expirar registros no verificados (cron) | EPIC-02 |
| US-012 | Crear StudentProfile | EPIC-02 |

### Entregables previstos

- Resend verification con rate limit (3/h por user).
- Cron diario que expira registros no verificados >7d.
- Aggregate `StudentProfile` con `POST /api/me/student-profiles` + UI "agregar carrera".

---

## S3+ ⏳ Pendiente

**Foco previsto**: abrir bounded context Academic. Sin catálogo no hay catálogo público ni simulador.

### Sprints siguientes

Pendiente de planificación detallada. Candidatos por prioridad:

- Backoffice de catálogo (EPIC-08): University, Career, CareerPlan, Subject + Prerequisite, Teacher, Term, Commission.
- Catálogo público (EPIC-01): visitor explora UNSTA.
- Historial académico (EPIC-03): UC-013 cargar historial manual.

---

## Cómo seguir el avance

- **Este doc** se actualiza al cerrar cada sprint o al iniciar uno nuevo.
- **Notion** (page padre `plan-b project management` con dos listas anidadas):
  - `plan-b: Tasks` (user stories + sub-tasks técnicas) con kanban del sprint actual y backlog priorizado, field `Sprint` (S0, S1, S2, ...).
  - `plan-b: Epics` (vistas separadas por capability).
- **GitHub** (`https://github.com/lucasidev/plan-b`): commits, PRs, CI status.

Para preguntas sobre decisiones de diseño puntuales: `docs/decisions/`. Para lenguaje del dominio: `docs/domain/ubiquitous-language.md`. Para "qué hace el sistema": `docs/domain/actors-and-use-cases.md` (índice) o `docs/domain/use-cases/UC-NNN.md`. Para epics: `docs/domain/epics.md`.

---

## Anexo: hitos macro del cronograma original

El plan inicial del proyecto definió 7 fases macro como referencia de planificación al arrancar. La cadencia real de trabajo es sprint (ver tabla arriba). Las fases siguen sirviendo como hitos macro del proyecto: agrupan varios sprints y marcan momentos donde el producto cruza estados (modelado completo, backend operativo, MVP usable, etc.).

### Fase 1 — Diseño y modelado de datos ✓

Completada en S0.

Cubre los entregables documentales listados en S0 arriba: ADRs 0001-0033, ubiquitous language, use cases, ERD, DDD táctico y estratégico, catálogo de epics y user stories.

### Fase 2 — Backend y autenticación 🔄

En progreso. Subdividida en 5 slices end-to-end testeables, mapeados a sprints:

| Slice | Sprint | Status | Detalle |
|---|---|---|---|
| A | S0 | ✓ Done | Identity schema + primera migración EF Core |
| B | S0 | ✓ Done | UC-010 Register backend + email de verificación |
| C+E | S1 | 🔄 En progreso | Slice end-to-end de auth: register UI + verify (b+f) + login (b+f) + sign-out. Cuando S1 cierre, auth está usable de punta a punta |
| Cleanup | S2 | ⏳ Pendiente | Resend verification + expirar registros no verificados |
| D | S2 | ⏳ Pendiente | UC-012 Create StudentProfile |

La fase 2 cierra cuando S1 + S2 están done: auth end-to-end + cleanup + StudentProfile inicial.

### Fase 3 — Precarga de planes + frontend base ⏳

Foundational para que la plataforma sea utilizable. Trabajo previsto:

**Backend**:
- Implementar Academic module (currently solo scaffold). Aggregates: University, Career, CareerPlan, Subject (con Prerequisite child), Teacher, AcademicTerm, Commission (con CommissionTeacher child).
- Backoffice CRUD endpoints (UC-060 a UC-065).
- Domain service `IPrerequisiteGraphValidator` para aciclicidad.
- Carga manual del plan UNSTA Tecnicatura: script de seed o CSV importer.

**Frontend (Next.js 15)**:
- Layout público con route group `(public)`.
- Páginas de catálogo: universidades, carreras, planes, materias.
- Visualización del grafo de correlativas como árbol/graph interactivo (eligir librería: react-flow, dagre, etc.).
- Interfaz de carga de historial (UC-013): formulario por entrada, validaciones cliente-servidor.
- Vista de "mi historial" para alumno autenticado.

**Salida esperada**: alumno UNSTA puede registrarse, login, agregar StudentProfile a la carrera Tecnicatura, cargar manualmente sus cursadas pasadas. Visitor puede explorar el catálogo.

### Fase 4 — Simulador + sistema de reseñas ⏳

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
- Vistas públicas de reseñas (visitor): UC-002, UC-003.
- Search box (UC-004).
- Reportar / ver mis reports (UC-019, UC-020).
- Mod UI: cola, audit log, resolver reports (UC-050, UC-051, UC-052, UC-053).

**Premium features de Planning**:
- Guardar/editar/borrar simulación (US-023 a US-026).
- Compartir / ver simulaciones públicas (US-024, US-027).

### Fase 5 — Dashboard institucional + verificación de docentes ⏳

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

### Fase 6 — Focus group cerrado + ajustes ⏳

Pre-condición: **MVP funcional** (al menos UC-001 a UC-020 más UC-050/051 operativos). Plan:

- Convocar 8-12 alumnos UNSTA.
- Sesión guiada de 60 min: registrarse, cargar historial, simular cuatrimestre real, leer reseñas, escribir una.
- Captura cualitativa: qué confunde, qué falta, qué les gusta.
- Backlog de ajustes priorizados.
- Iteración corta (1-2 semanas) sobre los issues más graves.

### Fase 7 — Lanzamiento público ⏳

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
