# User Stories — planb

Catálogo de user stories. Cada US vive en su propio archivo dentro de [user-stories/](user-stories/).

Convención de IDs: `US-NNN[-x]` con `-b` backend, `-f` frontend, `-i` infra, `-t` tooling. Foundations (`US-FNN`) son trabajo del Sprint 0 (pre-sprint). Tooling cross-cutting post-S0 usa prefijo `US-TNN` (e.g. testing infra, observability infra, release tooling).

Granularidad: cada US backlog mapea 1:1 con un UC del catálogo ([actors-and-use-cases.md](actors-and-use-cases.md)). Los UCs identificados durante el DDD discovery se integraron al rango canónico (US-021 a US-028 cubren los flujos nuevos de Identity onboarding y Planning premium).

Effort: Small ≈ 1-3 días, Medium ≈ 3-7 días, Large ≈ 1-2 semanas.

---

## Por estado

### Done (15)

Foundations + slice A/B de EPIC-02 (Sprint 0) + slice C/D de EPIC-02 (Sprint 1, US-033) + institucionalización de testing/changelog/versioning (Sprint 1, T-series).

| ID | Título | Sprint | Epic |
|---|---|---|---|
| [US-F01-b](user-stories/US-F01-b.md) | Scaffolding modular monolith backend | S0 | EPIC-00 |
| [US-F01-f](user-stories/US-F01-f.md) | Scaffolding frontend Next.js | S0 | EPIC-00 |
| [US-F02-t](user-stories/US-F02-t.md) | Tooling: Justfile + Lefthook + Conventional Commits | S0 | EPIC-00 |
| [US-F03-i](user-stories/US-F03-i.md) | Infra local: Docker Postgres pgvector + Mailpit | S0 | EPIC-00 |
| [US-F04-i](user-stories/US-F04-i.md) | CI baseline GitHub Actions | S0 | EPIC-00 |
| [US-F05](user-stories/US-F05.md) | ADRs base 0001-0033 | S0 | EPIC-00 |
| [US-F06](user-stories/US-F06.md) | DDD formalization (strategic + tactical + epics + US) | S0 | EPIC-00 |
| [US-010-b](user-stories/US-010-b.md) | Register backend | S0 | EPIC-02 |
| [US-010-f](user-stories/US-010-f.md) | Register frontend | S0 | EPIC-02 |
| [US-033-i](user-stories/US-033-i.md) | Forgot/reset password backend (rate limiter + bulk revoke + flow) | S1 | EPIC-02 |
| [US-033-f](user-stories/US-033-f.md) | Forgot/reset password frontend | S1 | EPIC-02 |
| [US-T01-f](user-stories/US-T01-f.md) | Frontend unit/component testing infra (vitest + Testing Library) | S1 | EPIC-00 |
| [US-T02-f](user-stories/US-T02-f.md) | Frontend E2E infra (Playwright permanente + helpers + CI on-demand) | S1 | EPIC-00 |
| [US-T05-i](user-stories/US-T05-i.md) | Changelog auto-append + PR title validator | S1 | EPIC-00 |
| [US-T06-i](user-stories/US-T06-i.md) | Tier 1 CI workflows (Dependabot + all-commits CC + docs-links) | S1 | EPIC-00 |

### Sprint actual — S1 (4)

| ID | Título | Epic | Priority |
|---|---|---|---|
| [US-011-b](user-stories/US-011-b.md) | Verify email backend | EPIC-02 | High |
| [US-011-f](user-stories/US-011-f.md) | Verify email frontend | EPIC-02 | High |
| [US-T03-b](user-stories/US-T03-b.md) | Backend unit test layer split (Domain/Handler unit) | EPIC-00 | Medium |
| [US-T04-b](user-stories/US-T04-b.md) | Backend architecture tests con NetArchTest | EPIC-00 | Medium |

### Backlog (40)

Agrupado por epic.

#### EPIC-01: Catálogo público y exploración

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-001](user-stories/US-001.md) | Explorar catálogo de universidades y carreras | High | M |
| [US-002](user-stories/US-002.md) | Ver materia con sus reseñas | High | M |
| [US-003](user-stories/US-003.md) | Ver docente con sus reseñas | High | M |
| [US-004](user-stories/US-004.md) | Buscar materia o docente | Medium | S |

#### EPIC-02: Identidad y autenticación

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-012](user-stories/US-012.md) | Crear StudentProfile | High | M |
| [US-021-b](user-stories/US-021-b.md) | Reenviar verification email (backend) | High | S |
| [US-021-f](user-stories/US-021-f.md) | Reenviar verification email (frontend) | Medium | S |
| [US-022-b](user-stories/US-022-b.md) | Expirar registros no verificados (backend) | Medium | S |
| [US-022-i](user-stories/US-022-i.md) | Expirar registros no verificados (infra: migrations + scheduling) | Medium | XS |
| [US-068](user-stories/US-068.md) | Deshabilitar cuenta member | Medium | S |

#### EPIC-03: Historial académico

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-013](user-stories/US-013.md) | Cargar historial manual | High | M |
| [US-014](user-stories/US-014.md) | Importar historial desde PDF/texto | Low | L |
| [US-015](user-stories/US-015.md) | Editar entrada del historial | Medium | S |

#### EPIC-04: Planificación de cuatrimestre

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-016](user-stories/US-016.md) | Simular inscripción | High | L |
| [US-023](user-stories/US-023.md) | Guardar simulación como draft privado | Medium | M |
| [US-024](user-stories/US-024.md) | Compartir simulación al corpus público | Medium | S |
| [US-025](user-stories/US-025.md) | Editar simulación | Medium | S |
| [US-026](user-stories/US-026.md) | Borrar simulación | Low | S |
| [US-027](user-stories/US-027.md) | Ver simulaciones públicas de otros alumnos | Medium | S |

> "Recibir simulación recomendada" se movió a [post-mvp.md](post-mvp.md) hasta que se elija algoritmo (CF / heurística / embeddings).

#### EPIC-05: Sistema de reseñas

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-017](user-stories/US-017.md) | Publicar reseña | High | L |
| [US-018](user-stories/US-018.md) | Editar reseña propia | Medium | S |
| [US-019](user-stories/US-019.md) | Reportar reseña | Medium | M |
| [US-020](user-stories/US-020.md) | Ver mis reports | Low | S |

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

Trabajo cross-cutting de infraestructura, no asociado a un BC. Vive bajo EPIC-00 extendido.

| ID | Título | Priority | Effort |
|---|---|---|---|
| [US-T01-f](user-stories/US-T01-f.md) | Frontend unit/component testing infra (vitest + Testing Library) | High | M |
| [US-T02-f](user-stories/US-T02-f.md) | Frontend E2E infra (Playwright permanente + CI on-demand) | High | M |
| [US-T03-b](user-stories/US-T03-b.md) | Backend unit test layer split (separar Domain/Handler unit de Integration) | Medium | M |
| [US-T04-b](user-stories/US-T04-b.md) | Backend architecture tests con NetArchTest | Medium | S |
| [US-T05-i](user-stories/US-T05-i.md) | Changelog auto-append + PR title validator | Medium | S |
| [US-T06-i](user-stories/US-T06-i.md) | Tier 1 CI workflows (Dependabot + all-commits CC + docs-links) | Medium | S |

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
