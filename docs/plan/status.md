# Estado del proyecto (planb)

Tracking operativo del avance por sprints. La cadencia real del proyecto es **sprint**, no fase. Las fases del cronograma original del PFI quedan como anexo al final del doc para referencia académica del Ing. Copas.

**Cadencia**: S1 y S2 fueron de 7 días con cierre flotante (sábado-sábado). **Desde S3 la cadencia se fija a lunes → sábado (6 días útiles)**. Lo hecho hecho está: los rangos de S1/S2 no se reescriben retroactivamente.

**Última actualización**: 2026-08-21 (arranca el rework: R0 planificado sobre el inventario de los 880 archivos del backend y las 41 features del frontend. Todo lo que está debajo de "Lo anterior" es el producto en retiro. Antes, el 2026-08-16, el viraje de tesis:

---

## Resumen ejecutivo (sprints)

| Sprint | Rango | Foco | Status |
|---|---|---|---|
| S0 (pre-sprint) | hasta 2026-04-25 | Foundations + Identity scaffolding (schema + register backend) | ✓ Done |
| S1 | 2026-04-27 a 2026-05-02 | Auth slice + cleanup auth + AppShell + home + StudentProfile + T-series + git workflow rules. **Cierra Fase 2.** | ✓ Done |
| S2 | 2026-05-03 a 2026-05-09 | Auth rebuild + Onboarding + Inicio v2 + Mi carrera shell + canvas screenshots pipeline + pre-push hook E2E + audit canvas v3 completo (app + landing + design system + admin/backoffice) + rediseño app (12 US nuevas) + backoffice doc'd (6 US nuevas + ADR-0042 audit log per-BC) | ✓ Done |
| S3 | 2026-05-11 a 2026-05-16 | Mi carrera completa (US-045-b/c/d/e) + US-013 historial manual (write, sin el read: ver Scope adicional de S3) + US-014 import historial PDF/texto + **US-088 import plan de estudios en onboarding** + JwtBearer middleware + fix cross-user data leak + workflow auto-regen Dependabot + dependabot tier policy. | ✓ Done |
| S4 | 2026-05-18 a 2026-05-24 | Cerrar shell del alumno: US-047 Mi perfil + US-072 Ajustes + US-079-i cambio contraseña con sesión + US-046 Planificar shell + US-073 Ayuda + US-074 Sobre plan-b + **US-038-bis bonus** (soft delete con anonimización, ADR-0044) + chore técnico react-doctor cleanup + pre-push hook. | ✓ Done |
| S5 | 2026-05-25 a 2026-06-08 (extendido) | **Slice de Reseñas (feature core del producto crowdsourced)**: US-017 publicar backend + US-049 editor 6 campos + US-048 shell 3 tabs + US-018 editar + US-055 borrar + US-019 reportar con módulo Moderation + auto-quarantine. Entraron las 6, incluida US-019 que era la diferible. | ✓ Done |
| S6 | 2026-06-15 a 2026-06-20 | **Corpus consumible (lado materia)**: US-089 enabler (persistir modelo completo de reseña, saca el mapping lossy) → US-002 materia con reseñas + crowd insights → US-004 búsqueda materia-only. Más US-T07-b (architecture tests a todos los módulos). | ✓ Done |
| S7 | 2026-06-23 a 2026-07-05 (extendido) | **Vertical docente (keystone US-063 Teacher)**: catálogo + admin de docentes, comisiones (US-065), página pública de docente (US-003), claim + verificación docente (US-030/031), responder + editar reseña como docente (US-040/041), rama docente de la búsqueda (US-004), cuentas staff (US-067). | ✓ Done |
| S8 | 2026-07-07 a 2026-07-11 | **Moderación + hardening de proceso**: backoffice de moderación (US-050 cola + US-051 resolver). Más: ruleset de `main` con required checks (PRs-only enforced por plataforma), fix del bot del changelog, higiene de docs y config del repo. | ✓ Done |
| S9 | 2026-07-14 a 2026-07-19 | **Gestión del catálogo académico (admin)**: US-060 University + US-061 Career/CareerPlan + US-062 Subject/Prerequisite + US-064 AcademicTerm + US-001 explorar catálogo. Sumadas 2026-07-15: US-054-f landing pública + US-059-f rediseño auth/onboarding (absorbe generalización de copy UNSTA→multi-uni). Precedido por el bloque de calidad US-T08 (cobertura) + NSubstitute 6. | ✓ Done |
| S10 | 2026-07-21 a 2026-07-26 | **El simulador de cuatrimestre (US-016)**: conectar catálogo + correlativas + historial + reseñas en la feature que da nombre al producto. Más US-009-f (errores globales) y US-039-f (offline). Extra: vidrieras del producto (landing + sign-in) y vocabulario de datos de prueba/demo. | ✓ Done |
| S11 | 2026-07-23 a 2026-07-26 | **Terminar el planificador**: oferta de comisiones con horarios (US-093, absorbe el pendiente de US-065), choques y comparador reales (US-096), borradores persistidos con promote (US-023, absorbe US-025/026), compartir al corpus y feed público (US-024/US-027). Regla: la landing no promete nada que la herramienta no haga. | ✓ Done |
| S12 | 2026-07-31 a 2026-08-16 | **Cerrar el lazo que produce el corpus**: US-015 entró (el mecanismo de edición con su evento); US-097/098/099 se cancelaron cuando el viraje de tesis ([THESIS.md](../THESIS.md), [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md)) retiró el planificador al que servían. | ■ Cerrado por viraje |
| **R0** | por definir | **El rework arranca achicando**: se podan el planificador y lo que el viraje dejó sin dueño, se cierran los dos ADR en propuesto, y se arregla la fuga de enumeración que el inventario encontró. No construye nada del producto nuevo. | Planificado |

Convenciones:

- **US como value increment**: una US = un incremento de valor visible al usuario. **En backlog vive como doc parent (`US-NNN`)** con sub-tasks que pre-comprometen la decomposición técnica (Backend / Frontend / Infra). **Cuando entra a sprint el parent se reemplaza por subdivisiones** (`US-NNN-b`, `US-NNN-f`, `US-NNN-i`); el parent doc deja de existir como archivo separado. **No coexisten parent + subdivisiones** al mismo tiempo: o lo uno o lo otro, según el estado del requerimiento.
- **Sufijo `-i` significa integrated**: `US-029-i`, `US-033-i`. Un solo PR que junta backend + frontend porque el requerimiento es chico y no es usable hasta tener las dos puntas. **Excepciones**: el namespace foundational `US-FNN-x` usa `-i` con sentido "infra" (`US-F03-i`, `US-F04-i`); fuera de F, también se permite `-i` con sentido "infra/scheduling" cuando el requerimiento es backend + DB schema (ej. `US-022-i` para Wolverine ScheduledJob + migrations). Cada doc lo aclara explícito en su header.
- **Reglas duras**: parent y subdivisiones no coexisten. Si una US ya está en sprint o done, su archivo es la subdivisión correspondiente, NO el parent. Para integrated (`-i`), el doc único es la subdivisión.
- Sprints: identificados como `S1`, `S2`, etc. `S0 (pre-sprint)` agrupa retroactivamente todo el trabajo done previo a la formalización del sprint cycle. **Cadencia: S1/S2 fueron de 7 días flotantes; desde S3 lunes → sábado (6 días útiles).** El domingo queda como buffer/descanso.
- Definition of Done por US: [`docs/plan/definition-of-done.md`](definition-of-done.md).

---

# El rework

Desde el 2026-08-16 esto no es la continuación del planificador: es su reemplazo. [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md) retiró el producto anterior y [`THESIS.md`](../THESIS.md) fija el nuevo. **Todo lo que está debajo de esta sección, de S0 a S12, es la historia del producto en retiro**, y se conserva sin editar.

**Por qué la numeración cambia de prefijo.** Los sprints del rework son `R0`, `R1`, `R2`. No siguen a S12 porque no son su continuación, y no reinician en `S0` porque ese nombre ya está tomado por el pre-sprint de abril. El prefijo dice, sin nota al pie, que abajo hay otro producto.

## Contra qué se planifica

103 stories en 13 épicas, todas con sus escenarios ejecutables ([`docs/product/`](../product/README.md)), 34 pantallas con ficha y boceto, y un catálogo de 46 frases semilla (7 de exigencia y 39 de gestión: el desbalance está sin resolver). Eso es el producto ideado. Lo que sigue es cuánto de lo construido sirve.

## El inventario: qué hay hoy

Medido el 2026-08-21 sobre 880 archivos `.cs` en 6 módulos con 64 features, más 41 features de frontend.

| Módulo | Sobrevive | Adapta | Se poda | Lo que falta |
|---|---|---|---|---|
| `identity` (196 .cs, 21 feats) | 13 | 8 | 1 | las colas de verificación manual (docente, cargo institucional, constancia) |
| `academic` (333 .cs, 12 feats) | 5 | 5 | 2 | `CanonicalCareer` y `CanonicalSubject`, que son entidades nuevas y no un rename |
| `reviews` (127 .cs, 12 feats) | 6 | 6 | 3 | `Phrase`, `MarkedPhrase`, `Voice`, `Outcome`, el testimonio |
| `enrollments` (79 .cs, 5 feats) | 5 | 0 | 1 | nada: `EnrollmentRecord` es el ancla que la tesis sigue usando (ADR-0005) |
| `moderation` (44 .cs, 4 feats) | 2 | 2 | 0 | las tres colas de verificación y la auditoría del equipo |
| `planning` (101 .cs, 10 feats) | 0 | 0 | 10 | nada: se retira entero, salvo un rescate (ver R0) |

**El corazón de la tesis no existe.** `phrase`, `frase` y `testimonio` dan **cero archivos** en el backend. Lo que reemplaza al puntaje no tiene una línea escrita.

> **Confianza del inventario.** Los veredictos por feature salen de una pasada de cinco agentes sobre el código, con `file:line`. Sirven como dirección, no como contrato. Los inventarios de `reviews`, `enrollments` y `academic` se **re-mapearon el 2026-08-23** contra los IDs vigentes (US-127 a US-230): el detalle queda abajo. El de `identity` ya citaba IDs vigentes; `planning` se retiró en R0.

### El re-mapeo contra el catálogo vigente (issue #353)

Cada feature cita un ID vigente o declara que no mapea. "Se rehace" significa que la necesidad sobrevive pero la forma actual no; "se va" que contradice el producto nuevo.

**`reviews`**

| Feature | Veredicto |
|---|---|
| PublishReview | Se rehace para US-146/US-147: la unidad pasa a la cursada con frases marcadas; el texto pasa a testimonio (US-135, ADR-0068) |
| EditReview · DeleteOwnReview | US-165 (editar o borrar lo que conté) |
| RespondToReview | Se rehace para US-172, con el chequeo previo y el plazo de US-179 |
| EditTeacherResponse | Sin story vigente: editar la réplica se decide con Replicar (US-176, el estado del canal) |
| GetMyPendingReviews | Se va: un checklist de cursadas pendientes contradice US-147 ("arranca eligiendo una, sin checklist") |
| GetMyReviews | US-165, vía Mis aportes (SC-018) |
| BrowseReviews | Se rehace: la lectura vive en las fichas (US-135, US-136), no en un browse global |
| CastReviewVote | Se rehace para US-188, con la voz de ADR-0075 (una por persona y cursada, no un contador de útil) |
| SubjectInsights · TeacherInsights | Se van: promedian dificultad y utilidad; los reemplaza la ficha de frases con voces (ADR-0064) |
| ReconcileEnrollmentChanges | Tarea técnica sin story; se revisa contra la clave cuenta × materia × período (US-163) |

**`enrollments`**

| Feature | Veredicto |
|---|---|
| RegisterEnrollment | US-154 (cómo terminó) y US-163 (la clave por período); el registro de cursada sigue siendo el ancla (ADR-0005) |
| UpdateEnrollment | US-165 |
| HistorialImports | Sin story vigente: reseñar ya no pide historial masivo; si sobrevive, es para trayectoria (US-152) y se decide ahí |
| GetMyTranscript | US-152, la lectura propia de trayectoria, vía Mi situación y Mis aportes |
| SubjectPassRate | US-152 ("por materia muestra dónde se cae"), sobre la base de ADR-0047 |

**`academic`**

| Feature | Veredicto |
|---|---|
| Search | US-132, vigente |
| PublicCatalog (11 endpoints) | La base de lectura de las fichas (US-127 a US-139): el dato sirve, la presentación se rehace |
| AdminUniversities | US-191 y US-203 (qué cargar el primer día) |
| AdminCareers | US-195 (la carrera canónica es entidad nueva, falta) |
| AdminCareerPlans | US-191 y US-204 (la reforma no parte el corpus) |
| AdminSubjects | US-197 (vincular declaradas a la canónica; la canónica falta) |
| AdminPrerequisites | US-143 y US-144 (la co-cursada las consume) |
| AdminAcademicTerms | Vigente como dato del período; sin story propia |
| AdminTeachers | US-196 (la cátedra como entidad propia falta; el docente actual es su insumo) |
| AdminCommissions | US-196 (cátedra ≠ comisión) |
| CareerPlanImports | US-202 (fuente no oficial) y US-191 |
| CareerPlanImportQueue | US-192 y US-200 (la cola por demanda, con su ritmo real) |

---

## R0 · Achicar antes de construir

**Estado**: Planificado, con backlog operativo en GitHub: milestone **R0**, seis issues, 20 puntos. **Rango**: por definir (la cadencia la fija Lucas).

**El foco**: el rework no empieza construyendo. Empieza sacando lo que el viraje dejó sin dueño y fijando los parámetros que ningún test puede asumir. Es el orden de [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md) y del propio [CLAUDE.md](../../CLAUDE.md): antes de optimizar o construir algo, preguntar si debería existir.

**Lo que R0 explícitamente NO hace**: nada del producto nuevo. Ni frases, ni voces, ni testimonio, ni réplica. Eso es R1 en adelante.

### Secuencia

| # | Issue | Pts | Qué gatea |
|---|---|---|---|
| 1 | [#348 · Cerrar ADR-0075 y ADR-0076](https://github.com/lucasidev/plan-b/issues/348) | 1 | ✓ cerrado 2026-08-24: los dos aceptados |
| 2 | [#349 · Rescatar el evaluador a academic](https://github.com/lucasidev/plan-b/issues/349) | 3 | la poda: va antes, o US-144 pierde su lógica |
| 3 | [#350 · Podar planning entero](https://github.com/lucasidev/plan-b/issues/350) | 5 | el criterio 1 de salida (cero Planning en backend) |
| 4 | [#351 · Arreglar la fuga de enumeración](https://github.com/lucasidev/plan-b/issues/351) | 3 | nada: independiente; su test es el primero del régimen nuevo |
| 5 | [#353 · Rehacer el mapeo del inventario](https://github.com/lucasidev/plan-b/issues/353) | 3 | la planificación de R1: sin esto se planifica contra referencias muertas |
| 6 | [#352 · Propagar ADR-0078](https://github.com/lucasidev/plan-b/issues/352) | 5 | la ficha: la política de muestra chica se decide acá; la curaduría es sesión con Lucas |

El 4 y el 5 no dependen de nadie y pueden correr en paralelo con el rescate y la poda. El 1 y la parte de curaduría del 6 son de Lucas; el resto es ejecutable.

### Tareas

- [x] **Cerrar los dos ADR en propuesto** (2026-08-24: los dos en aceptado). [ADR-0075](../decisions/0075-the-published-proportion-has-a-z-a-denominator-and-one-voice-per-cursada.md) fija el z del encogimiento, el denominador de una proporción y cuántas voces suma una persona; sin eso ninguna proporción publicada se calcula dos veces igual. [ADR-0076](../decisions/0076-the-three-doors-answer-the-same-whether-the-account-exists-or-not.md) fija que las tres puertas responden igual exista o no la cuenta. Los dos son decisión de Lucas, y son la compuerta de todo lo demás: **R1 no puede empezar con parámetros en propuesto**.

- [x] **Rescatar el evaluador de disponibilidad a `academic`, antes de tocar `planning`.** Mueve `SubjectAvailabilityEvaluator`, su interfaz, `SubjectAvailability`, `SubjectProgress`, `PrerequisiteEdge` y `AvailabilityStatus` de `planning/Domain/Availability/` a `academic/Domain/Availability/`. Es lógica de dominio pura, sin I/O. **No es una decisión de este plan**: la story US-144 ya lo dejó escrito en su propio criterio de aceptación.

- [x] **Podar `planning` entero.** Sus 10 features, el aggregate `SimulationDraft` con sus hijos, los servicios de horarios (`ScheduleClash`, `ScheduleClashDetector`, `ScheduledBlock`), las dos migraciones EF del schema `planning`, el wiring de DI en `Program.cs` (líneas 17-18, 124-125, 139, 198-199), las referencias a `PlanningDbContext` en `DevMigrationsHostedService` y `MigrateDbCommand`, los tests de integración de `Planning/`, y el feature `plan` del frontend con sus llamadas a `/api/planning/*`.

- [x] **Arreglar la fuga de enumeración en el registro.** Verificado en el código: `RegisterUserCommandHandler.cs:37-40` devuelve `EmailAlreadyInUse` cuando el mail ya tiene cuenta, que es exactamente lo que ADR-0076 prohíbe. Es la primera pieza del producto nuevo que se toca, y se toca porque es una fuga, no porque sea una feature.

- [x] **Propagar ADR-0078, parte hecha (2026-08-24)**: el tema asignado a las 46 frases y las cuatro familias pobladas en sesión de curaduría (el catálogo quedó re-estructurado en una tabla con las tres coordenadas, 67 frases, sujetos = las fichas reales, y el balance-por-eje derogado); y la tesis, el glosario y el CLAUDE.md propagados. La tesis publicaba "por eje" con cabecera dual dos días después de decidir lo contrario: el documento raíz va primero en toda propagación futura.
- [ ] **Propagar ADR-0078, lo que queda** (pasa a R1 si no entra): reescribir las stories de Reseñar al flujo por temas y las fichas de pantalla que citan la cabecera dual (SC-002, US-173); el Método suma los indicadores nuevos (prevalencia por tema, retrato, ¿responden?) **con sus definiciones escritas**, incluida la regla de comparabilidad de la prevalencia cuando el catálogo de un tema cambia (hoy no existe); y decidir la política de muestra chica (supresión, sin piso, o híbrida), que es compuerta de la ficha y decisión de Lucas.

- [x] **Rehacer el mapeo story del inventario** de `reviews`, `enrollments` y `academic` contra los IDs vigentes (US-127 a US-230). Sin esto, R1 se planifica contra referencias muertas.

### Cómo se sabe que R0 está listo

Cuatro cosas verificables, no una sensación:

1. `grep -rn "Planning" backend --include="*.cs"` fuera de `docs/history` devuelve **cero**.
2. `just ci` en verde: build, tests, lint, typecheck y docs.
3. Los dos ADR están en **aceptado** o en **rechazado**, ninguno en propuesto.
4. Existe un test que prueba que registrarse con un mail que ya tiene cuenta responde **igual** que con uno que no. Hoy ese test está en rojo, y es el primero del régimen nuevo.

### Notas

**El orden entre el rescate y la poda no es negociable**: si `planning` se borra antes de mover el evaluador, US-144 y US-145 se quedan sin la lógica que resuelve correlativas y hay que reescribirla.

**La poda toca la base de datos.** Las dos migraciones del schema `planning` tienen su `Down`, así que son reversibles, pero si se corrieron hay datos. La política de rollback está en [`rollback.md`](../engineering/rollback.md).

**No hay story que citar.** R0 es trabajo técnico sin producto atrás, que según [`story-template.md`](story-template.md) se anota como tarea de sprint y no inventa una US para justificarse.

---

## Lo anterior: el producto en retiro

Todo lo que sigue, de S0 a S12, es el planificador de cuatrimestre. Se conserva como historia y no se edita.

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
- **ERD consolidado** (`docs/engineering/data-model.md`): modelo de datos por bounded context.
- **Documentos DDD táctico/estratégico** (`docs/history/domain-v1/strategic/`, `docs/history/domain-v1/tactical/`):
  - `eventstorming.md`, `bounded-contexts.md`, `context-map.md`, `aggregates.md`, `domain-events.md`, `value-objects.md`.
- **Catálogo de epics + user stories** (`docs/domain/epics/`, `docs/plan/stories/`): 11 epics (incluye EPIC-00 Foundations) y ~52 user stories en archivos individuales.

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

**Foco original**: cerrar el requerimiento de auth completo end-to-end (register UI + verify + login + sign-out).

**Replan mid-sprint (2026-04-28)**: el requerimiento de auth original cerró en 2 días con runway restante. Se sumaron: cleanup auth (resend / expire / forgot password) + AppShell del área autenticada + home del dashboard. Meta declarada: **"el evaluador entra a plan-b y ve la silueta completa del producto post-login"**.

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
6. **`docs/engineering/git-workflow.md`** (workflow rules): bitácora paso a paso de commit / branching / conflict / merge.
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
- Velocidad del requerimiento auth permitió sumar T-series + git workflow rules + StudentProfile en el mismo sprint.
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

**Sesión de rediseño UX (post-S1, 2026-05-02)** generó 3 ADRs (ver [ADR-0041](../decisions/0041-ux-redesign-after-claude-design.md)):
- [ADR-0039](../decisions/0039-meilisearch-as-the-global-search-engine.md): Meilisearch como motor de búsqueda global.
- [ADR-0040](../decisions/0040-notifications-as-a-new-bounded-context.md): Notifications como BC nuevo.
- [ADR-0041](../decisions/0041-ux-redesign-after-claude-design.md): Delta del rediseño + plan de migración.

### Scope cerrado en S2

- [US-037-f](../history/domain-v1/stories/US-037-f.md): **Onboarding frontend** 4 pasos (Bienvenida / Carrera / Historial / Listo). **Done.**
- [US-044](../history/domain-v1/stories/US-044.md) + [US-044-a](../history/domain-v1/stories/US-044-a.md) + [US-044-b](../history/domain-v1/stories/US-044-b.md) + [US-044-c](../history/domain-v1/stories/US-044-c.md): **Inicio v2** port literal del mock V2Inicio. **Done.**
- [US-045-a](../history/domain-v1/stories/US-045-a.md): **Mi carrera shell + 5 tabs** con stubs. **Done.**
- **DevEx**: pre-push hook con gates rápidos (lint, typecheck, build, unit). E2E corre en CI siempre en cada PR como gate antes de merge (job `e2e` en `ci.yml`). Régimen del 2026-05-24 tras reset del approach overengineered de "zona E2E" con detector custom + auto-label (PR #87 histórico).
- **Design pipeline**: canvas screenshots auto-generados via Playwright sobre `plan-b-direcciones.html`, embed en US frontend como mockup ref, doc canónico [`docs/product/design-system.md`](../product/design-system.md). PR #90 merged.
- **Em-dash audit**: 210 docs sweep + auditoría manual de 73 files (titles, headings, comentarios) post regla absoluta.
- **Audit canvas v3 app/landing/design-system + rediseño app (día 7, 2026-05-09)**:
  - Sync del canvas v2 con 3 HTMLs (design-system / landing / app) + 48 artboards totales. Pipeline de screenshots reescrita para iterar multi-HTML.
  - **12 US nuevas creadas para la app del alumno**: US-054-f (landing), US-055 (borrar reseña), US-059-f (rediseño Auth+Onb), US-039-f (offline banner), US-077-f (panel notifs frontend), US-077-b + b-1/-b-2/-b-3 (Notifications BC backend splitada), US-009-f (errores 404/5xx), US-079-i (cambio password integrated), US-085 (strike system + pedir edición al autor, extiende US-051).
  - **15 US existentes actualizadas** con mockup refs + AC visual del canvas v3 (auth, onb, home, mi-carrera, planificar, reseñas, rankings, búsqueda, notif, cuenta, soporte).
  - **3 decisiones de scope zanjadas** en el rediseño app: US-051 scope (→ split a US-085 con strike system + pedir edición), US-072 modal cambiar contraseña (→ split a US-079-i integrated siguiendo patrón US-029-i / US-033-i), US-077-b backend de notifications (→ full BC siguiendo ADR-0040, splitado en 3 sub-slices b-1 / b-2 / b-3).
  - PR `docs/v2-redesign` mergeado como [#94](https://github.com/lucasidev/plan-b/pull/94).
- **Backoffice doc'd (día 7, 2026-05-12)**:
  - Sync del 4° canvas (`plan-b-admin.html` + módulo `admin-shell.jsx` + `admin-screens-1/2/3.jsx`) con 21 artboards en 5 secciones (shell, afiliar uni, datos académicos, moderación, ops). Pipeline de screenshots ampliada para incluir el slug `admin` (prefix `admin-<section>-<id>.png` para evitar colisión con `onb` del app).
  - **6 US nuevas creadas para el backoffice**: US-081 (admin shell + dashboard ops + componentes AdmTable/AdmFilters), US-007 (importador CSV con preview/diff), US-006 (merge de Subjects duplicados), US-084 (migración asistida de plan), US-086 (audit log per-user, tab del detalle de usuario, cross-BC), US-005 (feed global de actividad reciente).
  - **9 US existentes actualizadas** con mockup refs admin + AC visual del canvas: US-050 (reescrita: cola-de-reports en vez de cola-de-reviews), US-051 (recortada a uphold/dismiss + AC visual del detalle con 2 opciones live + 3 placeholder pointing a US-085), US-053 (pattern siblings con US-086/US-005), US-060 (gestionar University), US-061 (Career + CareerPlan), US-062 (Subject + Prerequisite + correlativas), US-063 (Teacher), US-065 (Commission), US-058 (deshabilitar member + tabs detalle).
  - **5 decisiones de scope zanjadas en el rediseño admin**: cola es por report (no por review, canvas manda), audit log per-BC (ADR-0042, cada módulo owns su projection con cross-BC views via Dapper UNION ALL), strike system+ocultar+banear all-in en US-085 (out de US-051), importador/merge/migración como US separadas, admin shell separado como bloqueante US-081.
  - **1 ADR nuevo**: [ADR-0042](../decisions/0042-audit-log-per-bc-not-central.md) (audit log per-BC, no central; extiende ADR-0031).
  - PR `docs/backoffice-module` (este PR).

### Audit del estado del frontend vs canvas (2026-05-12 v3 full)

Tercera iteración del canvas: ahora se splitea en HTMLs por área. **69 artboards totales** en 4 canvases (`plan-b-design-system.html` 1 · `plan-b-landing.html` 1 · `plan-b-app.html` 46 · `plan-b-admin.html` 21). PR `docs/v2-redesign` (#94) entrega los 3 primeros; PR `docs/backoffice-module` (este) entrega el admin.

Reorganización del app canvas: ya no hay sección "Modales" ni "Errores globales" como separadas; los modales y errores ahora viven dentro de la sección a la que pertenecen (errores en Inicio, modales en Planificar / Reseñas / Cuenta).

Audit 1-a-1 contra el código actual:

| Bucket | Capturas | US distintas | Acción |
|---|---|---|---|
| `IMPL_OK` (matchea) | 2 | 1 (US-044) + DS transversal | Nada. |
| `IMPL_DRIFT` (rediseño visual + estados de error) | 10 | 4 (US-010-f, US-028-f, US-033-i, US-037-f) | Cubierto por [US-059-f](../history/domain-v1/stories/US-059-f.md) (incluye AC nuevos para banners inline `AuthErrorBanner` en signup-err / login-err). |
| `PENDIENTE_US_DOC` | 32 | 16 (mi-carrera b/c/d/e + US-046 + US-047 + US-048 + US-049 + US-054-f + US-059-f + US-057..074 + US-019) | Implementar; docs ya existen + AC nuevas de empty states / modales agregadas. |
| `SIN_US` resuelto con US nuevas | 4 | 4 nuevas | Ver lista abajo. |

**Total US a agregar al backlog post-audit (2026-05-09 v2)**: 4 nuevas + 7 existentes con AC nuevas + las 2 doc'd antes (US-054-f, US-059-f). 

US nuevas creadas:
- [US-055](../history/domain-v1/stories/US-055.md): Borrar reseña propia (action + modal destructivo). Cubre `modales-v2-modal-borrar`.
- [US-039-f](../history/domain-v1/stories/US-039-f.md): Estado offline (banner global + acciones en pausa). Cubre `home-v2-inicio-offline`.
- [US-077-f](../history/domain-v1/stories/US-077-f.md): Panel de notificaciones (dropdown del bell). Cubre `notificaciones-v2-notif` + `notificaciones-v2-notif-empty`. Pendiente crear US-077-b para el backend.
- [US-009-f](../history/domain-v1/stories/US-009-f.md): Páginas de error globales (404 + 5xx). Cubre `errores-v2-err-404` + `errores-v2-err-5xx`.

US existentes con AC nuevas:
- [US-019](../history/domain-v1/stories/US-019.md): mockup ref del modal de reportar agregado.
- [US-026](../history/domain-v1/stories/US-026.md): AC visual del modal descartar borrador.
- [US-029-i](../history/domain-v1/stories/US-029-i.md): AC modal de confirmación antes del sign-out.
- [US-044](../history/domain-v1/stories/US-044.md): AC empty state global del Inicio (alumno sin período).
- [US-046](../history/domain-v1/stories/US-046.md): AC empty state Planificar + AC modal publicar plan.
- [US-048](../history/domain-v1/stories/US-048.md): AC empty states de tabs Pendientes y Mis reseñas.
- [US-072](../history/domain-v1/stories/US-072.md): AC sección Seguridad + modal cambiar contraseña con sesión activa (decisión pendiente: AC interno vs splittear US-079-i).
- [US-059-f](../history/domain-v1/stories/US-059-f.md): AC banners de error inline en signup y login.

### Definition of Done de S2 (verificación)

- ✓ Lucía (verificada en S1) puede entrar a `/onboarding/welcome` y completar los 4 pasos hasta crear su StudentProfile.
- ✓ Lucía con StudentProfile entra a `/home` y ve el Inicio v2 completo (greeting + período + 2 columnas con todos los bloques).
- ✓ Lucía entra a `/mi-carrera` y ve el shell + 5 tabs (Plan / Correlativas / Catálogo / Docentes / Historial), todos como `ComingSoon` stubs.
- ✓ E2E corre siempre en CI en cada PR como gate antes de merge (un job más en `ci.yml`). Sin labels, sin detector custom: política simplificada el 2026-05-24 al estándar industria.
- ✓ Cada US frontend tiene mockup embed con la imagen del canvas correspondiente.

### Retrospectiva corta

**Salió mejor de lo esperado**:
- Pipeline de canvas screenshots: 1 spec automatiza captura de 30 artboards. Reduce drift entre código y diseño.
- US-044 port literal: el mock como fuente única funcionó perfecto. Cero ambigüedad.

**Quedó débil**:
- Auth + onboarding tienen drift visual con el canvas v2 (que cerró el 2026-05-02, después de implementar US-010-f / US-028-f / US-037-f en S1). Documentado en [US-059-f](../history/domain-v1/stories/US-059-f.md). No es bug, es deuda visual conocida.
- "Regla declarada pero sin enforcement": antes había merges que pasaban CI gates pero rompían E2E (caso US-037-f que dejó `sign-up.spec.ts` esperando `/home`). Cubierto desde 2026-05-24 por "E2E siempre en CI" como gate antes de merge.

---

## S3 ✓ Done

**Rango**: 2026-05-11 a 2026-05-16 (lunes → sábado, 6 días útiles). Primer sprint con la cadencia nueva.

**Foco inicial**: cerrar **Mi carrera** completo. US-045-a (shell + nav de tabs) ya cerró en S2; quedan los 4 tabs de contenido como carry-over.

### Scope acordado (cerrado)

- [US-045-b](../history/domain-v1/stories/US-045-b.md) Mi carrera tab Plan (heatmap por año/cuatrimestre). ✓ Done.
- [US-045-c](../history/domain-v1/stories/US-045-c.md) Mi carrera tab Correlativas (grafo SVG). ✓ Done.
- [US-045-d](../history/domain-v1/stories/US-045-d.md) Mi carrera tabs Materias + Docentes + drawers de detalle. ✓ Done.
- [US-045-e](../history/domain-v1/stories/US-045-e.md) Mi carrera tab Historial (timeline + KPIs). ✓ Done.

### Scope adicional que entró durante el sprint

- US-013 cargar historial manual (PR #104 Academic subjects/terms + PR #106 Enrollments BC + form). **No cerró end-to-end**, aunque la tabla de arriba lo dijo hasta la revisión de producto del 2026-07-29: entregó el write (`POST /api/me/enrollment-records`) y el formulario, y quedó sin el read. El alumno cargaba una materia, se persistía, y la pantalla a la que el propio sistema lo redirigía (`/my-career?tab=transcript`) le decía "Tu historial está vacío" porque `HistoryTab` se renderizaba sin datos. Ocho sprints con la capacidad declarada terminada y el dato invisible para su dueño.
- US-014 importar historial PDF/texto (PR #117): parser heurístico + worker Wolverine async + preview editable + confirm. AC completos, status `Done` en el doc.
- **US-088 importar plan de estudios desde PDF en onboarding paso 2** (mergeado el último día del sprint, 2026-05-16): backend (3 endpoints + worker + parser + migration + 11 integration tests + flag `IsOfficial` en Career/CareerPlan/Subject) + frontend (feature import-career-plan + página separada con state restore via URL params + integración career-form + 5 component tests). Crowdsourcing del catálogo: el plan creado queda `isOfficial=false` con badge "No oficial".
- JwtBearer middleware (PR #114): cierre del workaround pre-JWT en los endpoints `/api/me/*`.
- Workflow GHA auto-regen `bun.lock` para PRs de Dependabot (PR #115).
- Bug fix post-presentación (PR #116): cross-user data leak en tab Historial + header hardcoded en Mi carrera.
- Dependabot hardening: política tier 2 extendida a test harness + lucide (PRs #107 + #110); 4 PRs major evaluados/cerrados con notas (BCrypt/Wolverine 5.39, vitest 4, vitejs/plugin-react 6, lucide-react 1).
- Ops: scripts OS-agnostic (PR #105), CI workflow post-merge skip (PR #103).

---

## S4 ✓ Done

**Rango**: 2026-05-18 a 2026-05-24 (lunes → sábado, 7 días útiles: el cierre se corrió un día porque la planificación arrancó el martes; las próximas aperturas se hacen el lunes mismo para no acumular esta deuda).

**Foco**: cerrar **el shell del alumno** después de Mi carrera. Continuidad natural con S3 (alumno ya tiene historial + plan + import + Mi carrera; ahora tiene Mi perfil, Planificar shell, settings, Ayuda, Sobre plan-b). Reseñas como capítulo nuevo grande quedan para S5.

### User stories cerradas (7)

Las 6 del scope original + 1 que surgió mid-sprint:

| US | Título | Effort | PR |
|---|---|---|---|
| [US-072](../history/domain-v1/stories/US-072.md) | Ajustes (notificaciones / privacidad / idioma / tema / Seguridad) | M | #124 |
| [US-079-i](../history/domain-v1/stories/US-079-i.md) | Cambio de contraseña con sesión activa | M | #124 (junto con US-072) |
| [US-047](../history/domain-v1/stories/US-047.md) | Mi perfil (identidad académica + zona peligrosa) | M | #125 |
| **US-038-bis** | **Soft delete con anonimización (ADR-0044)**, mid-sprint | M | #125 (junto con US-047) |
| [US-046](../history/domain-v1/stories/US-046.md) | Planificar shell + 2 tabs + modal publicar | M | #126 |
| [US-073](../history/domain-v1/stories/US-073.md) | Ayuda (FAQ + mailto soporte) | S | #128 |
| [US-074](../history/domain-v1/stories/US-074.md) | Sobre plan-b (manifiesto + equipo + stats + open source) | S | #128 |

Suma final: **5 M + 2 S** (vs 4 M + 2 S planificado). El bonus M es US-038-bis, no estaba en el scope original.

### Replan mid-sprint: ADR-0044 + US-038-bis

Al implementar US-047 surgió la pregunta: si el alumno puede dar de baja la cuenta, ¿qué pasa con sus reseñas? La US-038 original definía hard delete (eliminar todo). Pero las reseñas son **corpus crowdsourced**: borrarlas castiga a los lectores futuros por una decisión del autor.

Decisión: redactar [ADR-0044](../decisions/0044-soft-delete-of-the-user-with-corpus-preservation.md) (soft delete con anonimización del PII, patrón Reddit/Stack Overflow), cancelar US-075 (self-disable, era el paso intermedio que sobraba) y entregar **US-038-bis** end-to-end (backend `User.Deactivate` + anonimización SHA-256 + frontend `feature/deactivate-account` con modal anti-accidental). Las reseñas quedan publicadas como "Ex-miembro".

### Bonus técnico (no es US, pero entró en S4)

- **react-doctor cleanup**: scan inicial del frontend (score 79 → **100/100**, 352 → 0 hallazgos). 11 errores críticos arreglados (server actions con `getSession()` defense in depth, `auth-hero.tsx` split para Fast Refresh, `forwardRef` removido en `Button`/`TextField`/`PasswordField` por React 19, semánticos `<output>`/`<meter>`/`<dialog>`/`<section>` en lugar de `role="..."`). Suppressions documentadas en `frontend/react-doctor.config.json`.
- **Pre-push hook react-doctor**: `lefthook.yml` agrega `frontend-react-doctor` que corre `react-doctor --diff origin/main --fail-on error` (~2-3s). Bloquea push si la rama introduce un error nuevo (severity=error). Warnings los muestra sin bloquear. PR #127.

### Lecciones / cambios para sprints siguientes

- **Tests E2E pre-existentes flakearon** mid-sprint (3 specs: `my-profile:edit-mode-save`, `my-profile:dar-de-baja-dialog`, `settings:toggle-reload`). Race conditions con `revalidatePath` + optimistic UI. Marcados como `test.fixme` con TODO trazado a cada US-fix correspondiente. Deuda explícita para S5/S6: arreglar con `storageState` o `router.refresh` + guard contra loop infinito.
- **react-doctor `useEffectEvent` rule** sigue flagging APIs marcadas como experimental en React 19. Suppression con explicación hasta que la API salga del experimental status.
- **Convención cierre semanal**: el sábado se cierra el sprint con tag narrativo + STATUS.md sync. Domingo libre. Lunes apertura formal del siguiente.

---

## S5 ✓ Done

**Rango**: 2026-05-25 a 2026-06-08 (planificado a 2026-05-30; US-017/049 cerraron en la semana planificada, el resto del requerimiento entre el 2026-06-05 y el 2026-06-08, con una pausa sin commits del 2026-05-31 al 2026-06-04). El PR de cierre #147 (guarda `clientApiFetch` + fix de server actions en prod) mergeó el 2026-06-09.

**Foco**: **slice de reseñas, el feature core del producto crowdsourced**. S0-S4 cerraron toda la infraestructura del alumno pero el corpus estaba vacío. S5 cerró el loop end-to-end: publicar / explorar / editar / borrar / reportar.

### User stories cerradas (6)

Las 6 del scope original. US-019 era la diferible a S6 y entró igual, con el módulo Moderation completo.

| US | Título | Effort | PR |
|---|---|---|---|
| [US-017](../history/domain-v1/stories/US-017.md) | Publicar reseña (backend: `POST /api/me/reviews` + filter clean/triggered + audit log) | L | #134 |
| [US-049](../history/domain-v1/stories/US-049.md) | Editor de reseña 6 campos con preview vivo | L | #135 |
| [US-048](../history/domain-v1/stories/US-048.md) | Reseñas shell + 3 tabs Pendientes / Mías / Explorar + endpoints GET | M | #138 #139 #140 |
| [US-018](../history/domain-v1/stories/US-018.md) | Editar reseña propia (`PATCH` + audit log + cooldown + filter re-run) | S | #141 |
| [US-055](../history/domain-v1/stories/US-055.md) | Borrar reseña propia (`DELETE` soft + modal destructivo + re-proyección de reads) | S | #142 |
| [US-019](../history/domain-v1/stories/US-019.md) | Reportar reseña (`POST /api/reviews/{id}/reports` + auto-quarantine cross-module + modal en Explorar) | M | #143 |

### Extras que entraron en el sprint

- **PR #137**: refactor frontend de rutas + features + identifiers a inglés (cleanup S2-S5). Cierra la deuda de rutas en español (`/resenas` → `/reviews`).
- **PR #147**: dos fixes. (1) Guarda en `clientApiFetch` que falla explícito si un fetcher client-side corre en SSR; generaliza el hotfix del badge de pendientes (crash SSR por URL relativa, hotfix dentro de #143) e incluye el caso add-enrollment que faltaba. (2) Fix del cuelgue intermitente de server actions en build de prod: el render inline que metían `revalidatePath`/`redirect` en la respuesta del action estancaba el stream; los actions de publish/edit/delete pasaron a mutaciones puras y el cliente invalida + navega. Verificado con repro estadístico en build de prod local: 10/10 contra baseline de 81% de falla.
- **PR #133**: `append-changelog` tolera force pushes.
- **PR #136**: Dependabot backend minor/patch.

### El loop que cierra (verificado)

1. Alumno termina de cursar → la cursada aparece en `/reviews` tab Pendientes.
2. Click → editor 6 campos con preview vivo → publica (filter clean/triggered + audit log).
3. La reseña aparece en tab Explorar (feed con filtros + paginado) y en tab Mías.
4. El autor puede editarla (cooldown + re-run del filter) o borrarla (soft delete + modal destructivo).
5. Cualquier alumno puede reportarla; al llegar al threshold se auto-cuarentena (`under_review`) cross-module.

### Retrospectiva corta

**Salió mejor de lo esperado**:
- Entraron las 6 US, incluida US-019 que estaba marcada como diferible. El módulo Moderation nació entero (aggregate ReviewReport + auto-quarantine vía integration event).

**Quedó débil**:
- **Cadencia**: el sprint de 6 días útiles tomó 2 semanas calendario. La pausa fue externa al proyecto, pero el cierre formal quedó stale: este doc decía "Open" con el requerimiento ya mergeado.
- **Bugs que llegaron a main**: el badge de pendientes crasheaba el SSR (URL relativa en fetcher client-side; hotfix dentro de #143 + guarda generalizada en #147) y el cuelgue intermitente de server actions en build de prod (fix en #147).
- **Mapping lossy del editor**: publish/edit solo persisten dificultad + texto; rating, horas semanales, tags y recomendaciones se descartan (decisión intencional de US-048 para cerrar el flow E2E). Bloquea los crowd insights: el triage de arranque de S6 lo convirtió en US-089.
- **Deuda anotada al cierre**, triageada en el arranque de S6 (ver tabla de salida del audit en S6): badge "editada tras respuesta docente", conteos reales en el modal de borrar, ADR del patrón cross-module Reviews↔Moderation (auto-quarantine), visual review de modales.

**Salió como esperado**:
- El orden de ataque (backend base primero, shell después, integraciones al final) funcionó sin bloqueos entre US.

---

## S6 ✓ Done

**Rango**: 2026-06-15 a 2026-06-20 (lunes → sábado). La semana del 2026-06-10 al 2026-06-13 corre como pre-sprint: housekeeping del audit + docs de las US nuevas.

**Foco**: **corpus consumible, lado materia**. El corpus de S5 solo se lee desde el feed Explorar autenticado; S6 lo vuelve consumible del lado lector. Scope core, en orden:

1. **US-089** (enabler, nueva del triage; doc pendiente): persistir el modelo completo de reseña (rating 1-5, horas/semana, tags, recomendaría cursada / retomaría docente) que hoy el editor descarta por el mapping lossy contra el modelo de US-017. Extiende el aggregate Review + migración; saca el mapping lossy de write-review / edit-review. Va primero: sin esto US-002 no puede mostrar rating promedio. Effort M.
2. **[US-002](../history/domain-v1/stories/US-002.md)**: página de materia con reseñas + agregados (rating promedio, histograma). Effort M.
3. **[US-004](../history/domain-v1/stories/US-004.md)**: buscar materia o docente (Postgres full-text + trigram). Effort M. **Entregado materia-only** (2026-06-23): la rama docente queda diferida a US-063 (no hay entidad Teacher); el contrato del endpoint ya viene discriminado por `type` para injertarla aditivamente.

Más **US-T07-b** (DONE 2026-06-23): architecture tests extendidos a los 5 módulos (8 reglas × 5 = 40 tests, parametrizadas con `[Theory]` en `ModuleBoundariesTests.cs`). Hallazgo: los 5 módulos ya respetaban todos los boundaries, sin violaciones. La red de seguridad queda enforced en CI.

### Decisión de scope (anula el plan de dos frentes del cierre de S5, con razón explícita)

Al cerrar S5 el plan era doble: corpus consumible + cola de moderación. El audit de arranque lo anuló:

- **US-063 (Teacher) es el keystone del vertical docente**: hoy toda reseña apunta a `PLACEHOLDER_TEACHER_ID`, no existe entidad Teacher. Gatea todo lo docente, que converge en S7: US-003 (docente con reseñas), US-040 (responder reseña), la rama docente de US-004 (búsqueda), docente real por reseña y los badges. Por eso el roadmap (redefinido 2026-06-23) abre S7 con US-063 como sprint dedicado y el resto se injerta. S8 = moderación.
- **El lado materia ya llena el sprint**: US-089 + US-002 + US-004.
- **La cola de moderación entera va a S8** (US-050 + US-051 + persona moderador + auth staff): es cabo de US-019 pero no urgente sin usuarios reales generando cuarentenas. Si el jurado UNSTA necesita el demo de moderación como hito institucional, sube de prioridad y se recorta el lado materia.
- **US-001 (catálogo completo)** también diferida a S7.

### Salida del audit + triage (2026-06-09)

| Item de deuda | Resolución |
|---|---|
| Mapping lossy del editor | → US-089 (enabler de S6) |
| Architecture tests parciales | → US-T07-b (S6) |
| Fetchers client-side en SSR | → guarda `clientApiFetch` (#147, mergeado) |
| Badge "editada tras respuesta docente" | → US-040 (responder reseña) |
| Conteos reales del modal de borrar | → votes + US-040 |
| ADR del patrón cross-module de auto-quarantine | Pendiente de escribir |

**Housekeeping restante del audit (pre-sprint)**: dedup de `formatRelativeDate`, identifiers castellanos en `commissions.ts`, `OccurredAt` con doble reloj en `CareerPlanImported`, `write.spec` a component test.

**Docs**: US-089 y US-T07-b ya tienen doc en `docs/plan/stories/` (ambos Done).

---

## S7 ✓ Done

**Rango**: 2026-06-23 a 2026-07-05 (lunes → sábado, extendido: el núcleo docente cerró la primera semana, el backoffice admin de docentes entró en la extensión, patrón de S5).

**Foco**: **el vertical docente entero, con US-063 (Teacher) como keystone.** Hasta S6 toda reseña apuntaba a `PLACEHOLDER_TEACHER_ID` y no existía la entidad Teacher; S7 la aterrizó y cerró todo lo que la necesitaba, tal como el audit de arranque de S6 lo había secuenciado.

### User stories cerradas

| US | Título | PR |
|---|---|---|
| US-063 | Catálogo de docentes consumible + admin CRUD gateado + backoffice + admin shell | #163, #180, #181 |
| US-065 | Comisiones + asignación de docentes; docente real por reseña (saca el placeholder). **Parcial**: entregado el aggregate + seed + lectura; el CRUD de backoffice y su UI quedan pendientes | #164, #167 |
| US-003 | Página pública de docente con reseñas (reads backend + frontend) | #165, #166 |
| US-030 | Claim de identidad docente | #169 |
| US-031 | Verificación docente por email institucional | #170 |
| US-040 | Responder reseña como docente verificado | #172 |
| US-041 | Editar respuesta docente | #179 |
| US-004 | Rama docente en la búsqueda global (completa la materia-only de S6) | #168 |
| US-067 | Provisioning de cuentas staff. **Parcial**: entregado `User.RegisterStaff` + seed desde `personas.json`; el endpoint, `must_change_password` y la UI quedan pendientes | S7 |

Extras: elegir comisión al cargar la cursada (#173), fixes de histograma de calificaciones y de topbar en viewports angostos.

---

## S8 ✓ Done

**Rango**: 2026-07-07 a 2026-07-11.

**Foco**: **moderación (cabo de US-019) + hardening de proceso e infra.** El requerimiento de reseñas generaba cuarentenas desde S5 pero no había forma de resolverlas; S8 cerró la cola de moderación. En paralelo entró un bloque grande de hardening de proceso, disparado por un merge que se coló con CI en rojo.

### User stories cerradas

| US | Título | PR |
|---|---|---|
| US-050 | Cola de reportes gateada a moderador (read model + vista con tone classifier) | #184 |
| US-051 | Resolver reporte (uphold/dismiss + detalle + cascade a reports de la misma reseña) | #184 |

### Hardening de proceso e infra (no son US)

- **Ruleset de `main` por plataforma**: required checks (Backend, Frontend, E2E, commit-msg, PR-title), PRs-only y no-force-push enforced por GitHub, no solo por disciplina. Motivación: un merge entró con E2E en rojo por un bug de proceso. Detalle en [`operations/git-workflow.md`](../engineering/git-workflow.md).
- **Bot del changelog migrado al App token** (`planb-ci-bot`) + marker skip-ci, para sobrevivir el ruleset sin re-disparar CI sobre commits docs-only (ADR-0043 re-evaluado, #189).
- **Fix del race de `router.refresh()`** en el resolve de moderación que dejaba la URL en el detalle (#187).
- **Higiene de docs y config del repo**: auditoría de los tres CLAUDE.md, corrección de claims no verificados, y separación de lo personal/config vs lo del proyecto.

---

## S9 ✓ Done

**Rango**: 2026-07-14 a 2026-07-19 (lunes → sábado; US-062 cerró el 2026-07-20, un día después del rango).

**Foco**: **gestión del catálogo académico desde el admin.** Hasta ahora el catálogo (universidades, carreras, planes, materias) se seedea o importa; S9 aterriza el CRUD administrativo para gestionarlo, más el lado explorar del alumno.

### Scope

| US | Título | Pri | Effort | Estado |
|---|---|---|---|---|
| US-060 | Gestionar University | High | M | ✓ Done |
| US-061 | Gestionar Career + CareerPlan | High | M | ✓ Done |
| US-062 | Gestionar Subject + Prerequisite (editor + correlativas con validación DAG) | High | L | ✓ Done |
| US-064 | Gestionar AcademicTerm | Med | S | ✓ Done |
| US-001 | Explorar catálogo de universidades y carreras (lado alumno) | High | M | ✓ Done |
| US-054-f | Landing pública en `/` (reemplaza el redirect a `/home`) | Med | M | ✓ Done |
| US-059-f | Rediseño auth + onboarding (AuthShell/OnbShell) + generalización de copy UNSTA→multi-universidad | High | M | ✓ Done |

Diferido a S10: importadores (US-007 CSV, US-006 merge de duplicados), wizard de alta de universidad (US-091), gestión de comisión por cuatri (US-090).

### Añadido durante el sprint (2026-07-15)

Revisando US-060 en el browser saltaron dos gaps que entran al sprint:

- **US-054-f** (landing pública): hoy `app/(public)/page.tsx` hace `redirect('/home')` incondicional, así que un visitante deslogueado cae directo en `/sign-in` sin ver landing. US-054-f reemplaza ese redirect por la landing real.
- **US-059-f** absorbe la **generalización de copy UNSTA→multi-universidad**: el hero de auth (`auth-hero-data.ts`) dice "alumnos de UNSTA" con stats viejos ("3 universidades" y el catálogo tiene 4), el badge dice "docente UNSTA" y el chrome del alumno hardcodea "UNSTA · Carrera" (deuda US-012). El data model ya es multi-uni (US-060); el copy quedó atrás y se generaliza entero (el mock es UNSTA-first, pero el producto es multi-universidad; hasta el disclaimer legal se vuelve genérico).

### Bloque de calidad previo (entre S8 y S9, Done)

- **US-T08**: backfill de cobertura de lógica de valor y dominio puro. 228 tests (152 backend unit + 76 frontend vitest) sobre gaps que dejó un audit; los caminos de error ya estaban cubiertos por integration, faltaba el nivel unit (parsers, máquinas de estado, confirm loop, PII, schemas/actions). Dos gaps diferidos (filtro SQL de la cola de moderación, timeout de 60s de los workers).
- **NSubstitute 6.0**: migración del mocking lib de los handler unit tests (major), con fix de los matchers nullable.
- **Dependabot**: limpieza del backlog (StackExchange.Redis 3.0, @types/node, actions/cache, backend-minor-patch, react-doctor).

---

## S10 ✓ Done

**Rango**: 2026-07-21 a 2026-07-26 (lunes → sábado).

**Foco**: **el simulador de cuatrimestre**. Es la mitad del producto que todavía no existe: `features/plan/` es un shell visual alimentado por `data/mocks.ts` desde S4 (US-046), y el módulo `Planning` ni siquiera está creado.

La razón de que vaya ahora es que **todo lo construido en los sprints anteriores es insumo suyo y hoy está desconectado**: las correlativas de US-062 (S9) no tienen ningún consumidor real, el historial que el alumno carga con esfuerzo (US-013/US-014, S3) solo se muestra en una lista, y el rating por materia (US-089 + US-002, S6) se lee de a una. El simulador es lo que convierte esas piezas sueltas en la decisión que el alumno necesita tomar: qué cursa el cuatrimestre que viene.

También desbloquea la Fase 6 del cronograma (focus group), cuya sesión guiada incluye "simular un cuatrimestre real".

### Scope

| US | Título | Pri | Effort | Estado |
|---|---|---|---|---|
| US-016 | Simular inscripción (disponibles/bloqueadas + métricas de la combinación) | High | L | ✓ Done |
| US-009-f | Páginas de error globales (404 + 5xx) | Med | S | ✓ Done |
| US-039-f | Estado offline (banner global + acciones en pausa) | Med | S | ✓ Done (core) |

### Decisiones de scope tomadas al planificar (2026-07-20)

- **US-016 no necesita todavía el BC `Planning`**: su propio AC dice "no persiste nada: solo computación de read models" ([ADR-0029](../decisions/0029-planning-as-a-separate-bounded-context.md)). El aggregate `SimulationDraft` recién hace falta para guardar simulaciones (US-023), que [ADR-0028](../decisions/0028-optional-reviews-with-premium-features-as-reward.md) define como premium. S10 es read models Dapper cross-schema, un domain service de cumplimiento de correlativas, y conectar el shell que ya existe.
- **El histograma de combinaciones similares entra completo**, con un riesgo asumido explícito: el AC lo define como exact match del subject set agrupando alumnos que cursaron la misma combinación, y con el corpus actual cada combinación va a tener muestras de 0 o 1 alumnos. Es una limitación de **volumen de datos, no de implementación**: el panel se va a ver vacío hasta que haya corpus real. Si se lo necesita poblado para una demo, sembrar enrollments realistas es trabajo aparte, a decidir por separado.
- **Las premium de planificación quedan fuera**: US-023 (guardar draft), US-024 (compartir), US-025 (editar), US-026 (borrar), US-027 (ver públicas). Entran cuando el simulador base esté validado con usuarios reales, no antes.
- **El backoffice restante se difiere a S11**: US-065 y US-067 quedaron **parciales** en S7 y US-081 nunca aterrizó su dashboard (los tres detectados en la auditoría de docs del 2026-07-20). Es valor para el operador, no para el alumno, así que va después del simulador.
- **Descubrimiento (US-056 Meilisearch + US-057 rankings) se difiere a S12**: gana valor cuando ya haya corpus y catálogo completos, y US-056 además suma infraestructura nueva.

### Cierre (2026-07-26)

Las tres US entraron:

- **US-016** hecho: módulo `Planning` con el endpoint de evaluación de la combinación (materias disponibles/bloqueadas por correlativas + carga semanal + dificultad ponderada por reseñas + pass-rate de la cohorte con el piso anti-reidentificación de [ADR-0047](../decisions/0047-public-pass-rate-from-private-enrollment-history.md)) y el panel de métricas del `/plan` cableado a datos reales. Lo que queda mock en `/plan` es "En curso"/"Borradores", que es US-023 (premium, fuera de scope).
- **US-009-f** hecho: las superficies de error (404, 500, 403, loading, offline) con su diseño; el CTA de la 404 y la página offline apuntan a la landing pública.
- **US-039-f** hecho en su core: hook `useOnlineStatus`, `OfflineBanner` global en el shell `(member)` con reintento y la transición "Conexión restablecida", más tests unit/component y el E2E con `context.setOffline`. **Deuda incremental**: el barrido de `disabled` por botón de mutación en cada feature (el hook queda listo para engancharlo) y la nota del patrón offline en `docs/engineering/testing.md`.

### Extra del sprint: vidrieras del producto + vocabulario de datos

Un bloque que salió revisando la landing y el auth:

- **Correlativas públicas del plan**: endpoint anónimo `GET /api/academic/prerequisites` para el grafo de correlativas sin login.
- **Vocabulario de datos** asentado en el glosario ([ubiquitous-language.md](../product/language.md), sección "Producto, landing y datos"): **datos de prueba** (el seed de contenido de la DB, `SeedCorpus`) vs **datos demo** (los ejemplos hardcodeados de las vidrieras).
- **Vidrieras de las tres herramientas**: los demos de la landing (reseña, mapa de carrera responsive, simulador) y el panel de bienvenida del sign-in (`HowItWorksPanel`), con datos de ejemplo.
- **Copy del producto**: el registro acepta cualquier email, el hero y el about muestran propuestas de valor, el badge de auth es "institucional".

## S11 ✓ Done

**Rango**: 2026-07-23 a 2026-07-26 (cerrado antes de lo previsto).

**Foco**: **terminar el planificador**. S10 entregó el núcleo (US-016: evaluar combinaciones contra correlativas, historial y cohortes); este sprint cierra todo lo que la herramienta promete y todavía no cumple: la oferta real de comisiones con horarios, los choques y el comparador reales, los borradores que sobreviven al refresh con su promote a plan activo, y la capa social de simulaciones. Regla del sprint: **la landing no promete nada que la herramienta no haga**.

### Scope

| US | Qué | Effort |
|---|---|---|
| [US-093](../history/domain-v1/stories/US-093.md) | CRUD de comisiones con docentes y horarios de cursada (absorbe el pendiente de US-065) | L |
| [US-096](../history/domain-v1/stories/US-096.md) | Elegir comisión y ver choques en el planificador | M |
| [US-023](../history/domain-v1/stories/US-023.md) | Borradores persistidos + promote (absorbe US-025/US-026) | M |
| [US-024](../history/domain-v1/stories/US-024.md) | Compartir simulación al corpus (anonimizada) | S |
| [US-027](../history/domain-v1/stories/US-027.md) | Feed de simulaciones públicas | S |

**Orden**: US-093 antes que US-096 (los choques necesitan oferta con horarios cargada); US-023 corre en paralelo desde el arranque; US-024 y US-027 al final, sobre US-023.

### Notas de planificación

- **US-093 arranca con el diseño del modelo de horarios**: `Commission` hoy no tiene schedule; el diseño (bloques día + rango por comisión) se presenta antes de implementar.
- **El período del draft nace multi-cadencia** (US-023): `AcademicTerm` real, no el enum `'1c' | '2c'` del mock de US-046. Vocabulario en el glosario (sección Planificador).
- **Fusiones de planificación**: US-065 (pendiente) → US-093; US-025 y US-026 → US-023. Los archivos de las fusionadas quedan como registro con banner.
- **Corrección de numeración** respecto de la tabla vieja: la comisión por término es US-093 (no US-090) y el wizard de universidad es US-094 (no US-091); US-090-f y US-091 son otras historias (ADR-0048).

### Cierre (2026-07-26)

Las cinco US entregadas. El planificador dejó de tener datos inventados: `features/plan/data/mocks.ts` se borró completo, y con él el aviso de "borrador vencido" y el checklist de publicación que mostraba "correlativas cumplidas" sin chequear nada.

| US | Qué quedó andando |
|---|---|
| US-093 | Horarios de cursada en `Commission` (child entity con no-solape), CRUD admin completo, y la pantalla "Comisiones · período" del backoffice (el item del menú dejó de estar inerte) |
| US-096 | Oferta con horarios en el catálogo del simulador, comisión elegible por materia, calendario semanal real y choques detectados en el dominio de Planning |
| US-023 | `SimulationDraft` persistido (estrena el lado de escritura del BC: DbContext, schema, repo, UoW), CRUD + publicar (archiva el activo anterior del período en la misma transacción) |
| US-024 | Compartir/descompartir un borrador, con `visibility` y `shared_at` moviéndose siempre juntos |
| US-027 | Feed "Comunidad" del mismo plan y período, anonimizado, paginado por cursor |

**Verificación**: 1021 tests de backend (unit de los 7 módulos + 393 de integración contra Postgres real + 48 de architecture), 842 de frontend, 55 E2E, y recorrido en browser de los dos flujos nuevos (backoffice de comisiones y planificador con choques, borradores y comunidad).

**Lo que encontró la verificación**:

- **El E2E destapó un callejón sin salida** que ningún unit test podía ver: con cero borradores el planificador cortaba sin header ni pestañas, y el CTA para crear el primero volvía a la misma pantalla. Los mocks anteriores nunca pasaban por el estado vacío. Arreglado quitando el empty state global: cada pestaña resuelve su propio vacío.
- **Un review adversarial encontró un bug de atomicidad** en el update de comisiones: Wolverine commitea aunque el handler devuelva `Result` de falla, así que un PUT que fallaba tarde dejaba la comisión renombrada y sin docentes. Resuelto con `Commission.Reconfigure`, que valida los tres sets antes de mutar.
- **Un bug de EF Core**: una key compuesta con `Guid` plano se marca `ValueGeneratedOnAdd` por convención y generaba un UPDATE fantasma al agregar items a un aggregate trackeado.

### Deuda y hallazgos para la revisión de modelos de datos

Al cerrar el sprint quedó acordada una **revisión aggregate por aggregate** de modelos de datos y motores. Lo detectado hasta acá, para no perderlo:

- **La forma de los ítems del borrador quedó abierta**: hoy es tabla hija (`simulation_draft_items`), pero el data-model había definido un array desnormalizado, y el borrador se lee y se escribe entero (un documento embebido también encaja). Marcado como abierto en [`architecture/data-model.md`](../engineering/data-model.md).
- **Los CHECK de `visibility`/`shared_at` que el data-model documenta no existen en la DB**: el invariante lo sostiene solo el aggregate. La revisión decide dónde va.
- **El `label` persistido de `AcademicTerm` usa la notación codificada** ("2026·1c") que la UI tiene prohibida por ADR-0051, y se filtró a pantalla en el selector de período.
- **El seed carga comisiones que violan la coherencia materia/período** (una materia anual colgada de un término cuatrimestral): pasa porque el seeder entra por `Hydrate`, que saltea las validaciones del dominio.
- **La oferta sembrada vive en 2026·1c**, que ya terminó, así que el período "que viene" arranca sin oferta. Es dato de prueba, no código.
- **US-093 diferido**: rechazar el cambio de modalidad cuando la comisión ya tiene inscriptos (necesita un read cross-BC a Enrollments). `TODO` marcado en el handler.
- **US-023 diferido**: los borradores `Archived` y los `Active` de otros períodos no se muestran en ninguna pantalla todavía.
- Del mockup de comisiones quedaron afuera, a propósito: aula, ocupación (`42/50`, no hay inscripciones a comisiones futuras en el modelo), "Importar oferta" (es US-007) y "Cuatri anterior".

## S12 ■ Cerrado por viraje de tesis

**Rango**: 2026-07-31 a 2026-08-16.

### Cierre (2026-08-16): el producto cambió de tesis

El sprint quedó contradicho en su eje, no en su ejecución. La tesis nueva ([THESIS.md](../THESIS.md),
registrada en [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md)) retira el
planificador, y las tres US que quedaban vivas eran hijas de su lazo:

- **US-015 quedó hecha y mergeada** antes del viraje (el PATCH de la cursada, el evento de
  cuarentena, el form de edición). Es historia del producto anterior, y su verificación además
  dejó dos arreglos transversales que sobreviven al viraje (la navegación post-mutación de
  ADR-0046 y el spec repetible).
- **US-097 (el momento del cierre de cursada) se cancela**: existía para fabricar el momento de
  extracción de datos del planificador. La tesis lo dice sin vueltas: nadie llega con ganas de
  inventariar su cuatrimestre.
- **US-098 (valoración por comisión en el picker) se cancela**: el picker donde iba a mostrarse
  se retira con el planificador. La doctrina de su ADR (gate por cobertura, ADR-0061) queda
  heredada al diseño nuevo.
- **US-099 (reseña simple al importar historial) se cancela como US, y es la única que muere con
  honores**: su intuición ("una sola pregunta, confirmar es más barato que elegir") es la
  decisión 4 de la tesis en miniatura. Sobrevive la idea, no la superficie.

El trabajo siguiente se planifica contra la tesis, no contra este backlog. Lo que sigue abajo es
el registro histórico del sprint tal como se planificó y avanzó.

### La poda de la versión anterior (registrada, sin sprint asignado)

Lo que [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md) declara en retiro y hay
que remover del código. Es trabajo consciente, no daño colateral de otra tarea, y entra cuando la
planificación contra la tesis le asigne lugar:

- El módulo `planning` (SimulationDraft, evaluación de combinaciones) con su schema, sus tests y
  el wiring en el host.
- La superficie `/plan` del frontend: pestañas En curso/Borradores/Comunidad, el drawer de
  materias, publicar y compartir planes, y las features que solo existen para eso.
- El import de planes de estudio propuesto por alumnos (feature `import-career-plan` y su cola de
  aprobación) como mecanismo de escritura del catálogo. El backoffice queda como único escritor.
- El onboarding de "cargá todo tu historial" como puerta de entrada.
- La reseña texto-libre con puntajes y su maquinaria, **recién cuando el sistema de frases tenga
  diseño y reemplazo**: remover el testimonio viejo sin el nuevo deja al producto sin acto de
  contribución.

Nada de esto se borra de pasada: cada pieza sale con su PR, sus tests actualizados y sus docs
espejo al día.

---

**Foco original del sprint** (histórico): **cerrar el lazo que produce el corpus**. S10 y S11 dejaron el planificador entero: evalúa combinaciones, muestra choques, guarda borradores y los comparte. Lo que no tiene es de dónde sacar la señal que lo hace distinto de la plataforma de la facultad. Hoy, en la pantalla donde el alumno elige comisión, `AvailableCommissionItem` le muestra nombre, modalidad, cupo, docentes y horarios: todo lo que la universidad ya publica, y ninguna reseña.

La causa está antes: el módulo Enrollments tiene cuatro features y ninguna modifica un record existente, así que **no existe el momento en que el alumno cuenta cómo le fue**. Una cursada nace con su estado definitivo y se queda así para siempre. Sin ese momento no hay pares (materia, comisión) con verdicto, y sin esos pares no hay nada que mostrar donde se decide.

### Scope

| US | Qué entrega |
|---|---|
| [US-015](../history/domain-v1/stories/US-015.md) | El `PATCH` de una cursada propia, con revalidación de invariantes y el evento que manda a `under_review` la reseña afectada (ADR-0032). Enabler del resto. |
| [US-097](../history/domain-v1/stories/US-097.md) | El momento del cierre: qué cursadas están pendientes, qué se le pregunta al alumno (incluido el método de aprobación) y el handoff a la reseña. |
| [US-098](../history/domain-v1/stories/US-098.md) | El agregado por (materia, comisión) y su lectura en el picker, con la vigencia del plantel medida contra `reviewed_teacher_name`. |
| [US-099](../history/domain-v1/stories/US-099.md) | La reseña simple, una sola pregunta y sin docente, ofrecida al confirmar el import de historial. Siembra corpus el día uno en vez de esperar un cuatrimestre. |

### Decisiones de producto que definen el sprint

- **La unidad de decisión es (materia, comisión), no (materia, docente).** El alumno se inscribe en una comisión; el docente es lo que esa comisión tiene este cuatrimestre. El riesgo de que el agregado envejezca cuando el docente cambia se mide, no se esconde: cada reseña guarda siempre el nombre del docente que nombró (ADR-0060), así que las reseñas reconstruyen el plantel histórico que el catálogo no tiene.
- **La app planifica, no lleva el historial.** El registro académico oficial vive en la plataforma de la universidad. Lo que ella no da, y esto sí, es la complejidad de una materia, la carga resultante de juntar varias, y las valoraciones.
- **El método de aprobación se pregunta en el cierre, nunca en la carga retroactiva.** En el cierre el alumno se acuerda; tres años después inventaría.
- **La reseña de carga tardía no nombra docente, y es decisión.** De una materia vieja se recuerda cuánto costó, no cuál de los tres docentes tocó. Eso además deja sin entradas la cola de resolución de referencias del punto 4 de ADR-0060, que por ahora no hace falta construir.

### Avance

- **US-015 hecha** (2026-08-01). El `PATCH` con revalidación de invariantes, la detección de la
  edición destructiva y el evento que pone la reseña en cuarentena por `EnrollmentChanged`, más el
  barrido de reconciliación que la recupera si el consumer agota los reintentos. Del lado del
  alumno, cada fila del historial se puede corregir, con confirmación explícita cuando el cambio
  manda a revisión una reseña publicada.
- El `AC` original marcaba la reseña con `needs_revalidation` cuando el evento fallara, y se
  reemplazó porque era circular: si el evento no llega, Reviews no se entera, y Reviews es quien
  tendría que poner la marca. Una reseña publicada cuya cursada está en curso ya es contradictoria
  por sí sola, así que el barrido la encuentra sin depender de que alguien la haya marcado.
- **Al verificarla apareció un defecto más viejo y más ancho**: guardar un formulario dejaba al
  alumno en la misma pantalla, con el cambio ya persistido, 1 de cada 2 veces contra un build de
  producción. No era del alta sino de la navegación posterior, y le pegaba a los once sitios que
  todavía redirigían adentro del server action. Todos migrados; la revisión de
  [ADR-0046](../decisions/0046-server-actions-as-pure-mutations.md) tiene la medición.

### Diferido a propósito

- **Ponderar reseñas por completitud.** Mientras no existan las dos formas en cantidad, ponderado y plano dan idéntico y los coeficientes se elegirían a ciegas.
- **Puntaje de carrera y de universidad.** Decidido que se calculan desde estos agregados, gateados por **cobertura** y no por muestra: si solo 3 de 40 materias del plan tienen puntaje, el de la carrera viaja `null` (ADR-0054), porque el número diría más sobre cuáles materias se reseñaron que sobre la carrera.
- **Serie temporal por período de la cursada.** Habilita ver cómo evoluciona una materia, y reemplaza la idea de decaer reseñas viejas por antigüedad. Va por período de la cursada, no por fecha de la reseña: si no, la carga masiva apila diez años de historia en el mes en que la gente se registró.

## Lo que viene

El backlog pre-viraje se retiró el 2026-08-20: describía el producto anterior y el propio doc ya lo daba por caduco. **El backlog hoy son las 100 stories** de [`docs/product/`](../product/README.md), sin sprint asignado y sin estado: la planificación empieza eligiendo de ahí.

Ninguna está planificada todavía. Cuando la primera entre a un sprint, su sección se escribe acá con el formato de [`story-template.md`](story-template.md): el ID y el link a la story, su contrato técnico, sus tareas y su estado.

Además del producto, hay trabajo técnico pendiente que no tiene story porque no describe nada que el usuario haga:

- **La poda de la versión anterior**: el módulo `planning`, `/plan` en el frontend y lo que cuelga de ellos siguen en el código ([ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md)).
- **Los tokens del boletín en `globals.css`**: hoy sigue la paleta Apricot sirviendo al chasis en retiro ([ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md)).

## Cómo seguir el avance

- **Este doc** se actualiza al cerrar cada sprint o al iniciar uno nuevo.
- **El tracker es este repo** desde el 2026-08-18: este doc para los sprints, el foco y el estado de cada story planificada. Notion (`plan-b: Tasks`, `plan-b: Epics`) se dejó de usar ese día: no se sincroniza más y lo que quedó ahí es historia.
- **GitHub** (`https://github.com/lucasidev/plan-b`): commits, PRs, CI status.

Para decisiones de diseño: [`docs/decisions/`](../decisions/README.md). Para el lenguaje del negocio: [`product/language.md`](../product/language.md). Para "qué hace el sistema": las épicas y sus stories en [`docs/product/`](../product/README.md), y la [tesis](../THESIS.md) que las gobierna. Lo de la versión anterior está en [`history/`](../history).

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
- TeacherProfile aggregate con flow de claim (UC-030 a UC-032, UC-069, UC-040, UC-041).
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
