# Estado del proyecto (planb)

Tracking operativo del avance por sprints. La cadencia real del proyecto es **sprint**, no fase. Las fases del cronograma original del PFI quedan como anexo al final del doc para referencia académica del Ing. Copas.

**Cadencia**: S1 y S2 fueron de 7 días con cierre flotante (sábado-sábado). **Desde S3 la cadencia se fija a lunes → sábado (6 días útiles)**. Lo hecho hecho está: los rangos de S1/S2 no se reescriben retroactivamente.

**Última actualización**: 2026-05-12 (apertura de S3 con convención nueva lunes→sábado; carry-over de US-045-b/c/d/e desde S2).

---

## Resumen ejecutivo (sprints)

| Sprint | Rango | Foco | Status |
|---|---|---|---|
| S0 (pre-sprint) | hasta 2026-04-25 | Foundations + Identity scaffolding (schema + register backend) | ✓ Done |
| S1 | 2026-04-27 a 2026-05-02 | Auth slice + cleanup auth + AppShell + home + StudentProfile + T-series + git workflow rules. **Cierra Fase 2.** | ✓ Done |
| S2 | 2026-05-03 a 2026-05-09 | Auth rebuild + Onboarding + Inicio v2 + Mi carrera shell + canvas screenshots pipeline + pre-push hook E2E + audit canvas v3 completo (app + landing + design system + admin/backoffice) + rediseño app (12 US nuevas) + módulo admin doc'd (6 US nuevas + ADR-0042 audit log per-BC) | ✓ Done |
| S3 | 2026-05-11 a 2026-05-16 | Carry-over de Mi carrera (US-045-b heatmap + US-045-c correlativas + US-045-d materias/docentes + US-045-e historial). Scope adicional a definir por Lucas. | 🟡 In progress |
| S4+ | next+ | Backlog post-S3 (US-054-f, US-059-f, US-046, US-047, US-075, US-017, US-048, US-049, US-070, US-071, US-072, US-073, US-074, US-081..087) sin asignación de sprint hasta planning | ⏳ Pendiente |

Convenciones:

- **US como value increment**: una US = un incremento de valor visible al usuario. **En backlog vive como doc parent (`US-NNN`)** con sub-tasks que pre-comprometen la decomposición técnica (Backend / Frontend / Infra). **Cuando entra a sprint el parent se reemplaza por subdivisiones** (`US-NNN-b`, `US-NNN-f`, `US-NNN-i`); el parent doc deja de existir como archivo separado. **No coexisten parent + subdivisiones** al mismo tiempo: o lo uno o lo otro, según el estado del slice.
- **Sufijo `-i` significa integrated**: `US-029-i`, `US-033-i`. Un solo PR que junta backend + frontend porque el slice es chico y no es usable hasta tener las dos puntas. **Excepciones**: el namespace foundational `US-FNN-x` usa `-i` con sentido "infra" (`US-F03-i`, `US-F04-i`); fuera de F, también se permite `-i` con sentido "infra/scheduling" cuando el slice es backend + DB schema (ej. `US-022-i` para Wolverine ScheduledJob + migrations). Cada doc lo aclara explícito en su header.
- **Reglas duras**: parent y subdivisiones no coexisten. Si una US ya está en sprint o done, su archivo es la subdivisión correspondiente, NO el parent. Para integrated (`-i`), el doc único es la subdivisión.
- Sprints: identificados como `S1`, `S2`, etc. `S0 (pre-sprint)` agrupa retroactivamente todo el trabajo done previo a la formalización del sprint cycle. **Cadencia: S1/S2 fueron de 7 días flotantes; desde S3 lunes → sábado (6 días útiles).** El domingo queda como buffer/descanso.
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
| US-010-b | Register backend (S0) | EPIC-02 |

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

### Definition of Done de S1 (verificación)

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

## S2 ✓ Done

**Rango**: 2026-05-03 a 2026-05-09 (sprint de 7 días, extendido al día 7 con audit canvas v3 + backlog grooming).

