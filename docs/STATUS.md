# Estado del proyecto — planb

Tracking operativo del avance por sprints de 7 días. La cadencia real del proyecto es **sprint**, no fase. Las fases del cronograma original del PFI quedan como anexo al final del doc para referencia académica del Ing. Copas.

**Última actualización**: 2026-05-03.

---

## Resumen ejecutivo (sprints)

| Sprint | Rango | Foco | Status |
|---|---|---|---|
| S0 (pre-sprint) | hasta 2026-04-25 | Foundations + Identity slices A+B | ✓ Done |
| S1 | 2026-04-27 a 2026-05-02 | Auth slice + cleanup auth + AppShell + home + StudentProfile + T-series + git workflow rules. **Cierra Fase 2.** | ✓ Done |
| S2 | próximo | Auth rebuild + Onboarding + Inicio v2 + Mi carrera shell (stub data) | ⏳ Pendiente |
| S3 | next | Planificar shell + Mi perfil + self-disable | ⏳ Pendiente |
| S4 | next+1 | Reseñas (shell + editor) + Rankings | ⏳ Pendiente |
| S5 | next+2 | Búsqueda global + Ajustes + Soporte (Ayuda + Sobre plan-b) | ⏳ Pendiente |

Convenciones:

- **US como value increment**: una US = un incremento de valor visible al usuario. **En backlog vive como doc parent (`US-NNN`)** con sub-tasks que pre-comprometen la decomposición técnica (Backend / Frontend / Infra). **Cuando entra a sprint el parent se reemplaza por subdivisiones** (`US-NNN-b`, `US-NNN-f`, `US-NNN-i`); el parent doc deja de existir como archivo separado. **No coexisten parent + subdivisiones** al mismo tiempo: o lo uno o lo otro, según el estado del slice.
- **Sufijo `-i` significa integrated**: `US-029-i`, `US-033-i`. Un solo PR que junta backend + frontend porque el slice es chico y no es usable hasta tener las dos puntas. **Excepciones**: el namespace foundational `US-FNN-x` usa `-i` con sentido "infra" (`US-F03-i`, `US-F04-i`); fuera de F, también se permite `-i` con sentido "infra/scheduling" cuando el slice es backend + DB schema (ej. `US-022-i` para Wolverine ScheduledJob + migrations). Cada doc lo aclara explícito en su header.
- **Reglas duras**: parent y subdivisiones no coexisten. Si una US ya está en sprint o done, su archivo es la subdivisión correspondiente, NO el parent. Para integrated (`-i`), el doc único es la subdivisión.
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

## S1 ✓ Done

**Rango**: 2026-04-27 a 2026-05-02.

**Foco original**: cerrar el slice de auth completo end-to-end (register UI + verify + login + sign-out).

**Replan mid-sprint (2026-04-28)**: el slice de auth original cerró en 2 días con runway restante. Se sumaron: cleanup auth (resend / expire / forgot password) + AppShell del área autenticada + home del dashboard. Meta declarada: **"el evaluador entra a plan-b y ve la silueta completa del producto post-login"**.

**Replan extra (2026-05-02)**: con S1 ya por cerrar se sumó **US-012 StudentProfile (backend)** + **catálogo Academic mínimo seedeado** para cerrar Fase 2 entera en S1 sin diferir a S2.

### User stories cerradas (20 en S1)

Todas Done al cierre del sprint.

| US | Título | Epic | Effort |
|---|---|---|---|
| US-010-f | Register frontend (sign-up tab del AuthView) | EPIC-02 | M |
| US-011-b | Verify email backend | EPIC-02 | S |
| US-011-f | Verify email frontend (rehecho con design system) | EPIC-02 | S |
| US-028-b | Login backend | EPIC-02 | M |
| US-028-f | Login frontend (sign-in tab del AuthView) | EPIC-02 | M |
| US-029-i | Sign-out integrated | EPIC-02 | S |
| US-033-i | Recuperación de contraseña (integrated) | EPIC-02 | L |
| US-021-b | Reenviar verification email (backend) | EPIC-02 | S |
| US-021-f | Reenviar verification email (frontend) | EPIC-02 | S |
| US-022-b | Expirar registros no verificados (backend) | EPIC-02 | S |
| US-022-i | Expirar registros no verificados (infra: migrations + scheduling) | EPIC-02 | XS |
| US-012-b | Crear StudentProfile (backend) | EPIC-02 | M |
| US-042-f | AppShell del área autenticada | EPIC-04 | M |
| US-043-f | Home del dashboard (placeholder visual) | EPIC-04 | S |
| US-T01-f | Frontend unit/component testing infra | EPIC-00 | M |
| US-T02-f | Frontend E2E infra (Playwright permanente) | EPIC-00 | M |
| US-T03-b | Backend unit test layer split | EPIC-00 | M |
| US-T04-b | Backend architecture tests (NetArchTest) | EPIC-00 | S |
| US-T05-i | Changelog auto-append + PR title validator | EPIC-00 | S |
| US-T06-i | Tier 1 CI workflows (Dependabot + all-commits + lychee) | EPIC-00 | S |

