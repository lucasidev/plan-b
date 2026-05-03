# User Stories — planb

Catálogo de user stories. Cada US vive en su propio archivo dentro de [user-stories/](user-stories/).

Convención de IDs: `US-NNN[-x]` con `-b` backend, `-f` frontend, `-i` infra, `-t` tooling. Foundations (`US-FNN`) son trabajo del Sprint 0 (pre-sprint). Tooling cross-cutting post-S0 usa prefijo `US-TNN` (e.g. testing infra, observability infra, release tooling).

Granularidad: cada US backlog mapea 1:1 con un UC del catálogo ([actors-and-use-cases.md](actors-and-use-cases.md)). Los UCs identificados durante el DDD discovery se integraron al rango canónico (US-021 a US-028 cubren los flujos nuevos de Identity onboarding y Planning premium).

Effort: Small ≈ 1-3 días, Medium ≈ 3-7 días, Large ≈ 1-2 semanas.

---

## Por estado

### Done (28)

Foundations (S0) + Fase 2 completa (S1: auth slice + cleanup + AppShell + home + StudentProfile) + institucionalización de testing/changelog/versioning + git workflow rules (S1, T-series).

#### S0 — pre-sprint

| ID | Título | Epic |
|---|---|---|
| [US-F01-b](user-stories/US-F01-b.md) | Scaffolding modular monolith backend | EPIC-00 |
| [US-F01-f](user-stories/US-F01-f.md) | Scaffolding frontend Next.js | EPIC-00 |
| [US-F02-t](user-stories/US-F02-t.md) | Tooling: Justfile + Lefthook + Conventional Commits | EPIC-00 |
| [US-F03-i](user-stories/US-F03-i.md) | Infra local: Docker Postgres pgvector + Mailpit | EPIC-00 |
| [US-F04-i](user-stories/US-F04-i.md) | CI baseline GitHub Actions | EPIC-00 |
| [US-F05](user-stories/US-F05.md) | ADRs base 0001-0033 | EPIC-00 |
| [US-F06](user-stories/US-F06.md) | DDD formalization (strategic + tactical + epics + US) | EPIC-00 |
| [US-010-b](user-stories/US-010-b.md) | Register backend | EPIC-02 |

#### S1 — sprint actual (cierra Fase 2)

| ID | Título | Epic |
|---|---|---|
| [US-010-f](user-stories/US-010-f.md) | Register frontend (sign-up tab del AuthView) | EPIC-02 |
| [US-011-b](user-stories/US-011-b.md) | Verify email backend | EPIC-02 |
| [US-011-f](user-stories/US-011-f.md) | Verify email frontend | EPIC-02 |
| [US-028-b](user-stories/US-028-b.md) | Login backend | EPIC-02 |
| [US-028-f](user-stories/US-028-f.md) | Login frontend | EPIC-02 |
| [US-029-i](user-stories/US-029-i.md) | Sign-out integrated | EPIC-02 |
| [US-033-i](user-stories/US-033-i.md) | Recuperación de contraseña (integrated) | EPIC-02 |
| [US-021-b](user-stories/US-021-b.md) | Reenviar verification email (backend) | EPIC-02 |
| [US-021-f](user-stories/US-021-f.md) | Reenviar verification email (frontend) | EPIC-02 |
| [US-022-b](user-stories/US-022-b.md) | Expirar registros no verificados (backend) | EPIC-02 |
| [US-022-i](user-stories/US-022-i.md) | Expirar registros no verificados (infra: migrations + scheduling) | EPIC-02 |
| [US-012-b](user-stories/US-012-b.md) | Crear StudentProfile (backend) | EPIC-02 |
| [US-042-f](user-stories/US-042-f.md) | AppShell del área autenticada | EPIC-04 |
| [US-043-f](user-stories/US-043-f.md) | Home del dashboard (placeholder visual) | EPIC-04 |
| [US-T01-f](user-stories/US-T01-f.md) | Frontend unit/component testing infra (vitest + Testing Library) | EPIC-00 |
| [US-T02-f](user-stories/US-T02-f.md) | Frontend E2E infra (Playwright permanente + helpers + CI on-demand) | EPIC-00 |
| [US-T03-b](user-stories/US-T03-b.md) | Backend unit test layer split (Domain/Handler unit) | EPIC-00 |
| [US-T04-b](user-stories/US-T04-b.md) | Backend architecture tests con NetArchTest | EPIC-00 |
| [US-T05-i](user-stories/US-T05-i.md) | Changelog auto-append + PR title validator | EPIC-00 |
| [US-T06-i](user-stories/US-T06-i.md) | Tier 1 CI workflows (Dependabot + all-commits CC + docs-links) | EPIC-00 |

### Sprint actual

S1 cerrado el 2026-05-02. Roadmap confirmado de S2 a S5 abajo.

### Roadmap S2 — S5 (confirmado)