**Contexto**: Fase 2 cerró en S1. Frontend de US-012 (form "agregar carrera") quedó diferido a una US separada cuando aterrice el JwtBearer middleware en backend.

**Sesión de rediseño UX (post-S1, 2026-05-02)** generó 3 ADRs (ver [ADR-0041](decisions/0041-rediseño-ux-post-claude-design.md)):
- [ADR-0039](decisions/0039-meilisearch-como-motor-de-búsqueda-global.md): Meilisearch como motor de búsqueda global.
- [ADR-0040](decisions/0040-notifications-como-bounded-context.md): Notifications como BC nuevo.
- [ADR-0041](decisions/0041-rediseño-ux-post-claude-design.md): Delta del rediseño + plan de migración.

### Scope cerrado en S2

- [US-037-f](domain/user-stories/US-037-f.md): **Onboarding frontend** 4 pasos (Bienvenida / Carrera / Historial / Listo). **Done.**
- [US-044](domain/user-stories/US-044.md) + [US-044-a](domain/user-stories/US-044-a.md) + [US-044-b](domain/user-stories/US-044-b.md) + [US-044-c](domain/user-stories/US-044-c.md): **Inicio v2** port literal del mock V2Inicio. **Done.**
- [US-045-a](domain/user-stories/US-045-a.md): **Mi carrera shell + 5 tabs** con stubs. **Done.**
- **DevEx**: pre-push hook que enforce E2E local cuando se tocan paths de la "E2E zone" (`scripts/check-e2e-zone.ts` + auto-label workflow). PR #87 merged.
- **Design pipeline**: canvas screenshots auto-generados via Playwright sobre `plan-b-direcciones.html`, embed en US frontend como mockup ref, doc canónico [`docs/design/design-system.md`](design/design-system.md). PR #90 merged.
- **Em-dash audit**: 210 docs sweep + auditoría manual de 73 files (titles, headings, comentarios) post regla absoluta.
- **Audit canvas v3 app/landing/design-system + rediseño app (día 7, 2026-05-09)**:
  - Sync del canvas v2 con 3 HTMLs (design-system / landing / app) + 48 artboards totales. Pipeline de screenshots reescrita para iterar multi-HTML.
  - **12 US nuevas creadas para la app del alumno**: US-054-f (landing), US-055 (borrar reseña), US-059-f (rediseño Auth+Onb), US-076-f (offline banner), US-077-f (panel notifs frontend), US-077-b + b-1/-b-2/-b-3 (Notifications BC backend splitada), US-078-f (errores 404/5xx), US-079-i (cambio password integrated), US-085 (strike system + pedir edición al autor, extiende US-051).
  - **15 US existentes actualizadas** con mockup refs + AC visual del canvas v3 (auth, onb, home, mi-carrera, planificar, reseñas, rankings, búsqueda, notif, cuenta, soporte).
  - **3 decisiones de scope zanjadas** en el rediseño app: US-051 scope (→ split a US-085 con strike system + pedir edición), US-072 modal cambiar contraseña (→ split a US-079-i integrated siguiendo patrón US-029-i / US-033-i), US-077-b backend de notifications (→ full BC siguiendo ADR-0040, splitado en 3 sub-slices b-1 / b-2 / b-3).
  - PR `docs/v2-redesign` mergeado como [#94](https://github.com/lucasidev/plan-b/pull/94).
- **Módulo backoffice/admin doc'd (día 7, 2026-05-12)**:
  - Sync del 4° canvas (`plan-b-admin.html` + módulo `admin-shell.jsx` + `admin-screens-1/2/3.jsx`) con 21 artboards en 5 secciones (shell, afiliar uni, datos académicos, moderación, ops). Pipeline de screenshots ampliada para incluir el slug `admin` (prefix `admin-<section>-<id>.png` para evitar colisión con `onb` del app).
  - **6 US nuevas creadas para el módulo admin**: US-081 (admin shell + dashboard ops + componentes AdmTable/AdmFilters), US-082 (importador CSV con preview/diff), US-083 (merge de Subjects duplicados), US-084 (migración asistida de plan), US-086 (audit log per-user, tab del detalle de usuario, cross-BC), US-087 (feed global de actividad reciente).
  - **9 US existentes actualizadas** con mockup refs admin + AC visual del canvas: US-050 (reescrita: cola-de-reports en vez de cola-de-reviews), US-051 (recortada a uphold/dismiss + AC visual del detalle con 2 opciones live + 3 placeholder pointing a US-085), US-053 (pattern siblings con US-086/US-087), US-060 (gestionar University), US-061 (Career + CareerPlan), US-062 (Subject + Prerequisite + correlativas), US-063 (Teacher), US-065 (Commission), US-068 (deshabilitar member + tabs detalle).
  - **5 decisiones de scope zanjadas en el rediseño admin**: cola es por report (no por review, canvas manda), audit log per-BC (ADR-0042, cada módulo owns su projection con cross-BC views via Dapper UNION ALL), strike system+ocultar+banear all-in en US-085 (out de US-051), importador/merge/migración como US separadas, admin shell separado como bloqueante US-081.
  - **1 ADR nuevo**: [ADR-0042](decisions/0042-audit-log-per-bc-no-central.md) (audit log per-BC, no central; extiende ADR-0031).
  - PR `docs/backoffice-module` (este PR).

### Audit del estado del frontend vs canvas (2026-05-12 v3 full)

Tercera iteración del canvas: ahora se splitea en HTMLs por área. **69 artboards totales** en 4 canvases (`plan-b-design-system.html` 1 · `plan-b-landing.html` 1 · `plan-b-app.html` 46 · `plan-b-admin.html` 21). PR `docs/v2-redesign` (#94) entrega los 3 primeros; PR `docs/backoffice-module` (este) entrega el admin.

Reorganización del app canvas: ya no hay sección "Modales" ni "Errores globales" como separadas; los modales y errores ahora viven dentro de la sección a la que pertenecen (errores en Inicio, modales en Planificar / Reseñas / Cuenta).

Audit 1-a-1 contra el código actual:

| Bucket | Capturas | US distintas | Acción |
|---|---|---|---|
| `IMPL_OK` (matchea) | 2 | 1 (US-044) + DS transversal | Nada. |
| `IMPL_DRIFT` (rediseño visual + estados de error) | 10 | 4 (US-010-f, US-028-f, US-033-i, US-037-f) | Cubierto por [US-059-f](domain/user-stories/US-059-f.md) (incluye AC nuevos para banners inline `AuthErrorBanner` en signup-err / login-err). |
| `PENDIENTE_US_DOC` | 32 | 16 (mi-carrera b/c/d/e + US-046 + US-047 + US-048 + US-049 + US-054-f + US-059-f + US-070..074 + US-019) | Implementar; docs ya existen + AC nuevas de empty states / modales agregadas. |
| `SIN_US` resuelto con US nuevas | 4 | 4 nuevas | Ver lista abajo. |

**Total US a agregar al backlog post-audit (2026-05-09 v2)**: 4 nuevas + 7 existentes con AC nuevas + las 2 doc'd antes (US-054-f, US-059-f). 

US nuevas creadas:
- [US-055](domain/user-stories/US-055.md): Borrar reseña propia (action + modal destructivo). Cubre `modales-v2-modal-borrar`.
- [US-076-f](domain/user-stories/US-076-f.md): Estado offline (banner global + acciones en pausa). Cubre `home-v2-inicio-offline`.
- [US-077-f](domain/user-stories/US-077-f.md): Panel de notificaciones (dropdown del bell). Cubre `notificaciones-v2-notif` + `notificaciones-v2-notif-empty`. Pendiente crear US-077-b para el backend.
- [US-078-f](domain/user-stories/US-078-f.md): Páginas de error globales (404 + 5xx). Cubre `errores-v2-err-404` + `errores-v2-err-5xx`.

US existentes con AC nuevas:
- [US-019](domain/user-stories/US-019.md): mockup ref del modal de reportar agregado.
- [US-026](domain/user-stories/US-026.md): AC visual del modal descartar borrador.
- [US-029-i](domain/user-stories/US-029-i.md): AC modal de confirmación antes del sign-out.
- [US-044](domain/user-stories/US-044.md): AC empty state global del Inicio (alumno sin período).
- [US-046](domain/user-stories/US-046.md): AC empty state Planificar + AC modal publicar plan.
- [US-048](domain/user-stories/US-048.md): AC empty states de tabs Pendientes y Mis reseñas.
- [US-072](domain/user-stories/US-072.md): AC sección Seguridad + modal cambiar contraseña con sesión activa (decisión pendiente: AC interno vs splittear US-079-i).
- [US-059-f](domain/user-stories/US-059-f.md): AC banners de error inline en signup y login.

### Definition of Done de S2 (verificación)

- ✓ Lucía (verificada en S1) puede entrar a `/onboarding/welcome` y completar los 4 pasos hasta crear su StudentProfile.
- ✓ Lucía con StudentProfile entra a `/home` y ve el Inicio v2 completo (greeting + período + 2 columnas con todos los bloques).
- ✓ Lucía entra a `/mi-carrera` y ve el shell + 5 tabs (Plan / Correlativas / Catálogo / Docentes / Historial), todos como `ComingSoon` stubs.
- ✓ El pre-push hook bloquea push cuando se tocan paths de E2E zone sin haber corrido E2E local; escape `SKIP_E2E_PRECHECK=1`.
- ✓ Cada US frontend tiene mockup embed con la imagen del canvas correspondiente.

### Retrospectiva corta

**Salió mejor de lo esperado**:
- Pipeline de canvas screenshots: 1 spec automatiza captura de 30 artboards. Reduce drift entre código y diseño.
- US-044 port literal: el mock como fuente única funcionó perfecto. Cero ambigüedad.

**Quedó débil**:
- Auth + onboarding tienen drift visual con el canvas v2 (que cerró el 2026-05-02, después de implementar US-010-f / US-028-f / US-037-f en S1). Documentado en [US-059-f](domain/user-stories/US-059-f.md). No es bug, es deuda visual conocida.
- "Regla declarada pero sin enforcement": antes del pre-push hook, hubo merges que pasaron CI gates pero rompieron E2E (caso US-037-f que dejó `sign-up.spec.ts` esperando `/home`). Ahora con el hook + auto-label + docs, las 3 capas del enforcement están alineadas.

---

## S3 🟡 In progress

**Rango**: 2026-05-11 a 2026-05-16 (lunes → sábado, 6 días útiles). Primer sprint con la cadencia nueva.

**Foco inicial**: cerrar **Mi carrera** completo. US-045-a (shell + nav de tabs) ya cerró en S2; quedan los 4 tabs de contenido como carry-over.

### Scope acordado

- [US-045-b](domain/user-stories/US-045-b.md) Mi carrera tab Plan (heatmap por año/cuatrimestre). Carry-over de S2.
- [US-045-c](domain/user-stories/US-045-c.md) Mi carrera tab Correlativas (grafo SVG). Carry-over de S2.
- [US-045-d](domain/user-stories/US-045-d.md) Mi carrera tabs Materias + Docentes + drawers de detalle. Carry-over de S2.
- [US-045-e](domain/user-stories/US-045-e.md) Mi carrera tab Historial (tabla + CTA cargar). Carry-over de S2.

Scope adicional queda abierto: Lucas decide qué más entra (de las US frontend del backlog post-canvas) durante el sprint.

### Por qué carry-over y no Done

Las 4 sub-US del rebuild de Mi carrera estaban tagueadas en S2 pero nunca se implementaron (S2 se fue en canvas v3 + admin doc'd, que no estaban en el plan original de S2). Son las únicas US tagueadas Sprint=S2 en Notion sin código en `main`.

---

## Backlog open (sin sprint asignado)

**Frontend del alumno (rebuild post-canvas v2, ya doc'd)**:
- [US-054-f](domain/user-stories/US-054-f.md) landing pública.
- [US-055](domain/user-stories/US-055.md) borrar reseña propia (action + modal destructivo).
- [US-059-f](domain/user-stories/US-059-f.md) auth + onboarding migración a AuthShell / OnbShell.
- [US-045-b](domain/user-stories/US-045-b.md) / [-c](domain/user-stories/US-045-c.md) / [-d](domain/user-stories/US-045-d.md) / [-e](domain/user-stories/US-045-e.md) tabs de Mi carrera.
- [US-046](domain/user-stories/US-046.md) Planificar shell + tabs + empty + modal publicar.
- [US-047](domain/user-stories/US-047.md) Mi perfil.
- [US-048](domain/user-stories/US-048.md) Reseñas shell + empty states.
- [US-049](domain/user-stories/US-049.md) Editor de reseña 6 campos.
- [US-070](domain/user-stories/US-070.md) Rankings.
- [US-071](domain/user-stories/US-071.md) Búsqueda global (Meilisearch).
- [US-072](domain/user-stories/US-072.md) Ajustes (UI: notificaciones / privacidad / apariencia / datos / row Seguridad que dispara modal de US-079-i).
- [US-073](domain/user-stories/US-073.md) Ayuda.
- [US-074](domain/user-stories/US-074.md) Sobre plan-b.
- [US-075](domain/user-stories/US-075.md) Member self-disable.
- [US-076-f](domain/user-stories/US-076-f.md) estado offline (banner global).
- [US-077-f](domain/user-stories/US-077-f.md) panel de notificaciones (dropdown del bell).
- [US-078-f](domain/user-stories/US-078-f.md) páginas de error globales (404 + 5xx).
- [US-079-i](domain/user-stories/US-079-i.md) cambio de contraseña con sesión activa (integrated: endpoint `PATCH /api/me/password` + modal frontend). Patrón alineado a US-029-i / US-033-i.

**Notifications BC (decisión 2026-05-09 sobre INDEFINIDO #5)**:
- [US-077-b](domain/user-stories/US-077-b.md) parent: Notifications BC completo siguiendo ADR-0040. Splitada en 3 sub-slices secuenciales:
  - [US-077-b-1](domain/user-stories/US-077-b-1.md): core aggregate + read API + mutations. Bloquea a US-077-f.
  - [US-077-b-2](domain/user-stories/US-077-b-2.md): subscribers Wolverine cross-BC para events (UserPasswordChanged, ReviewEditRequested, ReviewResponded, etc.).
  - [US-077-b-3](domain/user-stories/US-077-b-3.md): email delivery con SMTP genérico (Mailpit en dev/CI, vendor de prod por env vars en deploy).

**Backend / cross-stack**:
- US-001 a US-004 (catálogo público): aterrizan cuando Academic CRUD esté listo.
- US-013/14/15 (cargar / importar / editar historial): subsumidos en el tab "Historial" de Mi carrera frontend; backend pendiente.
- US-016 + US-023..027 (simulación + planificación-storage backend): pendientes.
- US-017 / US-018 / US-019 / US-020 (publicar / editar / reportar reseñas backend): pendientes.
- US-030 a US-032, US-040/041, US-066 (claim docente + respuesta docente): epic 06 entero.
- US-067 (cuentas staff), US-080 (dashboard institucional): backlog open.
- Frontend "agregar carrera" + JwtBearer middleware backend: cierra US-012 entera.

**Backoffice / Admin (doc'd 2026-05-12, sin sprint asignado)**:

US-081 es bloqueante hard: sin admin shell aterrizado, ninguna feature admin se puede empezar (todas reusan AdmShell + AdmTable + AdmFilters).

- [US-081](domain/user-stories/US-081.md) Admin shell + dashboard ops (componentes base: AdmShell sidebar+topbar, AdmTable, AdmFilters, page header). **Bloqueante de todo el resto del módulo admin.**
- [US-060](domain/user-stories/US-060.md) Gestionar University (CRUD universidades).
- [US-061](domain/user-stories/US-061.md) Gestionar Career + CareerPlan.
- [US-062](domain/user-stories/US-062.md) Gestionar Subject + Prerequisite (editor de materias + correlativas con validación DAG).
- [US-063](domain/user-stories/US-063.md) Gestionar Teacher (catálogo docente + bulk-paste).
- [US-065](domain/user-stories/US-065.md) Gestionar Commission + CommissionTeacher.
- [US-082](domain/user-stories/US-082.md) Importador de plan con preview/diff (CSV).
- [US-083](domain/user-stories/US-083.md) Merge de Subjects duplicados (detección + merge UI).
- [US-084](domain/user-stories/US-084.md) Migración asistida de plan de estudios (cross-plan).
- [US-050](domain/user-stories/US-050.md) Cola de reportes (read model + vista del moderator, tone classifier).
- [US-051](domain/user-stories/US-051.md) Resolver report (uphold/dismiss + AC visual del detalle con 2 opciones live + 3 placeholder).
- [US-053](domain/user-stories/US-053.md) Audit log per-review (proyección Reviews, ADR-0042).
- [US-068](domain/user-stories/US-068.md) Deshabilitar member + listado/detalle de usuarios con tabs.
- [US-086](domain/user-stories/US-086.md) Audit log per-user (tab del detalle de usuario, cross-BC via Dapper UNION ALL).
- [US-087](domain/user-stories/US-087.md) Feed global de actividad reciente (dashboard ops, cross-BC).
- [US-085](domain/user-stories/US-085.md) Strike system + pedir edición + ocultar+banear (extiende US-051 con 3 opciones placeholder).

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

### Fase 1: Diseño y modelado de datos ✓

Completada en S0.

Cubre los entregables documentales listados en S0 arriba: ADRs 0001-0033, ubiquitous language, use cases, ERD, DDD táctico y estratégico, catálogo de epics y user stories.

### Fase 2: Backend y autenticación ✓

Cerrada al final de S1 (2026-05-02). Sprints involucrados:

| Sprint | Status | Detalle |
|---|---|---|
| S0 | ✓ Done | Identity schema + primera migración EF Core; UC-010 Register backend + email de verificación |
| S1 | ✓ Done | Auth end-to-end: register UI + verify (b+f) + login (b+f) + sign-out + resend verification + expirar registros no verificados + forgot password; UC-012 StudentProfile (backend) + catálogo Academic mínimo seedeado |
| S2 | ⏳ Pendiente | UC-012 Create StudentProfile (frontend, parte del onboarding US-037-f) |

**Salida real**: auth end-to-end + cleanup + StudentProfile inicial + catálogo Academic mínimo (4 universidades + 18 carreras IT). Lucía puede registrarse, verificar email, hacer login, ver el AppShell con home, asociarse a una carrera (vía API), y hacer sign-out.

### Fase 3: Precarga de planes + frontend base ⏳

Foundational para que la plataforma sea utilizable. Trabajo previsto:

**Backend**:
- Extender Academic module (hoy: 3 aggregates seedeados: University, Career, CareerPlan). Sumar: Subject (con Prerequisite child), Teacher, AcademicTerm, Commission (con CommissionTeacher child).
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

### Fase 4: Simulador + sistema de reseñas ⏳

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

### Fase 5: Dashboard institucional + verificación de docentes ⏳

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

### Fase 6: Focus group cerrado + ajustes ⏳

Pre-condición: **MVP funcional** (al menos UC-001 a UC-020 más UC-050/051 operativos). Plan:

- Convocar 8-12 alumnos UNSTA.
- Sesión guiada de 60 min: registrarse, cargar historial, simular cuatrimestre real, leer reseñas, escribir una.
- Captura cualitativa: qué confunde, qué falta, qué les gusta.
- Backlog de ajustes priorizados.
- Iteración corta (1-2 semanas) sobre los issues más graves.

### Fase 7: Lanzamiento público ⏳

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