### Entregables agrupados por PR (en orden de merge)

1. **`feat/identity-login-backend`** (US-028-b): JWT HS256 + refresh token + DevSeedHostedService con personas.
2. **`feat/auth-view-and-verify`** (US-010-f + US-011-f + US-028-f): AuthView shared + rutas auth + server actions.
3. **`feat/identity-sign-out`** (US-029-i): endpoint + revocación de refresh + limpieza de cookies.
4. **`feat/identity-forgot-password`** (US-033-i): forgot + reset + anti-enumeración + IRateLimiter Redis.
5. **`test/...`** (T01..T06): testing pyramid + changelog automation + CI workflows + arch tests.
6. **`docs/operations/git-workflow.md`** (workflow rules): bitácora paso a paso de commit / branching / conflict / merge.
7. **`feat/identity-resend-verification`** (PR #52, US-021): endpoint con rate limit + UI button reusable.
8. **`feat/identity-expire-unverified`** (PR #53, US-022): backend logic + scheduled job + migration con partial unique index.
9. **`feat/academic-and-student-profile`** (PR #54, US-012-b): catálogo Academic mínimo (4 unis + 18 carreras IT + 18 planes) + StudentProfile child entity + endpoint + IValueObject marker.
10. **`docs/sprint-s1-closure`**: housekeeping + cierre Fase 2.

### Definition of Done de S1 — verificación

- ✓ `just dev` levanta backend + frontend.
- ✓ Lucía puede registrarse, verificar email, iniciar sesión.
- ✓ Si Lucía no recibe el mail, puede pedir un reenvío (rate-limited 3/hora).
- ✓ Si Lucía olvida la contraseña, puede pedirla por email y resetearla.
- ✓ Si Lucía nunca verifica, su registro se expira automáticamente a los 7 días (scheduled job).
- ✓ Después del login, Lucía ve el AppShell con sidebar de navegación y home con la silueta del producto.
- ✓ "Cerrar sesión" desde el avatar dropdown la lleva a `/auth`.
- ✓ El backend acepta crear StudentProfile contra el catálogo Academic real (4 universidades + 18 carreras IT seedeadas).

### Retrospectiva corta

**Salió mejor de lo esperado**:
- Velocidad del slice auth permitió sumar T-series + git workflow rules + StudentProfile en el mismo sprint.
- Los tests de arquitectura (NetArchTest) atraparon real issues de cross-BC coupling al implementar US-012, no fueron decoración.

**Quedó débil**:
- Endpoint `POST /api/me/student-profiles` recibe UserId en body porque el backend no tiene JwtBearer middleware (gap conocido y documentado).
- Los integration tests de US-012 dependen del seed Academic determinístico; si el seed cambia los tests rompen.

**Salió como esperado**:
- Auth slice + cleanup + AppShell + home: meta del replan mid-sprint cumplida.

---

## S2 (próximo) ⏳ Pendiente

**Contexto**: Fase 2 cerró en S1. Frontend de US-012 (form "agregar carrera") quedó diferido a una US separada cuando aterrice el JwtBearer middleware en backend.

**Sesión de rediseño UX (post-S1, 2026-05-02)** generó 3 ADRs (ver [ADR-0041](decisions/0041-rediseno-ux-post-claude-design.md)):
- [ADR-0039](decisions/0039-meilisearch-como-motor-de-busqueda-global.md) — Meilisearch como motor de búsqueda global.
- [ADR-0040](decisions/0040-notifications-como-bounded-context.md) — Notifications como BC nuevo.
- [ADR-0041](decisions/0041-rediseno-ux-post-claude-design.md) — Delta del rediseño + plan de migración.

**Roadmap S2-S5 confirmado** (decisión 2026-05-03):

### Scope de S2

- [US-036](domain/user-stories/US-036.md) — **Auth rebuild** a 4 rutas separadas (Signup / Login / Forgot / ForgotSent).
- [US-037](domain/user-stories/US-037.md) — **Onboarding** 4 pasos (Bienvenida / Carrera / Historial / Listo).
- [US-044](domain/user-stories/US-044.md) — **Inicio v2** con pregunta dominante.
- [US-045](domain/user-stories/US-045.md) — **Mi carrera shell** + 5 tabs con stub data. Backend de catálogo (Academic CRUD) queda como deuda diferida; se decide en planning si entra en S2 o se difiere a S3 según cómo venga el sprint.

---

## S3 ⏳ Pendiente

**Foco**: Planificar (shell + 2 tabs En curso / Borrador) + identidad académica (Mi perfil + self-disable).

### Scope de S3

- [US-046](domain/user-stories/US-046.md) — **Planificar shell** + 2 tabs (en curso / borrador) + nudge de promoción manual.
- [US-047](domain/user-stories/US-047.md) — **Mi perfil** (view + edit datos académicos + foto, accesible desde menú del avatar).
- [US-075](domain/user-stories/US-075.md) — **Member self-disable** (zona peligrosa de Mi perfil).

**Dependencias diferidas**:
- Backend de simulación (US-016): puede entrar en S3 si Planificar lo necesita, sino queda backlog hasta S4.
- Backend de Academic CRUD: si no aterrizó en S2, parte del scope vive como stub en S3 también.

---

## S4 ⏳ Pendiente

**Foco**: el loop core del producto (reseñas + descubrimiento de señal del corpus).

### Scope de S4

- [US-017](domain/user-stories/US-017.md), [US-018](domain/user-stories/US-018.md), [US-019](domain/user-stories/US-019.md), [US-020](domain/user-stories/US-020.md) — Backend completo de reseñas (publicar / editar / reportar / ver mis reports).
- [US-048](domain/user-stories/US-048.md) — **Reseñas shell** + 3 tabs (explorar / pendientes / mías).
- [US-049](domain/user-stories/US-049.md) — **Editor de reseña** 6 campos numerados con preview vivo.
- [US-070](domain/user-stories/US-070.md) — **Rankings** top 10 paginado (docentes / materias / comisiones).

---

## S5 ⏳ Pendiente

**Foco**: descubrimiento + cuenta + soporte. Cierra el set de pantallas del MVP.

### Scope de S5

- [US-071](domain/user-stories/US-071.md) — **Búsqueda global** topbar dropdown (Meilisearch). Depende de [ADR-0039](decisions/0039-meilisearch-como-motor-de-busqueda-global.md) operacional.
- [US-072](domain/user-stories/US-072.md) — **Ajustes** (notificaciones / privacidad / idioma / tema).
- [US-073](domain/user-stories/US-073.md) — **Ayuda** (FAQ + contacto soporte).
- [US-074](domain/user-stories/US-074.md) — **Sobre plan-b** (página informacional + créditos).

---

## Backlog open (sin sprint asignado)

- US-001 a US-004 (catálogo público): aterrizan cuando Academic CRUD esté listo. Pueden arrancar paralelos a S2 si se prioriza.
- US-013/14/15 (cargar / importar / editar historial): subsumidos en el tab "Historial" de Mi carrera (US-045) en frontend; backend va aterrizar dentro o cerca de S2.
- US-016 + US-023..027 (simulación + planificación-storage backend): aterrizan en torno a S3 si Planificar lo demanda.
- US-030 a US-032, US-040/041, US-066 (claim docente + respuesta docente): epic 06 entero, sin sprint asignado todavía.
- US-050..053 (moderación), US-060..065 (backoffice catálogo), US-067 (cuentas staff), US-068 (admin/mod disable), US-080 (dashboard institucional): backlog open.
- Frontend "agregar carrera" + JwtBearer middleware backend: cierra US-012 entera, sin sprint asignado.

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

### Fase 2 — Backend y autenticación ✓

Cerrada al final de S1 (2026-05-02). Subdividida en 5 slices end-to-end:

| Slice | Sprint | Status | Detalle |
|---|---|---|---|
| A | S0 | ✓ Done | Identity schema + primera migración EF Core |
| B | S0 | ✓ Done | UC-010 Register backend + email de verificación |
| C+E | S1 | ✓ Done | Slice end-to-end de auth: register UI + verify (b+f) + login (b+f) + sign-out |
| Cleanup | S1 | ✓ Done | Resend verification + expirar registros no verificados + forgot password |
| D | S1 | ✓ Done | UC-012 StudentProfile (backend) + catálogo Academic mínimo seedeado |
| D | S2 | ⏳ Pendiente | UC-012 Create StudentProfile |

**Salida real**: auth end-to-end + cleanup + StudentProfile inicial + catálogo Academic mínimo (4 universidades + 18 carreras IT). Lucía puede registrarse, verificar email, hacer login, ver el AppShell con home, asociarse a una carrera (vía API), y hacer sign-out.

### Fase 3 — Precarga de planes + frontend base ⏳

Foundational para que la plataforma sea utilizable. Trabajo previsto:

**Backend**:
- Extender Academic module (hoy: 3 aggregates seedeados — University, Career, CareerPlan). Sumar: Subject (con Prerequisite child), Teacher, AcademicTerm, Commission (con CommissionTeacher child).
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