Plan acordado el 2026-05-03 después del rediseño UX (ADR-0041). El alcance por sprint está cerrado; el orden interno de cada sprint se afina al planificar.

| Sprint | Foco | US |
|---|---|---|
| **S2** | Auth + Onboarding + Inicio + Mi carrera (shell, stub data) | [US-036](user-stories/US-036.md), [US-037](user-stories/US-037.md), [US-044](user-stories/US-044.md), [US-045](user-stories/US-045.md) |
| **S3** | Planificar (shell + tabs) + Mi perfil + self-disable | [US-046](user-stories/US-046.md), [US-047](user-stories/US-047.md), [US-075](user-stories/US-075.md) |
| **S4** | Reseñas (shell + editor) + Rankings | [US-017](user-stories/US-017.md), [US-018](user-stories/US-018.md), [US-019](user-stories/US-019.md), [US-020](user-stories/US-020.md), [US-048](user-stories/US-048.md), [US-049](user-stories/US-049.md), [US-070](user-stories/US-070.md) |
| **S5** | Búsqueda global + Ajustes + Soporte (Ayuda + Sobre plan-b) | [US-071](user-stories/US-071.md), [US-072](user-stories/US-072.md), [US-073](user-stories/US-073.md), [US-074](user-stories/US-074.md) |

**Notas del roadmap:**

- El backend de Mi carrera (catálogo + plan + correlativas) queda como deuda diferida en S2 con stub data (decisión Lucas 2026-05-03). Se decide en planning si entra en S2 o S3 cuando llegue el momento, según cómo venga el sprint.
- US-016 (simular inscripción backend) puede entrar en S3 si Planificar lo necesita, sino queda backlog hasta S4.
- US-013/14/15 (cargar / importar / editar historial) son tabs internos de Mi carrera (S2). El backend de cargar manual puede aterrizar en S2 o quedar deuda diferida igual que el resto de Academic CRUD.
- US-068 (admin/mod deshabilita member) sigue backlog open: es flow de moderación, no MVP.

### Backlog (50)

> El rediseño UX del 2026-05-02 ([ADR-0041](../decisions/0041-rediseno-ux-post-claude-design.md)) introdujo las US-045 a US-049 + US-070 a US-075 (Mi carrera shell, Planificar shell, Mi perfil, Reseñas shell + editor, Rankings, Búsqueda global, Ajustes, Ayuda, Sobre plan-b, self-disable). Las del rango canónico previo (US-001 a US-033) que cambien scope referencian el ADR cuando aterricen a sprint.

Agrupado por epic.

#### EPIC-01: Catálogo público y exploración

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-001](user-stories/US-001.md) | Explorar catálogo de universidades y carreras | High | M |
| [US-002](user-stories/US-002.md) | Ver materia con sus reseñas | High | M |
| [US-003](user-stories/US-003.md) | Ver docente con sus reseñas | High | M |
| [US-004](user-stories/US-004.md) | Buscar materia o docente | Medium | S |
| [US-071](user-stories/US-071.md) | Búsqueda global (topbar dropdown con Meilisearch) | High | L |

#### EPIC-02: Identidad y autenticación

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-036](user-stories/US-036.md) | Auth rebuild: 4 rutas separadas (Signup / Login / Forgot / ForgotSent) | Medium | M |
| [US-037](user-stories/US-037.md) | Onboarding 4 pasos (Bienvenida / Carrera / Historial / Listo) | High | M |
| [US-047](user-stories/US-047.md) | Mi perfil (view + edit datos académicos + foto) | High | M |
| [US-068](user-stories/US-068.md) | Deshabilitar cuenta member (admin/mod) | Medium | S |
| [US-072](user-stories/US-072.md) | Ajustes (notificaciones / privacidad / idioma / tema) | Medium | M |
| [US-073](user-stories/US-073.md) | Ayuda (FAQ + contacto soporte) | Low | S |
| [US-074](user-stories/US-074.md) | Sobre plan-b (página informacional + créditos) | Low | S |
| [US-075](user-stories/US-075.md) | Member deshabilita su propia cuenta (self-disable) | Medium | S |

#### EPIC-03: Historial académico

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-013](user-stories/US-013.md) | Cargar historial manual | High | M |
| [US-014](user-stories/US-014.md) | Importar historial desde PDF/texto | Low | L |
| [US-015](user-stories/US-015.md) | Editar entrada del historial | Medium | S |
| [US-045](user-stories/US-045.md) | Mi carrera shell + 5 tabs (consolidación de vistas académicas) | High | L |

#### EPIC-04: Planificación de cuatrimestre

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-016](user-stories/US-016.md) | Simular inscripción (rediseño: Planificar 2 tabs En curso / Borrador, ADR-0041) | High | L |
| [US-023](user-stories/US-023.md) | Guardar simulación como draft privado | Medium | M |
| [US-024](user-stories/US-024.md) | Compartir simulación al corpus público | Medium | S |
| [US-025](user-stories/US-025.md) | Editar simulación | Medium | S |
| [US-026](user-stories/US-026.md) | Borrar simulación | Low | S |
| [US-027](user-stories/US-027.md) | Ver simulaciones públicas de otros alumnos | Medium | S |
| [US-044](user-stories/US-044.md) | Inicio v2 con pregunta dominante | High | M |
| [US-046](user-stories/US-046.md) | Planificar shell + 2 tabs (en curso / borrador) + nudge de promoción | High | L |

> "Recibir simulación recomendada" se movió a [post-mvp.md](post-mvp.md) hasta que se elija algoritmo (CF / heurística / embeddings).

#### EPIC-05: Sistema de reseñas

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-017](user-stories/US-017.md) | Publicar reseña | High | L |
| [US-018](user-stories/US-018.md) | Editar reseña propia | Medium | S |
| [US-019](user-stories/US-019.md) | Reportar reseña | Medium | M |
| [US-020](user-stories/US-020.md) | Ver mis reports | Low | S |
| [US-048](user-stories/US-048.md) | Reseñas shell + 3 tabs (explorar / pendientes / mías) | High | M |
| [US-049](user-stories/US-049.md) | Editor de reseña 6 campos numerados con preview vivo | High | L |
| [US-070](user-stories/US-070.md) | Rankings (top 10 paginado: docentes / materias / comisiones) | Medium | M |

#### EPIC-06: Claim e identidad docente

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-030](user-stories/US-030.md) | Iniciar claim de docente | Medium | S |
| [US-031](user-stories/US-031.md) | Verificar docente por email institucional | Medium | M |
| [US-032](user-stories/US-032.md) | Solicitar verificación manual | Low | M |
| [US-040](user-stories/US-040.md) | Responder reseña | Medium | S |
| [US-041](user-stories/US-041.md) | Editar respuesta docente | Low | S |
| [US-066](user-stories/US-066.md) | Verificar TeacherProfile manual (admin) | Low | M |

#### EPIC-07: Moderación

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-050](user-stories/US-050.md) | Ver cola de reseñas under_review | High | S |
| [US-051](user-stories/US-051.md) | Resolver report | High | M |
| [US-052](user-stories/US-052.md) | Restaurar reseña removida | Medium | S |
| [US-053](user-stories/US-053.md) | Ver audit log | Medium | S |

#### EPIC-08: Backoffice de catálogo

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-060](user-stories/US-060.md) | Gestionar University | High | M |
| [US-061](user-stories/US-061.md) | Gestionar Career + CareerPlan | High | M |
| [US-062](user-stories/US-062.md) | Gestionar Subject + Prerequisite | High | M |
| [US-063](user-stories/US-063.md) | Gestionar Teacher | Medium | S |
| [US-064](user-stories/US-064.md) | Gestionar AcademicTerm | Medium | S |
| [US-065](user-stories/US-065.md) | Gestionar Commission + CommissionTeacher | Medium | M |

#### EPIC-09: Backoffice de cuentas staff

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-067](user-stories/US-067.md) | Crear cuentas staff | Medium | S |

#### EPIC-10: Dashboard institucional

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-080](user-stories/US-080.md) | Ver dashboard institucional | Low | L |

#### Tooling post-S0 (T-series)

Toda la T-series del MVP cerró en S1 (Done arriba). Trabajo de tooling futuro va a entrar como T07+ cuando se identifique necesidad concreta.

---

## Por epic

- [EPIC-00: Foundations & DevEx](epics/EPIC-00.md)
- [EPIC-01: Catálogo público y exploración](epics/EPIC-01.md)
- [EPIC-02: Identidad y autenticación](epics/EPIC-02.md)
- [EPIC-03: Historial académico](epics/EPIC-03.md)
- [EPIC-04: Planificación de cuatrimestre](epics/EPIC-04.md)
- [EPIC-05: Sistema de reseñas](epics/EPIC-05.md)
- [EPIC-06: Claim e identidad docente](epics/EPIC-06.md)
- [EPIC-07: Moderación](epics/EPIC-07.md)
- [EPIC-08: Backoffice de catálogo](epics/EPIC-08.md)
- [EPIC-09: Backoffice de cuentas staff](epics/EPIC-09.md)
- [EPIC-10: Dashboard institucional](epics/EPIC-10.md)

---

## Definition of Done

[definition-of-done.md](definition-of-done.md)

---

## Cómo se trackean

- Catálogo canónico: este doc + archivos individuales en [user-stories/](user-stories/).
- Tracking operacional: Notion (DB `plan-b — User Stories`), con cross-link a este file vía property `Doc link`.
- En código: PRs referencian `US-NNN` o `UC-NNN` desde la descripción y los commits.
