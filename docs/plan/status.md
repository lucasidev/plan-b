# Estado del proyecto (planb)

Tracking operativo del avance por sprints. La cadencia real del proyecto es **sprint**, no fase. Las fases del cronograma original del PFI quedan como anexo al final del doc para referencia académica del Ing. Copas.

**Cadencia**: S1 y S2 fueron de 7 días con cierre flotante (sábado-sábado). **Desde S3 la cadencia se fija a lunes → sábado (6 días útiles)**. Lo hecho hecho está: los rangos de S1/S2 no se reescriben retroactivamente.

**Última actualización**: 2026-09-08 (R5 cerrado y R6 planificado: elegir dónde estudiar con datos reales; desde acá la única ficción son los alumnos). Antes, el 2026-09-07 (R4 cerrado y R5 planificado: lo construido contra lo deseado, medido sobre el stage rellenado, con cuatro recorridos de persona como E2E y el relevamiento de los datos oficiales que el producto pide). Antes, el 2026-09-02 (R3 cerrado y R4 planificado: un stage con datos de prueba, todos los hallazgos de la auditoría de tests de R1 a R3, y la suite y CI más rápidos). Antes, el 2026-08-21 (arranca el rework: R0 planificado sobre el inventario de los 880 archivos del backend y las 41 features del frontend. Todo lo que está debajo de "Lo anterior" es el producto en retiro. Antes, el 2026-08-16, el viraje de tesis:

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
| **R0** | 2026-08-23 a 2026-08-24 | **El rework arranca achicando**: se podan el planificador y lo que el viraje dejó sin dueño, se cierran los dos ADR en propuesto, y se arregla la fuga de enumeración que el inventario encontró. No construye nada del producto nuevo. | ✓ Hecho (mergeado el 2026-08-24, PR #354) |
| **R1** | 2026-08-24 a 2026-08-27 | **El acto de reseñar, de punta a punta**: una persona reseña una cursada en tres capas, y al cruzar el piso de 10 la ficha de la cátedra publica sus conteos. Milestone [R1](https://github.com/lucasidev/plan-b/milestone/2), issues #355 a #361, 34 pts. | ✓ Hecho (mergeado el 2026-08-27, PR [#362](https://github.com/lucasidev/plan-b/pull/362)) |
| **R2** | 2026-08-27 a 2026-08-28 | **El producto habla con una voz, y lo que dice se encuentra y se deshace**: la ficha de materia deriva de sus cátedras, se llega a la cátedra desde donde se la busca, se puede corregir y borrar lo aportado, la landing dice lo que el producto hace, y el aggregate de reseña anterior se poda con su moderación. Milestone [R2](https://github.com/lucasidev/plan-b/milestone/3), issues #363 a #368, 42 pts. | ✓ Hecho (mergeado el 2026-08-28, PR [#369](https://github.com/lucasidev/plan-b/pull/369)) |
| **R3** | 2026-08-29 a 2026-09-02 | **El catálogo crece y el número se puede auditar**: la cátedra se carga desde el backoffice (hoy existe solo por el seed), la ficha publica con qué se llevó cada materia, Método explica cómo se calcula todo lo que se publica, y se retira el seguimiento de carrera ([ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)). Milestone [R3](https://github.com/lucasidev/plan-b/milestone/4), issues #370 a #376, 47 pts. | ✓ Hecho (cerrado el 2026-09-02, PRs #387 a #399; entró además la curaduría entera y US-198) |
| **R4** | 2026-09-02 a 2026-09-07 | **Un stage funcional, y una suite que dice la verdad más rápido**: el producto entero en una URL de Dokploy con el corpus sintético; todos los hallazgos de la [auditoría de tests de R1 a R3](../history/reviews/2026-09-02-audit-tests-r1-r3.md) convertidos en tareas; y la integración, el E2E y CI acelerados con cambios medidos antes y después. Milestone [R4](https://github.com/lucasidev/plan-b/milestone/5), issues #400 a #423, 61 pts. | ✓ Hecho (cerrado el 2026-09-07 con el merge de la pista 4, PR #467; #403 y #404 pasan a R5) |
| **R5** | desde 2026-09-08 | **Lo construido contra lo deseado**: la distancia entre lo que la tesis y las 91 stories piden y lo que el stage hace, medida con un mapa por épica y por pantalla en tres estados, cuatro recorridos de persona como E2E contra el stage rellenado con corpus sintético, y el relevamiento de qué datos oficiales pide el producto, dónde están y en qué formato. Y el diagnóstico del click de envío que CI pierde una de cada tres corridas. La salida es el backlog priorizado de R6, no features. | ✓ Hecho (cerrado el 2026-09-08 con el merge de #480; #470 y #473 cierran con el plan de R6) |
| **R6** | 2026-09-09 a 2026-09-22 | **Elegir dónde estudiar, con datos reales**: el modelo de datos oficiales del ADR-0090, el catálogo real de Tucumán (instituciones, carreras y planes desde las fuentes; la única ficción, los alumnos), la ficha de carrera con sus datos y Dónde estudiarla, el buscador que encuentra carreras, la puerta y el contrato de Reseñar arreglados, el click que el router pierde, y las dos APIs de terceros que el producto consume (la AGN y Georef). 70 pts en cuatro pistas. | Planificado |

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

103 stories en 13 épicas, todas con sus escenarios ejecutables ([`docs/product/`](../product/README.md)), 34 pantallas con ficha y boceto (dos se retiraron con [ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) y la pantalla de docente entró el 2026-09-05; el índice está en [`product/README.md`](../product/README.md)), y un catálogo de 46 frases semilla (7 de exigencia y 39 de gestión: el desbalance está sin resolver). Eso es el producto ideado. Lo que sigue es cuánto de lo construido sirve.

## El inventario: qué hay hoy

Medido el 2026-08-21 sobre 880 archivos `.cs` en 6 módulos con 64 features, más 41 features de frontend.

| Módulo | Sobrevive | Adapta | Se poda | Lo que falta |
|---|---|---|---|---|
| `identity` (196 .cs, 21 feats) | 13 | 8 | 1 | las colas de verificación manual (docente, cargo institucional, constancia) |
| `academic` (333 .cs, 12 feats) | 5 | 5 | 2 | `CanonicalCareer` y `CanonicalSubject`, que son entidades nuevas y no un rename |
| `reviews` (127 .cs, 12 feats) | 6 | 6 | 3 | el catálogo de frases versionado, la respuesta por opción, el contexto de la cursada, el campo libre |
| `enrollments` (79 .cs, 5 feats) | 5 | 0 | 1 | nada: `EnrollmentRecord` es el ancla que la tesis sigue usando (ADR-0082) |
| `moderation` (44 .cs, 4 feats) | 2 | 2 | 0 | las tres colas de verificación y la auditoría del equipo |
| `planning` (101 .cs, 10 feats) | 0 | 0 | 10 | nada: se retira entero, salvo un rescate (ver R0) |

**El corazón de la tesis no existe.** El catálogo de frases, la respuesta por opción y el instrumento versionado dan **cero archivos** en el backend. Lo que reemplaza al puntaje no tiene una línea escrita.

> **Confianza del inventario.** Los veredictos por feature salen de una pasada de cinco agentes sobre el código, con `file:line`. Sirven como dirección, no como contrato. Los inventarios de `reviews`, `enrollments` y `academic` se **re-mapearon el 2026-08-23** contra los IDs vigentes (US-127 a US-230): el detalle queda abajo. El de `identity` ya citaba IDs vigentes. Tres de los seis módulos medidos ya no existen: `planning` se retiró en R0, `moderation` en R2 y `enrollments` en R3, así que sus filas y sus tablas de features quedan como la foto del 2026-08-21, no como el estado de hoy.

### El re-mapeo contra el catálogo vigente (issue #353)

Cada feature cita un ID vigente o declara que no mapea. "Se rehace" significa que la necesidad sobrevive pero la forma actual no; "se va" que contradice el producto nuevo.

**`reviews`**

| Feature | Veredicto |
|---|---|
| PublishReview | Se rehace para US-146/US-147: la unidad pasa a la reseña de tres capas ([ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)); el campo libre no se publica ([ADR-0084](../decisions/0084-free-text-feeds-curation-and-is-never-published.md)) |
| EditReview · DeleteOwnReview | US-165 (editar o borrar mi reseña) |
| RespondToReview | Se rehace para US-172, con el chequeo previo y el plazo de US-179 |
| EditTeacherResponse | Sin story vigente: editar la respuesta del reseñado se decide con Responder (US-176, el estado del canal) |
| GetMyPendingReviews | Se va: un checklist de cursadas pendientes contradice US-147 ("arranca eligiendo una, sin checklist") |
| GetMyReviews | US-165, vía Mis aportes (SC-018) |
| BrowseReviews | Se rehace: la lectura vive en las fichas (US-135, US-136), no en un browse global |
| CastReviewVote | Se rehace para US-188, con la voz de ADR-0082 (una por persona y cursada, no un contador de útil) |
| SubjectInsights · TeacherInsights | Se van: promedian dificultad y utilidad; los reemplaza la ficha de frases con voces (ADR-0083) |
| ReconcileEnrollmentChanges | Tarea técnica sin story; se revisa contra la clave cuenta × materia × período (US-163) |

**`enrollments`**

| Feature | Veredicto |
|---|---|
| RegisterEnrollment | US-154 (cómo terminó) y US-163 (la clave por período); el registro de cursada sigue siendo el ancla (ADR-0082) |
| UpdateEnrollment | US-165 |
| HistorialImports | Sin story vigente: reseñar ya no pide historial masivo; si sobrevive, es para trayectoria (US-152) y se decide ahí |
| GetMyTranscript | US-152, la lectura propia de trayectoria, vía Mi situación y Mis aportes |
| SubjectPassRate | US-152 ("por materia muestra dónde se cae"), sobre la base de ADR-0083 |

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

**Lo que R0 explícitamente NO hace**: nada del producto nuevo. Ni frases, ni conteos, ni respuesta del reseñado. Eso es R1 en adelante.

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

- [x] **Cerrar los dos ADR en propuesto** (2026-08-24: los dos en aceptado). [ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md) fija cómo se publica cada dato (la moda, la distribución, el denominador de cada frase y cuántas voces suma una persona); sin eso ningún dato publicado se recalcula dos veces igual. [ADR-0076](../decisions/0076-the-three-doors-answer-the-same-whether-the-account-exists-or-not.md) fija que las tres puertas responden igual exista o no la cuenta. Los dos son decisión de Lucas, y son la compuerta de todo lo demás: **R1 no puede empezar con parámetros en propuesto**.

- [x] **Rescatar el evaluador de disponibilidad a `academic`, antes de tocar `planning`.** Mueve `SubjectAvailabilityEvaluator`, su interfaz, `SubjectAvailability`, `SubjectProgress`, `PrerequisiteEdge` y `AvailabilityStatus` de `planning/Domain/Availability/` a `academic/Domain/Availability/`. Es lógica de dominio pura, sin I/O. **No es una decisión de este plan**: la story US-144 ya lo dejó escrito en su propio criterio de aceptación.

- [x] **Podar `planning` entero.** Sus 10 features, el aggregate `SimulationDraft` con sus hijos, los servicios de horarios (`ScheduleClash`, `ScheduleClashDetector`, `ScheduledBlock`), las dos migraciones EF del schema `planning`, el wiring de DI en `Program.cs` (líneas 17-18, 124-125, 139, 198-199), las referencias a `PlanningDbContext` en `DevMigrationsHostedService` y `MigrateDbCommand`, los tests de integración de `Planning/`, y el feature `plan` del frontend con sus llamadas a `/api/planning/*`.

- [x] **Arreglar la fuga de enumeración en el registro.** Verificado en el código: `RegisterUserCommandHandler.cs:37-40` devuelve `EmailAlreadyInUse` cuando el mail ya tiene cuenta, que es exactamente lo que ADR-0076 prohíbe. Es la primera pieza del producto nuevo que se toca, y se toca porque es una fuga, no porque sea una feature.

- [x] **Propagar ADR-0078, parte hecha (2026-08-24)**: el tema asignado a las 46 frases y las cuatro familias pobladas en sesión de curaduría (el catálogo quedó re-estructurado en una tabla con las tres coordenadas, 67 frases, sujetos = las fichas reales, y el balance-por-eje derogado); y la tesis, el glosario y el CLAUDE.md propagados. La tesis publicaba "por eje" con cabecera dual dos días después de decidir lo contrario: el documento raíz va primero en toda propagación futura.
- [x] **Cerrar las dos decisiones de medición que gateaban la ficha** (2026-08-24): muestra chica sin piso y series con rupturas declaradas. Rebasadas al día siguiente por el modelo vigente: el piso volvió con otra razón (privacidad del que reseña, [ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)) y las rupturas quedaron, por código de frase.
- [x] **El modelo se rehizo entero el 2026-08-25** ([ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](../decisions/0085-three-instruments-and-official-data.md)): catálogo de tres capas, ficha de conteos, texto libre sin publicar, tres instrumentos. Propagado ese día: tesis, glosario, catálogo ([phrases.md](../product/phrases.md)), design system, los 6 bocetos a sus pantallas, y 25 ADRs rebasados borrados con sus referencias corregidas. **Queda el barrido de stories y screens** (mapa completo relevado por agentes el 2026-08-25: épicas de réplica y moderación a transformar, 4 stories muertas, vocabulario viejo en ~40 archivos): es el primer trabajo de R1.

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

## R1 · El acto de reseñar, de punta a punta

**Desde el 2026-08-24; contratos rehechos el 2026-08-25 al modelo vigente** ([ADR-0082](../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](../decisions/0085-three-instruments-and-official-data.md)). El primer sprint de construcción: el ciclo completo del corazón del producto, con lo mínimo que lo sostiene. Milestone [R1 · El acto de reseñar](https://github.com/lucasidev/plan-b/milestone/2). Fuera de alcance, dicho al planificar: el instrumento administrativo y el relevamiento oficial (piden su propio sprint), la unidad académica más allá del campo en cátedra, la respuesta del reseñado, las notas de curaduría, los borradores retomables, y las capas 3 y 4 del análisis (Rasch, cruces con series oficiales).

| # | Issue | Pts | Depende de |
|---|---|---|---|
| 1 | [#355 · Propagar el modelo a la spec de Reseñar](https://github.com/lucasidev/plan-b/issues/355) | 3 | nada; incluye el barrido de stories y screens que los agentes mapearon el 2026-08-25 |
| 2 | [#356 · La cátedra como entidad en academic](https://github.com/lucasidev/plan-b/issues/356) | 5 | nada; el titular por período queda registrado para el corte "cambio de titular" |
| 3 | [#357 · El catálogo de frases versionado a la base](https://github.com/lucasidev/plan-b/issues/357) | 2 | 1; frases con código estable, opciones, instrumento con vigencias ([phrases.md](../product/phrases.md) es la fuente editorial) |
| 4 | [#358 · La reseña de tres capas](https://github.com/lucasidev/plan-b/issues/358) | 8 | 2, 3; respuestas por opción atadas a la versión del instrumento + contexto no publicado + campo libre no publicado + una voz por cuenta × materia × período |
| 5 | [#359 · La pantalla Reseñar](https://github.com/lucasidev/plan-b/issues/359) | 8 | 1, 4; el boceto vigente es el sketch de SC-015 |
| 6 | [#360 · La ficha mínima de cátedra](https://github.com/lucasidev/plan-b/issues/360) (redefinida el 2026-08-25: conteos con moda y distribución, fama por convergencia, tasa de finalización agregada, piso de 10) | 5 | 4 |
| 7 | [#361 · El E2E del ciclo completo](https://github.com/lucasidev/plan-b/issues/361) | 3 | 5, 6 |

### Lo hecho hasta ahora (2026-08-26)

El **dominio de las tres piezas de datos está escrito, compilando y con sus tests unitarios**:

- **La cátedra** (#356): `Chair` en `academic`, con su equipo docente versionado por período (`ChairMember` lleva desde y hasta). Ese tramo no es adorno: sin él, una ficha que publica reseñas de 2023 a 2026 le atribuiría al titular de hoy lo que se dictó hace tres años. Queda dicho en el código que la cátedra no es la comisión: la comisión muere con su período, la cátedra persiste y es la que la ficha compara. Infraestructura, migración y 27 tests de dominio, listos.
- **El catálogo del instrumento** (#357): `Item` con sus opciones y `Instrument` versionado, en `reviews`. Lo que hace cumplible al modelo es separar el **código** (identidad semántica, estable) del **texto** (se afina sin cortar la serie): cambiar el significado exige código nuevo. Los invariantes que protegen la ficha viven en el aggregate: a lo sumo una opción negativa por frase (el rojo marca una sola cosa), las frases de contexto no llevan valencia (no se publican dato por dato), y una opción ya respondida no se borra ni se reusa.
- **La reseña** (#358): `Review`, entidad **nueva**, no una mutación de la `Review` anterior: no es una versión de aquella sino otra cosa, y nacer aparte evita el período en que una misma clase sería mitad un modelo y mitad el otro (la vieja se poda como tarea propia, ADR-0063). Guarda las respuestas por opción atadas a la versión del instrumento, el contexto que no se publica y el campo libre que no se publica nunca. Saltear no deja fila: por eso lo salteado no cuenta en ningún denominador.

Además, de la cátedra ya está el read público que la pantalla Reseñar necesita (`GET /api/academic/subjects/{id}/chairs`, con el titular vigente de cada una) y el seed de tres cátedras de ejemplo.

**Verificado contra infraestructura real** (2026-08-26, no solo compilando): las dos migraciones aplican; el catálogo siembra sus 14 frases con sus opciones y valencias y publica el instrumento `STUDENT_COURSE` v1; las tres cátedras quedan con su titular; el endpoint responde con los datos correctos. **762 tests unitarios y 392 de integración en verde**, `dotnet format` limpio y `check-docs --strict` limpio.

Dos cosas que aparecieron al verificar y quedaron arregladas: los ids del seed de cátedras y de frases colisionaban (los dos usaban el prefijo `00000008`), y la causa era que [ADR-0058](../decisions/0058-deterministic-seed-in-code-gated-by-environment.md) decía "y así" en vez de listar los prefijos asignados; ahora lleva la tabla completa. La suite de integración, además, se cuelga cuando la máquina está saturada (varios procesos compilando en paralelo): no es un defecto del código, y correrla sola pasa entera.

**El acto de reseñar funciona de punta a punta** (2026-08-26, probado contra la base real, no solo compilando): `GET /api/reviews/instrument` devuelve el cuestionario vigente con sus frases y opciones en orden (sin la valencia: la recolección va sin alarma, teñir una opción mientras alguien responde es sugerirle la respuesta), y `POST /api/reviews/courses` publica una reseña que guarda solo lo respondido (las frases salteadas no dejan fila, así que no cuentan en ningún denominador). Verificadas sus reglas: 409 al reseñar dos veces la misma cursada, y 400 con su código propio para una opción inventada, una frase que el instrumento no ofrece, y una cátedra que no es de esa materia.

**El cálculo editorial de la ficha** (#360) está escrito como lógica pura, separada del SQL: entran conteos crudos y sale lo publicable (el piso de 10, la moda con su etiqueta literal, la distribución por opción, la convergencia que forma la fama, la tasa de finalización agregada y los contrastes contra las hermanas filtrados por intervalos de Wilson que no se tocan). Está separado a propósito: las reglas de publicación **son** el producto, y tienen que poder probarse con casos borde sin levantar una base.

**La pantalla Reseñar existe y funciona** (#359, 2026-08-26): `/reviews/new` en el frontend real, no un boceto. Trae las materias del plan del alumno, los períodos de su universidad, y las cátedras de la materia apenas la elige; contesta el cuestionario vigente agrupado por sus tres capas, con saltear como salida visible; y antes de enviar dice qué se publica y qué no. **Probada de punta a punta en el browser**: se eligió materia, período y cátedra, se respondieron cuatro frases, se envió, y la reseña quedó en la base con exactamente esas cuatro respuestas (las frases salteadas no dejaron fila). Ninguna opción se pinta de alarma mientras se responde, aunque el catálogo sepa cuál es la negativa: alarmar es lectura, no captura.

El contrato visual Boletín ([ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md)) aterrizó **scopeado** en `globals.css` (`[data-surface='bulletin']`) en vez de reemplazar los tokens globales: Apricot sigue vistiendo al chasis de la versión anterior, y pisarlo le habría cambiado la cara a esas pantallas sin que nadie lo decidiera. Cuando ese chasis se pode, los valores se promueven y el scope se borra.

**La ficha de cátedra publica** (#360, 2026-08-26): `GET /api/reviews/chairs/{id}/facts` y `/chairs/{id}` en el frontend, pública y sin cuenta, que es la mitad de la tesis (se recolecta con cuenta y se publica sin ella). El read cuenta y el dominio decide: la query Dapper devuelve conteos crudos por frase y opción, incluidas las opciones que nadie eligió (un cero es información), y el calculador resuelve qué de eso se publica. Verificado contra la base con un corpus real de 30 reseñas: la moda con su etiqueta literal, la distribución completa, la fama cuando cuatro frases convergen, la tasa de finalización agregada y el único contraste contra las hermanas que sobrevivió la regla de los intervalos. La ventana temporal se agregó al leer el boceto: un conteo sin decir de cuándo son sus voces no distingue a la cátedra de hoy de la de hace cinco años.

**El E2E del ciclo completo pasa** (#361, 2026-08-26): la cátedra arranca sin voces, junta nueve y dice "con 1 más se publica" sin adelantar un solo conteo, la décima se hace **por la pantalla real**, y recién ahí aparecen la moda y la distribución. El tramo de lectura corre **sin sesión**: si la ficha pidiera login, la presión que el producto existe para ejercer no llegaría a nadie.

**Lo que la ficha todavía no muestra**, y no es olvido: el bloque de la respuesta firmada de la cátedra (US-172, US-176 y US-177, de la épica Responder, fuera de R1); el contraste de la tasa de finalización contra las hermanas ("en González llegan 9 de cada 10"), que el calculador no computa; el "sin picos de carga" de la dispersión temporal; y los links a Método y a Bajar los datos, cuyas pantallas todavía no existen. Un link a una pantalla inexistente es peor que no ofrecerla.

**Sobre cómo se verifica la suite de integración**: son 410 tests y tardan ~29 minutos, así que **no entran en una sola corrida**. Se corre por área (`--filter "FullyQualifiedName~Planb.IntegrationTests.<Area>"`): Reviews 90, Academic 150, Identity 105, Enrollments 41, Moderation 24. Esto no es una preferencia: una corrida cortada por timeout reporta lo parcial como **verde** ("Superado: 116, Con error: 0" sobre 410) sin ninguna señal de que faltó el 70%. Todo "Superado: N" se compara contra los `[Fact]` declarados antes de darlo por bueno.

### Cómo se sabe que R1 está listo

1. El E2E del ciclo pasa en CI: registro, reseñar una cursada respondiendo frases de las tres capas, y la ficha de la cátedra muestra sus conteos (moda y distribución) recién al cruzar el piso de 10 reseñas. **Cumplido local** (`e2e/reviews/chair-facts.spec.ts`, 55 E2E en verde); **en CI todavía no**, porque el trabajo no está pusheado.
2. El criterio de US-146 medido: el acto entero en menos de dos minutos de flujo real. **Sin medir con personas**: lo único verificado es que la máquina no es el cuello (el E2E hace el acto entero, con login, en 15 segundos) y que el flujo son cinco pasos y catorce preguntas de opción, sin escritura obligatoria. Medirlo de verdad pide gente cursando, no un spec.
3. Los conteos publicados se recalculan a mano contra ADR-0083 y dan igual, incluida la tasa de finalización agregada. **Cumplido**: los porcentajes esperados están calculados a mano en `GetChairFactsEndpointTests` (moda 80 % sobre 10 respuestas, finalización 7 de 10, cuatro frases convergiendo) y el test falla si el código deja de darlos.
4. Nada publicado expone quién reseñó ni cómo terminó nadie (US-148), verificado en los reads. **Cumplido**: `The_payload_never_carries_who_reviewed_or_how_anyone_finished` mira el JSON crudo y exige que no viajen cuentas, ids de reseña, texto libre ni ninguna frase de la capa de contexto.

---

---

## R2 · El producto habla con una voz

Desde el 2026-08-27. Milestone [R2](https://github.com/lucasidev/plan-b/milestone/3), 42 pts.

**Por qué este hilo.** R1 dejó el producto con dos caras contradictorias vivas, y la vieja es la única que se ve: `/chairs/{id}` no tiene un solo link entrante (la ficha se alcanza tipeando un UUID), la ficha de materia publica promedios y testimonios, la landing vende el planificador retirado, y lo que R1 escribe no se puede corregir ni borrar. R2 cierra el ciclo de vida del dato nuevo y mata al anterior.

| # | Issue | Pts | Depende de |
|---|---|---|---|
| 1 | [#363 · La ficha de materia deriva de sus cátedras](https://github.com/lucasidev/plan-b/issues/363) | 8 | nada |
| 2 | [#364 · Se llega a la cátedra desde donde se la busca](https://github.com/lucasidev/plan-b/issues/364) | 5 | 1 |
| 3 | [#365 · Editar y borrar lo que conté](https://github.com/lucasidev/plan-b/issues/365) | 8 | nada |
| 4 | [#366 · La landing dice lo que el producto hace](https://github.com/lucasidev/plan-b/issues/366) | 5 | 1 |
| 5 | [#367 · Se poda el aggregate de reseña anterior y su moderación](https://github.com/lucasidev/plan-b/issues/367) | 13 | 1, 3, 4 |
| 6 | [#368 · El E2E del camino a la ficha y del deshacer](https://github.com/lucasidev/plan-b/issues/368) | 3 | todos |

**La poda entra entera, no apagada.** Se retiran `Review`, `ReviewVote` y `TeacherResponse` con sus tablas, sus doce features y el módulo `moderation` completo, que modera contenido público que el modelo nuevo no produce ([ADR-0084](../decisions/0084-free-text-feeds-curation-and-is-never-published.md)). Son ~113 archivos `.cs` y 8 features de frontend. La razón de hacerlo ahora y no después: estamos pre-deploy y no existe una sola reseña v1 de una persona real, así que el argumento de preservar el corpus que sostenía a ese aggregate todavía no aplica, y cada sprint que pasa aplica más.

**Sucesor previsto**: con el aggregate anterior muerto, `Review` puede reclamar el nombre `Review`. Ese renaming es tarea propia y no entra en R2.

### Lo hecho hasta ahora (2026-08-27)

**La ficha de materia deriva de sus cátedras** (#363): `GET /api/reviews/subjects/{id}/facts` y `/subjects/{id}` reemplazado entero. La materia no promedia a sus cátedras: las muestra por separado, porque la pregunta que contesta es si lo que pasó es de la materia o de la cátedra que te tocó. Publica dónde las cátedras se separan (las frases donde sus intervalos de Wilson no se tocan) y en qué coinciden todas, más la ventana temporal, el total de voces y cuántas cátedras publican. Los intentos van con la moda y la cola abierta ("tres o más") dicha aparte en vez de promediada: promediar una escala con último tramo abierto censura justamente lo que importa.

**Se llega a la cátedra desde donde se la busca** (#364): la ficha dejó de alcanzarse tipeando un UUID. Entran links desde la ficha de materia, desde la ficha del docente (sus cátedras, vigentes y pasadas, cada una con su rol) y desde el buscador global.

**Editar y borrar lo que conté** (#365): `PUT` y `DELETE /api/reviews/courses/{id}`, con `/reviews/mine` en el frontend. Corregir manda el set completo y no un delta, así que dejar de contestar algo lo saca del denominador de su frase, que es la mitad de por qué alguien corrige. Una reseña ajena responde **404 y no 403**: decir "existe pero no es tuya" ya es decirle a alguien que otra persona reseñó esa cursada. El read de "mis aportes" es el único del producto que devuelve respuestas de a una, y solo hacia su autor: sin eso, corregir una obligaría a contestar las catorce preguntas de nuevo.

**La poda entró entera** (#367, 2026-08-27). Se fueron `Review`, `ReviewVote`, `TeacherResponse` y `ReviewAuditLog` con sus tablas (migración `DropPreviousReviewModel`), sus doce features, el filtro de contenido, el módulo `moderation` completo, sus 24 tests de integración, y del frontend las ocho features del modelo anterior más la ficha de docente, que publicaba rating promedio, dificultad, porcentaje de recomendación, histograma, el listado de reseñas con sus votos y la respuesta del docente. Hoy esa ficha dice quién es la persona y a qué cátedras pertenece, cada una con link a sus conteos: lo que el producto publica es de la cátedra, no del docente ([ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md)).

Se fue también lo que quedó sin dueño al sacar el aggregate: el corpus de prueba (`SeedCorpus` con sus autores fantasma, sus cursadas y sus votos) y los dos seeders que lo alimentaban, el evento `EnrollmentRecordEditedIntegrationEvent` (existía para mandar a revisión la reseña anclada a una cursada, y la reseña vigente no se ancla a la cursada), y los dos integration events de identity, que publicaban al vacío desde que sus consumidores murieron. Los architecture tests bajaron a 4 bounded contexts.

**Lo que la poda dejó al descubierto, y no es parte de ella**:

- **Borrar la cuenta ya no toca las reseñas.** El consumidor que lo hacía era del modelo anterior. Hoy la posición del producto es que quien quiera sacar lo suyo lo saca antes de darse de baja (es lo que dice la pantalla Mis aportes), pero eso deja el texto libre de una cuenta borrada en la base. Decidir si eso está bien es una story, no un detalle de la poda.
- **`just dev` arranca sin una sola reseña.** El corpus que se fue era del modelo anterior; el vigente no tiene el suyo, así que en dev las fichas dicen "junta 0". Los tests no dependen de él (crean lo suyo por API), pero mostrar el producto sí.
- **`my-career` sigue siendo la pantalla del planificador**, con su plan, sus correlativas y sus docentes mockeados. La poda le sacó los puntajes (el ★ 4.4, las dimensiones sobre 5, el contador de reseñas y las tarjetas de reseña mockeadas), porque una pantalla viva no puede mostrar lo que el producto decidió no publicar. Lo demás siguió en pie hasta R3, que la borró entera con el módulo que la alimentaba.

**Verificado** (2026-08-27, contra infraestructura real): backend compilando sin warnings, `dotnet format` limpio, **709 tests unitarios + architecture** y **327 de integración en verde** (Reviews 27, Academic 154, Identity 105, Enrollments 41), **696 tests de frontend**, `bun run build` de producción, y `check-docs --strict` limpio. En el browser: se reseñó una cursada por la pantalla real, aterrizó en Mis aportes con su acuse, y los conteos de la cátedra se movieron de 30 a 31 voces. La ficha de docente quedó con nombre y cátedras, sin un solo número sobre la persona.

**La entrada dice lo que el producto hace** (#366, 2026-08-27): `/` vendía el planificador retirado («planificá tu cuatrimestre, comparás comisiones»), cerraba con «empezá a planificar el cuatrimestre que viene», y mostraba un simulador con estrellas y un testimonio inventado. Ahora **muestra el instrumento funcionando sobre una ficha real**: `GET /api/reviews/chairs/sample` sortea una cátedra entre las que ya publican y devuelve su ficha, la misma que sirve `/chairs/{id}`. El sorteo lo hace la base y pasa por el piso de publicación: elegir la de más voces sería un destacado disfrazado, y elegir cualquiera podría caer en una que todavía no tiene nada que mostrar (US-171). Cuando ninguna publica, la entrada lo dice en vez de inventar un ejemplo.

Entran además los dos caminos a una ficha (el catálogo público y el mismo buscador que usa el producto adentro), los tres pasos, y las preguntas reescritas: dos de ellas contestan lo que el producto decidió **no** hacer. **No entran** los links a Método y a Pedir que la ficha SC-004 pide: esas pantallas no existen, y un link a una pantalla inexistente es peor que no ofrecerla.

**El E2E de los dos recorridos** (#368, 2026-08-27):

- **El camino a la ficha sin cuenta**: de la entrada al buscador, a la ficha de materia, a los conteos de una cátedra, sin tipear un UUID. El spec verifica al final que **nunca hubo cookie de sesión**: si algún tramo pidiera login, la presión que el producto existe para ejercer no llegaría a nadie.
- **Deshacer lo aportado**: nueve reseñas por API dejan a la cátedra al borde del piso, la décima se hace por la pantalla real y la ficha empieza a publicar; corregir el desenlace mueve el conteo (de 9 a 10 de cada 10), y borrarla devuelve la ficha **bajo el piso**, donde deja de publicar. Es el peor escenario del deshacer y el que más fácil se rompe.
- **El chequeo que protege la poda**: las cuatro superficies públicas se recorren buscando una estrella, un «x sobre 5», un «rating promedio» y un testimonio entrecomillado. Si alguien reintroduce un puntaje en cualquiera, esto lo agarra.

Dos specs quedaron mintiendo por lo que la poda retiró y se reescribieron: el de la landing (asertaba el copy del planificador) y el de editar una cursada, que probaba la confirmación «esto va a poner tu reseña en revisión». Ese mecanismo ya no existe (la reseña vigente no se ancla a la cursada), así que ahora prueba lo contrario: que guardar **no** advierta sobre reseñas. Una advertencia que describe una consecuencia inexistente enseña a desconfiar de los avisos del producto.

**Verificado al cierre de R2** (2026-08-27, contra infraestructura real): **709 tests unitarios y de arquitectura**, **328 de integración** corridos por área (Reviews 28, Academic 154, Identity 105, Enrollments 41), **695 de frontend**, **51 E2E** (3 en `test.fixme` previos), `dotnet format` y `check-docs --strict` limpios.

### Cómo se sabe que R2 está listo

1. Un visitante **sin cuenta** llega a la ficha de una cátedra partiendo de la landing, sin tipear un UUID.
2. **Ninguna pantalla pública muestra un promedio, una estrella ni un testimonio**, y ningún endpoint los sirve.
3. Quien reseñó corrige y borra su reseña, y los conteos de la ficha cambian en consecuencia.
4. El E2E cubre los dos recorridos y pasa en CI.

### Lo que R2 deja afuera a propósito

- **El backoffice de cátedras**: hoy `Chair` tiene dominio, migración y read público, pero cero features de escritura, así que las cátedras existen solo por el seed. Es el techo real del producto y el candidato más fuerte para R3.
- **Método y el CSV** ([US-130](../product/student/take-the-data/README.md)): la promesa de transparencia de [ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md) sigue sin superficie.
- **Todo [ADR-0085](../decisions/0085-three-instruments-and-official-data.md)**: unidad académica, datos oficiales relevados, carrera y materia canónica. Las fichas prometen datos con fuente que ninguna story de backoffice se compromete todavía a cargar.

## R3 · El catálogo crece y el número se puede auditar

Del 2026-08-29 al 2026-09-02. Milestone [R3](https://github.com/lucasidev/plan-b/milestone/4), 47 pts. Cerrado con los cinco criterios de abajo cumplidos, más la curaduría entera y US-198, que no estaban planificadas y entraron (ver más abajo).

**Por qué este hilo.** R2 dejó el producto hablando con una voz sola, y con un techo: las cátedras existen **solo porque las siembra el seed**, así que todo lo que R1 y R2 construyeron opera sobre tres filas cargadas a mano. Y lo que publica no dice cómo lo calculó, aunque la tesis prometa "un dato que aguanta una discusión". R3 levanta el techo, publica un dato que el producto no tenía, y explica todo lo que dice.

| # | Issue | Pts | Depende de |
|---|---|---|---|
| 1 | [#370 · La cátedra se carga desde el backoffice](https://github.com/lucasidev/plan-b/issues/370) | 8 | nada; el dominio de `Chair` ya está entero, faltan los features y la pantalla |
| 2 | [#371 · Se poda el seguimiento de carrera](https://github.com/lucasidev/plan-b/issues/371) | 18 | nada; primero **muda** la declaración de carrera al Registro, después poda `/onboarding`, `/my-career` y `enrollments`, y cierra los 17 ADRs que citan el módulo |
| 3 | [#372 · La ficha publica con qué se llevó la materia](https://github.com/lucasidev/plan-b/issues/372) | 5 | se verifica con 5; el modelo ya lo soporta, es un self-join |
| 4 | [#373 · Método publica cómo se calcula cada número](https://github.com/lucasidev/plan-b/issues/373) | 5 | nada; el dato ya existe entero, es pantalla y copy |
| 5 | [#374 · El corpus de prueba del modelo vigente](https://github.com/lucasidev/plan-b/issues/374) | 3 | 1 |
| 6 | [#375 · Los huecos que dejaron las podas](https://github.com/lucasidev/plan-b/issues/375) | 5 | el renaming `Review` → `Review` se lleva 3 él solo |
| 7 | [#376 · El E2E de cargar una cátedra y ver su dato](https://github.com/lucasidev/plan-b/issues/376) | 3 | todos |

**La balanza.** 21 de los 47 puntos construyen capacidad que el producto no tiene (cargar cátedras, la co-cursada, Método) y 26 limpian y sostienen. R0 fue poda pura y R2 fue mayormente hablar con una voz sola.

### Lo hecho hasta ahora (2026-08-30)

**La carrera se declara al registrarse** (#371, primera mitad). El onboarding era el único lugar donde nacía el `StudentProfile`, y sin perfil no se reseña, así que la declaración se mudó al alta antes de poder borrar nada. No podía nacer ahí mismo: `AddStudentProfile` exige el mail verificado, y ese orden de guards es cicatriz de un bug real. La intención queda en dos columnas nullables del `User` y `VerifyEmail` la materializa, con la cadena de guards corriendo igual que antes. El año de ingreso se volvió opcional, y no como concesión: US-155 ya decía que si no lo contestás queda como "no dijo", mientras el backend lo tenía `NOT NULL`.

El plan se resuelve **antes** de preguntar si el mail existe: al revés, un plan inventado devolvía 400 con un mail libre y 202 con uno ocupado, y el status code delataba si una casilla tiene cuenta, que es lo que [ADR-0076](../decisions/0076-the-three-doors-answer-the-same-whether-the-account-exists-or-not.md) no quiere que se pueda averiguar.

**Nadie que no sea alumno podía entrar.** Un pase de QA recorriendo el producto como sus personas encontró que de los cuatro roles solo `member` llegaba a alguna pantalla: el sign-in mandaba a `/home` fijo, que es del alumno, así que un admin rebotaba entre el guard de `(member)` y el de `(auth)`, en bucle y con la sesión creada. Moderación se había retirado en R2 dejando su rol apuntando a una cola que no existe, y `university_staff` nunca tuvo pantalla. Los dos salieron del frontend; el enum del backend los conserva, que es donde el rol está persistido.

**La poda** (#371, segunda mitad). Se fue el módulo `enrollments` entero (86 archivos `.cs`, 4 proyectos, 41 tests de integración), `/my-career`, `/onboarding` completo, seis features de frontend y los redirects legacy. Con ellos, lo que se quedó sin la razón por la que existía: el evaluador de disponibilidad que una poda anterior había rescatado de `planning` para el filtro de Mi carrera, dos métodos del contrato cross-módulo de Identity, y la persona sembrada que solo cubría "usuario sin profile va a onboarding".

**Inicio dejó de ser el planificador.** La revisión adversarial del diff encontró que la poda borraba Mi carrera y dejaba en pie `/home`, que es la pantalla de aterrizaje del alumno y mostraba semana del cuatrimestre, nota parcial, porcentaje de asistencia y un `4★` en sus datos mockeados. El chequeo anti-puntaje del E2E solo recorre rutas públicas, así que nada lo agarraba. Quedó primero como saludo con tres caminos, y después con su propia story: `/home` era una de las pantallas que ninguna story pedía, igual que Registro antes de US-228. La escribió [US-231](../product/student/enter/stories/US-231-see-whether-what-i-reviewed-did-anything/README.md) (ver si lo que reseñé sirvió de algo), con su ficha [SC-011](../product/student/enter/screens/SC-011-home/README.md), y escribirla podó la pantalla de cuatro bloques a dos: las cátedras que reseñaste con su estado, y la cobertura de tu carrera. Ambos con datos reales salvo el conteo de voces por cátedra, con su conteo saliendo de `GET /api/reviews/chairs/mine`, que las devuelve todas en una consulta en vez de pedir `/api/reviews/chairs/{id}/facts` fila por fila.

**Un bug de dominio que nadie había visto**: el aggregate admitía un `StudentProfile` activo por carrera, no por cuenta, y el read servía cualquiera de los dos con un `LIMIT 1` sin `ORDER BY`. Dos pestañas con carreras distintas dejaban la cuenta con dos perfiles y las materias que veías dependían de lo que devolviera Postgres ese request. El invariante quedó en las tres capas, con su índice y su migración.

**Lo que R3 decidió antes de planificar.** La épica Mi carrera era la única del catálogo con la revisión adversarial pendiente. Se hizo ([registro del 2026-08-29](../history/reviews/2026-08-29-my-career-epic.md), nueve hallazgos) y encontró que la épica no estaba bloqueada por falta de revisión, sino apoyada en un supuesto que el código contradecía. La revisión propuso arreglar la forma del seguimiento; la pregunta que faltaba era si el producto debía hacer seguimiento, y la tesis ya la contestaba ("ni una app de gestión académica", "no planifica tu cuatrimestre"). [ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) cerró la épica entera con sus dos pantallas, US-144 y US-145, y reemplazó a ADR-0069. Sobrevivió US-143, la co-cursada, que se mudó a Elegir dónde estudiar porque su dato no necesita saber nada de quien lo lee: es la pieza 3 de este sprint.

De ahí salen también la pieza 2 (el código del seguimiento sigue vivo) y la reformulación de [US-170](../product/guarantees/US-170-use-it-without-being-asked-for-anything-first/README.md), que garantizaba que se podía saltear un onboarding que ya no existe y ahora garantiza que ninguna pantalla pida completar algo antes de dejar leer o reseñar.

**Lo que el relevamiento corrigió antes de empezar.** La poda se estimó primero en 8 puntos como un borrado, y al relevarla apareció que `/onboarding/career` es el **único lugar donde se crea el `StudentProfile`**: borrarlo sin más deja al producto sin forma de crear un perfil de estudiante, y sin perfil no se reseña. La declaración de carrera se muda al Registro, que es donde la ficha SC-026 ya la ponía, y recién después se poda. Son 13 puntos. Y al relevar los docs aparecieron **17 ADRs vigentes** que citan el módulo (uno, ADR-0004, es enteramente sobre `EnrollmentRecord`), más el walkthrough de `git-workflow.md`, construido entero sobre la feature que se poda: con eso son 18, y R3 pasa de 37 a 47.

### La curaduría, que no estaba planificada y entró igual (2026-08-31 y 2026-09-01)

R3 se planificó dejando la curaduría afuera, con el argumento de que el campo libre podía seguir esperando. El argumento no se sostuvo: [ADR-0084](../decisions/0084-free-text-feeds-curation-and-is-never-published.md) le hace tres promesas al campo libre desde R1, y las tres seguían sin cumplirse mientras el producto le decía a cada persona que lo que escribía servía para algo. Entraron las tres.

**Leerlo.** Un read Dapper del campo libre con su contexto (materia, cátedra, período) y **sin la cuenta de quien lo escribió**, que no es una omisión de la pantalla sino del `SELECT`. Su endpoint con policy de admin y su pantalla en `/admin/curation`.

**Destilar frases.** El instrumento tenía `Publish` y `Close` desde R1 y **ninguna feature los usaba**: solo nacía del seed. Destilar abre esa escritura: el alta de la frase y la versión nueva del cuestionario son una sola operación, porque una frase que no entra a una versión no existe para nadie. Cada frase lleva de dónde salió (semilla o destilada) y Método lo publica.

**Notas editoriales.** Entidad nueva con sus reglas: a nivel carrera y nunca de cátedra (ahí el docente es identificable), fechada, con su procedencia dicha en la ficha ("leída de comentarios que no se publican"). Se publica y se retira.

**[US-198](../product/team/sustain-the-catalog/stories/US-198-curate-a-phrase-in-one-place/README.md), curar una frase en un solo lugar.** El catálogo se edita en `/admin/items`, con autor y fecha en cada cambio. Lo que la story pedía y no era cableado: **el sistema no puede saber si cambió el significado de una pregunta, solo lo sabe quien edita**, así que la pantalla lo declara en vez de deducirlo, y el aviso del corte nombra la consecuencia con su código y sus respuestas en lugar de decir que la acción es irreversible.

Construirlo destapó dos cosas que el plan no tenía. La primera: la ficha filtraba las frases retiradas, así que cambiar una pregunta **borraba de la vista todo lo respondido a la anterior**, que es justo lo que el corte tenía que hacer visible. Ahora la ficha publica los dos tramos separados, con la línea que dice que no se comparan, y el viejo no vota ni en la fama ni en los contrastes. La segunda: la tasa de finalización busca su frase por un código constante, así que abrirle uno nuevo la habría roto en silencio en todas las fichas; el backoffice lo rechaza y dice por qué.

**Y el término quedó decidido**: en el producto se llama **frase**, no `ítem`. Los dos nombres convivían (el glosario decía `Ítem`, la ficha de pantalla y los escenarios decían "Frases") y eso es exactamente el bug que la regla de vocabulario previene. El glosario ya dice frase; queda pendiente la barrida de la prosa que todavía dice `ítem`.

### Cómo se sabe que R3 está listo

1. Se carga una cátedra nueva desde el backoffice, con su equipo, y aparece en Reseñar y en la ficha pública de su materia **sin tocar el seed**.
2. La ficha de una materia publica con qué otras se llevó y cómo les fue, sin cuenta, con su piso de 10 por par y período.
3. Cada número que el producto publica se puede rastrear hasta la regla que lo calculó, sin leer código.
4. Ninguna pantalla pide ni muestra la trayectoria de nadie, y no queda un endpoint de historial.
5. El E2E cubre los dos recorridos y pasa en CI.

### Lo que R3 deja afuera a propósito

- **La Ficha de carrera** (SC-001): habilitaría la mitad pública de US-143 y las stories de comparar instituciones, pero esas dependen de [ADR-0085](../decisions/0085-three-instruments-and-official-data.md), o sea de datos oficiales que nadie relevó. Construirla ahora es construir una pantalla medio vacía.
- **El CSV** de Llevarse el dato: es la otra mitad de la transparencia y entra con su propia story.
- **Todo ADR-0085**: unidad académica, datos oficiales relevados, carrera y materia canónica.

## Stories bajo el gate de escenarios

Las stories del producto vigente que entraron a un sprint cerrado (R1 a R3). `scripts/check-scenarios.ts` gobierna sus escenarios: cada uno lleva un veredicto, y una story que quedó sin construir lo dice escenario por escenario con `No construido:`. Al mergear una story, se agrega acá en el mismo PR.

| Story | Nombre | Sprint |
|---|---|---|
| US-146 | Reseñar en menos de dos minutos | R1 |
| US-147 | Reseñar una materia sola | R1 a R3 |
| US-148 | Que nadie sepa que fui yo | R1 |
| US-165 | Editar o borrar mi reseña | R2 |
| US-166 | Sacar lo mío y después irme | R1 a R3 |
| US-130 | Ver cómo se calcula cada número | R3 |
| US-231 | Ver si lo que reseñé sirvió de algo | R3 |
| US-221 | Entender qué es esto viendo una ficha real | R2 |
| US-129 | Atribuir la dificultad: carrera o facultad | R1 a R3 |
| US-134 | Saber para cuánta carrera vale un dato | R1 a R3 |
| US-196 | Cargar la cátedra como entidad propia | R3 |
| US-143 | Saber qué materias se pueden llevar juntas | R3 |
| US-198 | Editar la frase en un solo lugar | R3 |
| US-127 | Ver cuánto tarda de verdad la carrera | R1 a R3 |
| US-132 | Buscar por materia, carrera o docente | R1 a R3 |
| US-204 | Que la reforma no parta el corpus | R1 a R3 |
| US-131 | Ver sobre cuántas voces se calcula | R1 a R3 |
| US-228 | Crear la cuenta recién cuando la acción me la pide | R1 a R3 |
| US-170 | Usarlo sin que me pidan nada antes | R1 a R3 |
| US-171 | Que no me vendan nada | R1 a R3 |

US-155 y US-197 salieron de la tabla el 2026-09-04: el código no pregunta el año de ingreso en Reseñar ni tiene la cola de materias declaradas, así que no están construidas; sus issues (#270, #312) se reabrieron en Backlog.

## R4 · Un stage funcional, y una suite que dice la verdad más rápido

Del 2026-09-02 al 2026-09-07. Milestone [R4](https://github.com/lucasidev/plan-b/milestone/5), issues #400 a #423, 61 pts en tres pistas.

**Por qué este hilo.** Tres sprints construyeron la máquina que convierte reseñas en fichas, y nadie la usó todavía: seguimos pre-deploy y no existe una reseña de una persona real. Antes de personas reales, un stage: el producto entero en una URL, con el corpus sintético, recorrible por Lucas y por Copas. Y la retrospectiva de R3 pidió mirar la calidad con lentes de QA: la [auditoría de tests de R1 a R3](../history/reviews/2026-09-02-audit-tests-r1-r3.md) encontró una suite grande y verde pero desbalanceada (el dominio bien cubierto, la aplicación probada solo con Postgres, las pantallas del corazón en 0 % en vitest, y 9 de 75 escenarios citados por un test), y una sola línea que explica casi todo el costo de CI (cada clase de integración levanta su base, corre 57 migraciones y siembra, 50 veces en serie). **R4 no recorta: entran los doce hallazgos y las ocho propuestas de eficiencia.**

### Pista 1 · El stage, con datos de prueba (14 pts)

| # | Tarea | Pts | Quién |
|---|---|---|---|
| [#400](https://github.com/lucasidev/plan-b/issues/400) · 1 | **El frontend recibe la URL del backend en el build**: `ARG NEXT_PUBLIC_API_URL` en el Dockerfile e input en `release.yml`. Hoy hornea `localhost:5000`. **Hecho el 2026-09-04**: `ARG` obligatorio en el build stage e input `api_url` en `release.yml`; de paso, la imagen nunca había sido construible (sin `output: standalone`, lockfile mal nombrado, sin `.dockerignore`) y ahora escucha en `0.0.0.0` | 1 | Claude |
| [#401](https://github.com/lucasidev/plan-b/issues/401) · 2 | **`docker-compose.stage.yml`**: postgres, redis, mailpit, api en `Development` con `PLANB_SEED_CORPUS=1` (los seeders y las migraciones corren solos), web. Red `dokploy-network`, `expose` en vez de `ports`, volumen con nombre para postgres, imágenes de GHCR por sha. Reset: `down -v && up`. **Hecho el 2026-09-04**: cinco servicios en dos redes, probado en local con podman e imágenes locales (api healthy, `/health` por el rewrite, catálogo y corpus sembrados); la UI de Mailpit con auth y las personas con la password de `PLANB_SEED_PASSWORD`, porque las del repo son públicas | 3 | Claude |
| [#402](https://github.com/lucasidev/plan-b/issues/402) · 3 | **Sección "Stage" en `deploy.md`**: el guion de clics en Dokploy (registro GHCR, servicio Compose desde el repo, env, los dos dominios, deploy, reset) y la decisión escrita de por qué el stage corre como Development hospedado y no como Staging. **Hecho el 2026-09-04**: la sección, con el guion de clics, las variables que inyecta Dokploy, y lo verificado en local separado de lo que recién se prueba contra la infra real | 2 | Claude |
| [#403](https://github.com/lucasidev/plan-b/issues/403) · 4 | **Primer deploy del stage**: correr `release.yml` por primera vez (GHCR nunca se corrió), configurar Dokploy con el guion, deploy, `/health`, recorrer. Lo que la infra real destape vuelve al doc. **Al 2026-09-04**: desplegado. `release.yml` corrió por primera vez (imágenes `71375b7`), los dos paquetes de GHCR quedaron públicos y Dokploy los bajó sin registro, los cinco servicios levantaron con el corpus (`CorpusSeeder: inserted 49 reviews`), y en `planb.olisar.com.ar` responden `/health`, la entrada, las fichas y Método; un registro manda su mail de verificación a Mailpit. Lo que la infra destapó (paquetes públicos, el GitHub App por cuenta, Autodeploy apagado, el selector de servicio de Domains) está en `deploy.md`; y un body que no parsea devolvía 500 en Development donde Production devuelve 400 (`ThrowOnBadRequest`), arreglado con su fila en la matriz de endpoints de escritura. Falta el tramo con cuenta del recorrido y el reset por terminal | 3 | Lucas con el guion, Claude con lo que rompa |
| [#404](https://github.com/lucasidev/plan-b/issues/404) · 5 | **El recorrido para Copas**, al final del doc: Pérez publica con 14 voces, Ruiz bajo el piso con 6, la co-cursada que publica y la que no, Método, registrarse y verificar desde Mailpit, reseñar y ver que contó, cargar una cátedra y curar una frase. **Al 2026-09-04**: escrito al final de la sección Stage y caminado sobre el stage en sus pasos 1 a 4 con los números del corpus. El par de co-cursada que publica es con Desarrollo de Software (111): el id del corpus siempre fue el de 111, y el nombre 121 que llevaban el código y el recorrido era el equivocado. Faltan los pasos 5 a 8 | 1 | Claude |
| [#405](https://github.com/lucasidev/plan-b/issues/405) · 6 | **Barrida `ítem` → frase** (335 en docs, 77 en código) y el gate: `check-docs` falla con un término prohibido del glosario fuera de `history/` y de los ADRs. **Hecho el 2026-09-03**: 341 reemplazos en 83 archivos de docs y 294 líneas en 85 de código, con la concordancia revisada; el gate rechaza `ítem` en prosa fuera de `history/` y de los ADRs | 3 | Claude |
| [#406](https://github.com/lucasidev/plan-b/issues/406) · 7 | **Orden**: cerrar los 5 issues de R0 que siguen abiertos, la entrada de la retro en `lessons-learned.md`, y decidir los 15 issues US-2xx sin milestone. **Al 2026-09-04**: R0 vacío, la retro escrita, y los US-2xx en Backlog (los cuatro de moderación de texto publicado, cerrados); y el 2026-09-04, los 73 issues del catálogo US-127 a US-199 (fuera del alcance original): las construidas bajo el gate cerradas como completadas, las 55 sin sprint a Backlog, ninguna marcada muerta, y dos reabiertas el mismo día porque el código no las tiene (US-197, US-155); cero issues sin milestone | 1 | Claude; lo último, Lucas |

**Decidido el 2026-09-03**: el stage va con HTTPS, `sslip.io` sobre la IP del servidor y certificado de Let's Encrypt emitido desde Dokploy, porque corre en un servidor y no en una máquina local. Los 73 issues del catálogo (US-127 a US-199) se decidieron el 2026-09-04: construidas cerradas, el resto a Backlog. Sin MCP ni proveedor de IA de Dokploy: se opera a mano.

### Pista 2 · Romper el producto (40 pts)

El escenario es la especificación y un test es un intento de falsarla. Tres reglas para todo test de esta pista: se escribe a ciegas, desde el escenario, la story o el ADR y el contrato público, sin leer la implementación; si sale verde a la primera, se rompe el código a propósito y tiene que caer, o se borra; y cuando escenario y código no coinciden, es un bug (issue con el caso que lo dispara) o una decisión de Lucas (el escenario se reescribe o se marca `No construido:`), nunca un escenario acomodado al código ni un test que afirme el bug. Cada tarea cita su hallazgo; el registro es la fuente y ahí se les cambia el estado al cerrarse.

| Hallazgo | Tarea | Pts |
|---|---|---|
| [#407](https://github.com/lucasidev/plan-b/issues/407) · Q01 | **Los 75 escenarios, a ciegas**: la regla y su gate. El test de un escenario lo escribe quien recibe el escenario y el contrato público, no la implementación; si sale verde a la primera, se rompe el código a propósito y tiene que caer, o se borra. Cada E/N de las 18 stories construidas recibe un veredicto: `confirmado` (test que lo cita por ID y cayó con el código roto), `roto` (issue con el caso que lo dispara, test marcado con ese issue) o `no construido` (nota en `scenarios.md`, decisión de Lucas). `scripts/check-scenarios.ts` cuenta las tres columnas y falla en CI ante un escenario sin veredicto; el procedimiento entra a `testing.md`. **Al 2026-09-03**: el gate corre en CI (informa) sobre 97 escenarios de 22 stories, con 9 confirmados; falta la barrida. **Al 2026-09-04**: 6 `No construido:` con la razón que sale del código (US-228 E2, N1 y N3; US-204 E2 y N1; US-196 N1); US-197 y US-155 salen del gate porque el código no las tiene (issues reabiertos); quedan 78 sin veredicto en 20 stories, con sus specs escritos en tres tandas. **Al 2026-09-05**: barrida completa en tres tandas sobre 91 escenarios de 20 stories: 68 confirmados por un test que los cita y que cayó con el código roto a propósito, 3 rotos con su issue (#439, #440, #441), 18 `No construido:` con la razón que sale del código, y 2 esperando decisión (US-132 E2 y N1: la letra pedía que buscar a una docente llevara a su cátedra y el código lleva a su pantalla, a propósito). **Al 2026-09-05**: los tres rotos arreglados con sus tests prendidos, y US-132 E2 y N1 confirmados después de reescribir su letra al diseño de la pantalla de docente, que entró al catálogo como SC-035: 73 confirmados, 0 rotos, 18 no construidos, 0 sin veredicto. En la letra se corrigió una promesa mal escrita (US-166 E3 y SC-016 pedían la jerga "hash irreversible") y una consecuencia del stage (US-221 E3 deja de prometer Buscar desde el hero) | 10 |
| [#408](https://github.com/lucasidev/plan-b/issues/408) · Q02 | **Las invariantes de la tesis bajo ataque**, en vez de un test por handler: la lista de lo que la tesis, las garantías y los ADRs prometen, y un ataque por promesa que cae si cede: el piso contado en vivo en 9, 10 y 11 reseñas; dos envíos concurrentes de la misma persona; el campo libre buscado en cada respuesta y pantalla pública; la frase retirada y los dos tramos de una serie; el borrado que mueve los conteos; ningún endpoint público que diga quién reseñó; Redis caído en medio de publicar y de entrar. Lo que cede es un issue con el caso, nunca un test que afirme lo roto. **Hecho el 2026-09-03**: las siete promesas atacadas en `Invariants/`, ninguna cedió, y cada test cayó con el código roto a propósito antes de quedar | 7 |
| [#409](https://github.com/lucasidev/plan-b/issues/409) · Q03 | **Las pantallas del corazón, a ciegas**: reseñar (los seis pasos y sus estados), ficha de cátedra (publicada, bajo el piso, con corte de serie), ficha de materia, mis reseñas, curaduría (lista y los dos forms). Quien escribe recibe la story, sus escenarios y la ficha de la pantalla, no el componente; test de componente cuando el estado es del cliente, E2E cuando es un recorrido. Que vitest deje de marcar 0 % ahí es consecuencia, no meta. **Al 2026-09-03**: Reseñar hecha (20 tests desde US-146, US-147 y SC-015, cada uno tumbado a propósito; US-146 y US-147 confirmadas en el gate; dos promesas rotas arregladas, #431 y #432); faltan las fichas de cátedra y materia, mis reseñas y curaduría. **Hecho el 2026-09-05**: las cuatro pantallas con sus tests de componente desde la ficha de cada una (seis la ficha de cátedra, nueve la de materia, seis Mis aportes, cuatro curaduría), cada uno tumbado a propósito, más el acuse de publicación en el recorrido de Deshacer; una promesa rota arreglada (#444: cómo terminó cada cursada se ve en la tarjeta propia). Los estados que solo piden stories en Backlog quedan sin test, con su razón | 5 |
| [#410](https://github.com/lucasidev/plan-b/issues/410) · Q04 | Los catorce tests de integración que leen el body sin afirmar el status. **Hecho el 2026-09-05**: eran 40 lecturas en el inventario y 88 más al recorrer la suite entera método por método; un helper (`GetOkAsync`, `GetOkStringAsync`) afirma 200 con la ruta y el status que llegó, y toda lectura pasa por él o por un assert explícito; 692 de 692 en verde, sin cambiar una aserción de negocio | 1 |
| [#411](https://github.com/lucasidev/plan-b/issues/411) · Q05 | El guard anti-puntaje recorre la entrada, las tres fichas, Método y el docente, y un test recorre cada respuesta JSON pública buscando un promedio, un puntaje o una estrella con otro nombre. **Hecho el 2026-09-05**: el guard E2E recorre las diez rutas públicas con seis patrones; un test de integración recorre las dieciocho respuestas JSON públicas y los tipos que declaran; los dos cayeron con un puntaje plantado a propósito (un `AverageScore` en la ficha de cátedra, una estrella en cada pantalla) | 1 |
| [#412](https://github.com/lucasidev/plan-b/issues/412) · Q06 | **Las restricciones del producto con test**: `@axe-core/playwright` sobre la entrada, las tres fichas y Método (WCAG 2.2 AA); un proyecto de Playwright con viewport de celular chico para lo público; y un presupuesto de rendimiento de lo público con Lighthouse CI (medición y umbral, sin gate hasta ver dos corridas). **Hecho el 2026-09-06**: axe sobre las ocho rutas públicas destapó violaciones reales de contraste que salen de dos lugares del sistema de diseño, el token `text-ink-3` y el chip ⌘K (#451, los ocho tests en cuarentena con ese issue); el link a Método del hero se subraya porque axe lo marcaba como link sin distinguir del texto; un proyecto `mobile` (Pixel 5) repite lo público sin scroll horizontal en ninguna ruta; Lighthouse mide la entrada, Método y las dos fichas en mobile (rendimiento 0,90 a 0,96, accesibilidad 0,90 a 0,95, buenas prácticas 0,93 a 0,96, SEO 0,90 a 1,00), avisa y no gatea, y sube su reporte desde el job E2E | 4 |
| [#413](https://github.com/lucasidev/plan-b/issues/413) · Q07, Q12 | **Lo que nadie ejecuta y lo que nadie usa**: los tres E2E en `fixme` desde mayo (arreglar o borrar, con la razón), y tres restos: `just db-seed` (verbo inexistente), el workflow `test-gaps` con módulos podados, y `AllowedTags` (US-089, sin referencias). **Hecho el 2026-09-04**: los tres `fixme` corren otra vez (el efecto en render de Mi perfil pasó a `useEffect` con el refresh del padre; el diálogo de baja reintenta el click hasta la hidratación; el toggle espera la respuesta del action), cinco corridas cada uno y caída con el código roto; `db-seed` y `AllowedTags` fuera; `test-gaps` ya no existía | 1,5 |
| [#414](https://github.com/lucasidev/plan-b/issues/414) · Q08 | **Cobertura como mapa, no como meta**: CI genera los dos reportes (`dotnet-coverage`, `@vitest/coverage-v8`) y los sube como artefacto en cada PR, sin gate (ADR-0036). Se lee para saber dónde nadie intentó nada todavía y elegir el próximo ataque. **Hecho el 2026-09-05**: coverlet en los seis proyectos de test y cobertura v8 en vitest; cada PR sube tres artefactos (backend unit, backend integración, frontend), sin gate; `just backend-coverage` y `just frontend-coverage` en local; `testing.md` dice dónde están y para qué se leen | 1 |
| [#415](https://github.com/lucasidev/plan-b/issues/415) · Q09 | **Las reglas de las notas y de los ajustes, intentadas al revés**: cada regla que ADR-0084 le da a `EditorialNote` (nivel carrera o institución, fechada, con procedencia, sin nombres) probada con una nota que la viola; la regla que el código no impone es un hallazgo, no un test que falta. Lo mismo con `UserSettings`, y `GET /api/reviews/publishing-rules` contra los valores que `PublishingRulesTests` pinea. Al cerrarse se reescribe la sección Identity de `data-model.md` (decisión del 2026-09-04; los hallazgos están en el issue). **Hecho el 2026-09-05**: 21 tests de dominio y uno de integración desde las reglas, cada guarda rota a propósito; dos reglas que el código no impone quedan apagadas con su issue (#446 una nota que nombra a una persona, #447 un PATCH vacío que mueve `UpdatedAt`) y dos sin regla que probar van a diseño (#448); la sección Identity reescrita desde el código | 1,5 |
| [#416](https://github.com/lucasidev/plan-b/issues/416) · Q10 | Las nueve rutas sin E2E: docentes del backoffice y universidad nueva con su spec; `design-check`, `maintenance` y `offline` con un smoke; `teacher-claim` y `verify-teacher` son faltantes al revés, código del modelo anterior sin story vigente, y su destino (borrar o probar) lo decide Lucas antes de escribirles un test. **Decidido el 2026-09-03**: se borraron, con su feature y los cuatro endpoints del claim en identity; en un segundo corte se fue el aggregate del perfil docente entero, con sus dos tablas y los dos métodos de contrato sin caller. Queda `University.InstitutionalEmailDomains`, dato del catálogo, hasta que la épica reviewed decida. Faltan los specs de las siete rutas vivas. **Hecho el 2026-09-05**: los tres specs de las siete rutas (docentes y universidad del backoffice desde lo que la pantalla promete, y tres smokes de sistema), doce tests rotos a propósito antes de darse por buenos y dos corridas seguidas en verde; sin citas de escenario porque ese ABM es el catálogo heredado y las stories vigentes describen otra cosa; destapó que el muestrario de diseño respondía 200 en vez de 404, arreglado en la misma branch | 2,5 |
| [#417](https://github.com/lucasidev/plan-b/issues/417) · Q11 | **Autorización y validación por ataque**: por cada endpoint que escribe, intentar pasar sin token, con el token de otra persona (editar, borrar y deshacer una reseña ajena por su id), con un alumno en rutas de admin y un admin en las de alumno, y con el payload en el borde (vacío, más largo que el máximo, enum inválido, id inexistente). Cada 200 donde correspondía 400, 401 o 403 es un issue con el request; los tests que quedan tienen la forma de los de curaduría. **Hecho el 2026-09-03**: 329 intentos sobre los 52 endpoints; la autorización aguantó entera y la validación soltó tres bugs (#426, #427, #428), cerrados en el mismo PR | 3 |
| [#418](https://github.com/lucasidev/plan-b/issues/418) · fuera de la auditoría | **Mutation testing sobre el corazón**: Stryker.NET sobre `PublishingRules`, `ChairFactsCalculator`, el corte de serie de `Item` y el aggregate `Review`, y Stryker sobre el paso de reseñar; línea de base al principio y medición al cierre en `testing.md`, sin gate. Cada mutante que sobrevive se convierte en un test (si pinea una regla) o en un issue (si muestra código sin regla). **Hecho el 2026-09-03**: backend de 81,6 % a 96,0 % (217 mutantes, 8 sobrevivientes con dueño); frontend con 122 mutantes y ningún test que los mire, línea de base real con #409. **Hecho el 2026-09-05**: frontend de 9,84 % a 96,72 % (122 mutantes, 118 muertos, 4 sobrevivientes con dueño en `testing.md`) con 25 tests sobre la action y los fetchers de Reseñar | 2,5 |
| [#446](https://github.com/lucasidev/plan-b/issues/446) · hallazgo de #415 | **La nota editorial rechaza un texto que nombra a un docente**: la lista cerrada de personas identificables son los docentes, activos o no, de la universidad de la carrera de la nota, y la regla vive en el dominio (`PersonName`, `EditorialNote.Publish`); quien no está en esa lista queda a criterio de quien cura. **Hecho el 2026-09-06**: se rechaza la nota que contenga, como palabras enteras y sin distinguir tildes ni mayúsculas, el nombre y apellido de un docente seguidos, o su apellido solo escrito con mayúscula inicial ("Pérez", "Perez", "PÉREZ", "de la Fuente" y "Martín perez" cuentan; "perez", "los campos" y "Pereza" no); un apellido sin letras no nombra a nadie y el texto se normaliza antes de buscar. El error dice a quién nombró y el formulario lo repite en español. Límite conocido: un apellido que también es un lugar (Córdoba, Mendoza) bloquea la nota que menciona el lugar, y se resuelve reescribiendo; una confirmación explícita de quien cura entra recién si eso molesta en la práctica. Tests de dominio sobre `PersonName` y `EditorialNote`, dos de integración con el docente sembrado y tres de la action del formulario, cada regla tumbada a propósito | 1 |
| [#447](https://github.com/lucasidev/plan-b/issues/447) · hallazgo de #415 | **Un PATCH de ajustes sin cambios no mueve la fecha**: `UserSettings.Update` mueve `UpdatedAt` solo si algún valor cambió de verdad; mandar el mismo valor que ya tenía no es un cambio. **Hecho el 2026-09-06**: cada campo se aplica solo si trae valor y difiere del actual; dos tests del dominio (todo en null, y los mismos valores que ya tenía, con el reloj un día después) caen con el código anterior | 0,5 |
| [#450](https://github.com/lucasidev/plan-b/issues/450) · hallazgo de #449 | **Guardar en Mi perfil espera al action**: el form cierra y refresca recién cuando el action respondió, en la misma transición, y un guardado fallido deja el form abierto con lo tipeado. **Hecho el 2026-09-06**: la traza de CI y una local mostraban lo mismo (un guardado, dos refetch de la página con milisegundos de diferencia y la vista clavada en modo edición): el aviso al padre era una arrow inline en las dependencias del efecto, y cada re-render del padre volvía a refrescar. Medido 20 veces en secuencia contra el build, con un nombre distinto por repetición: antes 1 fallo en 20 (la primera corrida, en frío); después 0 en 20. Tres tests de componente sostienen el orden, el guardado fallido y el botón en vuelo; los dos primeros caen con el código anterior | 1 |
| [#451](https://github.com/lucasidev/plan-b/issues/451) · hallazgo de #412 | **`ink-3` llega al contraste AA**: el tono más claro con el que se escribe texto pasa 4,5:1 sobre los tres fondos, y `ink-4` no es para texto legible; la regla queda en `design-system.md`. **Hecho el 2026-09-06**: `--color-ink-3` baja de `#7b8089` (3,64:1 sobre el papel, 3,94:1 sobre tarjeta, 3,36:1 sobre el fondo elevado) a `#62676f` (5,22:1, 5,64:1 y 4,82:1), mismo tono y croma; con eso el chip ⌘K pasa en sus dos ubicaciones sin tocar componentes, y los siete bocetos con la paleta y ADR-0071 llevan el valor nuevo. Al sacar de cuarentena los ocho tests de axe aparecieron tres cosas más que la cuarentena tapaba: las tres rutas del catálogo (`/universities`, `/universities/[slug]/careers`, `/teachers/[id]`) quedaban fuera de la superficie Boletín y resolvían la paleta vieja, así que ahora toda ruta pública entra por el layout público; los dos CTAs de la entrada usaban el naranja de la paleta vieja con texto blanco (2,97:1) y pasan al botón primario del producto (el de la banda oscura, al secundario); y el texto legible escrito en `ink-4` en lo público (las líneas de distribución bajo cada barra, notas de las fichas de materia y cátedra, el separador del breadcrumb) pasa a `ink-3`. El mismo uso de `ink-4` como texto queda en pantallas con cuenta: es un hallazgo aparte | 1 |

### Pista 3 · La suite y CI, más rápidos (7 pts)

Línea de base medida el 2026-09-02: el job de backend tarda 489 s (354 s de tests, 48 s de `dotnet format`), el E2E 333 s (179 s de Playwright con un worker), la integración local 25 minutos, y una clase de integración de 3 tests tarda 18 s de pared por 246 ms de tests. Con las colecciones en paralelo (x4) el área Reviews pasó de 565 s a 212 s, 73 de 73 en verde, sin tocar un test. Cada tarea se cierra con el número de después al lado del de antes.

| # | Tarea | Pts |
|---|---|---|
| [#419](https://github.com/lucasidev/plan-b/issues/419) · 1 | **Colecciones de integración en paralelo** (`parallelizeTestCollections: true`, `maxParallelThreads: 4`): cada clase ya tiene su base, que es la condición de xUnit. Y **base plantilla**: migrar y sembrar una vez por corrida en `planb_template`, y que cada clase haga `CREATE DATABASE ... TEMPLATE` en vez de correr 57 migraciones; la copia se serializa con un semáforo porque la plantilla no admite conexiones mientras se copia. ADR-0027 queda intacto. **Medido el 2026-09-02**: la suite entera pasó de unos 25 minutos por áreas a 410 s en una sola corrida (325 de 325), y una clase de 3 tests de 18 a 15 s; lo que queda por clase es el arranque del host (Wolverine genera código en Development), que es el siguiente escalón | 3 |
| [#420](https://github.com/lucasidev/plan-b/issues/420) · 2 | **Partir el job de backend** en unit más arquitectura (segundos) e integración, en paralelo; **`dotnet format whitespace --verify-no-changes --no-restore`** en vez del format completo, porque `EnforceCodeStyleInBuild` ya gatea estilo y analizadores en el build; y **caché de NuGet** con `RestorePackagesWithLockFile` y `cache: true` en `setup-dotnet`. **Medido el 2026-09-03**: el job unit termina en 83 s (tests 8 s) y el de integración en 203 s, contra 489 s del job único; con la caché caliente el restore baja de 17 s a 4 s | 1 |
| [#421](https://github.com/lucasidev/plan-b/issues/421) · 3 | **E2E en paralelo**: primero aislar los specs que mutan datos sembrados compartidos (Pérez cruza el piso en `chair-facts`, `undo` lo baja), cada uno sobre su propia cátedra o sus propias cuentas; después `fullyParallel: true` y `workers: 2` en CI, y `--shard` con `merge-reports` el día que crezca. **Medido el 2026-09-03 en local**: Playwright de 330 s a 150 s con seis workers, 69 de 69 en ocho corridas completas; `admin/items` queda en un proyecto serial porque el instrumento es un singleton global: dos destilados a la vez, uno pierde con 409 por diseño (#433, reproducido con doce vías: nunca un 500, el handler de unique lo traduce desde julio). **En CI con tres workers** (PR #434): el paso de Playwright de 179 s a 116 s y el job E2E de 333 s a 270 s; en los PR #435 y #437, 155 s y 124 s: tres corridas seguidas en verde con workers y el corte de 110 s sin tomar; cerrado el 2026-09-04 con esa medición, y `--shard` vuelve cuando la suite crezca. La suite completa con workers soltó cuatro flakes (#436): esperas de 5 s donde el resto espera 15 o 30, y el spec de ajustes compartiendo la cuenta consigo mismo; con ambos arreglados, cinco corridas completas seguidas en verde | 2 |
| [#422](https://github.com/lucasidev/plan-b/issues/422) · 4 | **Política de flakes** en `testing.md`: el reintento solo para tests marcados como flaky, `retries: 0` en CI salvo esa marca, el estado `flaky` de Playwright reportado y contado, y una cuarentena con vencimiento (los tres `fixme` de Q07 son la cuarentena de hoy, sin fecha). **Hecho el 2026-09-04**: `retries: 0` siempre, el reintento solo dentro de un `describe` configurado con el tag `@flaky`, reporter json y `check-flaky` en CI y en `just ci` (falla si un `fixme` o un `@flaky` no lleva issue y fecha, y lista los flaky de la corrida); cinco corridas completas seguidas en verde | 0,5 |
| [#423](https://github.com/lucasidev/plan-b/issues/423) · 5 | **Lo afectado, en local**: dos recetas de `just` con `dotnet-affected` y `vitest --changed origin/main` para el pre-push. CI sigue corriendo todo: es la lección de mayo. **Hecho el 2026-09-04**: `scripts/test-affected.ts` con `dotnet-affected` 6.2.0 y `vitest --changed`; en una branch larga lo afectado es casi todo el árbol (10 min medidos), y `testing.md` dice cuándo no usarlo | 0,5 |

Descartado con razón: compartir el build entre jobs por artefactos (los jobs corren en paralelo; encadenarlos le suma al E2E la espera del build ajeno) y la cola de merge (exige repo público de una organización; este es de usuario).

### Pista 4 · Operar el stage (12 pts)

Lo que dejaron la evaluación del CI/CD y la comparación con `pin-equipo4` y `pokedex-api` (2026-09-06): el stage se opera con ojos, no a ciegas. El gate de entorno para producción queda para cuando exista producción.

| # | Tarea | Pts | Quién |
|---|---|---|---|
| [#455](https://github.com/lucasidev/plan-b/issues/455) · 1 | **El stage sigue a main**: cada merge a `main` publica las imágenes (el sha y el tag móvil `main`) y redespliega el stage por la API de Dokploy; producción se promueve desde un Release de GitHub cuando exista su servicio (ADR-0089, que reemplaza a ADR-0038). **Hecho el 2026-09-06**: el workflow *Publish images* dispara en cada push a `main` y a mano para cualquier ref, el compose corre `main` por defecto con `pull_policy: always`, y el redeploy va por la API con tres secrets que carga Lucas; sin ellos el workflow publica y avisa. La primera corrida real es el primer merge a `main` con los secrets cargados | 1 | Claude; los secrets, Lucas |
| [#456](https://github.com/lucasidev/plan-b/issues/456) · 2 | **`/health` chequea Postgres y Redis y devuelve el sha**: health checks con latencia por dependencia, 503 si una falla, `version` con el sha horneado en la imagen; el healthcheck del compose y el `HEALTHCHECK` del Dockerfile pegan a `/health`; el job del stage espera a que el stage devuelva el sha nuevo. **Hecho el 2026-09-07**: `/health` responde `{status, service, version, checks[]}` con Postgres y Redis chequeados (latencia por dependencia, 503 y el error del que falló); `version` es el build arg `GIT_SHA` que *Publish images* hornea en la imagen del api; el healthcheck del compose pide `/health` por HTTP (el web tiene el suyo, que atraviesa el rewrite al api); el job del stage espera hasta cinco minutos a que el stage responda 200 con ese sha, o falla. Tres tests de integración, cada uno caído con el `/health` viejo. El `HEALTHCHECK` de los Dockerfiles queda con #458 | 2 | Claude |
| [#457](https://github.com/lucasidev/plan-b/issues/457) · 3 | **Métricas Prometheus y tablero Grafana**: `/metrics` con las señales de oro y contadores del dominio; Prometheus y Grafana provisionados como código en el compose de producción; reglas de alerta con un canal. **Hecho el 2026-09-07**: `/metrics` con prometheus-net (histograma y contador HTTP por método, ruta con plantilla y código, sin `/health` ni `/metrics`), `dependency_up` alimentado por los health checks, y cuatro contadores de dominio detrás de `IDomainMetrics` en el shared kernel (reseñas publicadas por instrumento, fichas de cátedra leídas según publiquen o no, intentos de ingreso por resultado, notas editoriales). Producción tiene su compose, `docker-compose.prod.yml` (perfil Production, relay SMTP real sin Mailpit, tags pineados obligatorios), con `prometheus` y `grafana` siempre prendidos: el datasource, el tablero de ocho paneles y tres alertas (`ApiDown`, `DependencyDown`, `HighErrorRate`) provisionados desde `observability/` hacia un contact point de Discord opcional; el stage sigue con sus cinco servicios. Dos tests de integración sobre `/metrics`, cada uno caído sin la instrumentación. El compose de producción no se levantó todavía en ningún servidor | 3 | Claude |
| [#458](https://github.com/lucasidev/plan-b/issues/458) · 4 | **Contenedores endurecidos e imágenes con procedencia**: usuario no root y `HEALTHCHECK` en los dos Dockerfiles, labels OCI, atestaciones de SBOM y procedencia, Trivy como aviso, limpieza semanal de GHCR. **Hecho el 2026-09-07**: el api corre como `app` (uid 1654) y el web como `bun` (uid 1000, con `.next` suyo porque el optimizador de imágenes escribe ahí), cada uno con `HEALTHCHECK` contra `/health` (bash sobre el socket en aspnet, `bun -e fetch` en el web); *Publish images* etiqueta las imágenes con `docker/metadata-action` (título, descripción, origen, revisión, fecha, versión) y publica atestaciones de SBOM y procedencia; un job `scan` corre Trivy (CRITICAL y HIGH, sin fixed) sobre las dos imágenes y sube el reporte como artefacto y al resumen, sin gatear; `prune-images.yml` deja las últimas veinte versiones de cada paquete los lunes | 2 | Claude |
| [#459](https://github.com/lucasidev/plan-b/issues/459) · 5 | **Runbook del stage e inventario de secretos**: los casos de operación (crash loop tras un deploy exitoso, pinear un sha, disco, certificado, Dokploy caído, reset) y una sola tabla de secretos con quién carga cada uno. **Hecho el 2026-09-07**: `docs/engineering/runbook.md` con cómo se lee el stage (`/health` con el sha, Deployments, Logs, Monitoring, el job del stage), ocho casos con síntoma, diagnóstico y acción (el merge que no cambia el stage y el pin de un sha, verificados ese día; crash loop, disco, certificado, Dokploy caído y el reset, sin verificar y dichos así), y el inventario de secretos de GitHub y de Dokploy con cómo se rota cada uno | 1 | Claude; probarlos contra el stage, Lucas |
| [#460](https://github.com/lucasidev/plan-b/issues/460) · 6 | **Los switches de seguridad del repo**: alertas de Dependabot y CodeQL encendidos, base al día y los checks de docs y escenarios obligatorios en el ruleset, merge commit apagado, política para los PRs de Dependabot. **Hecho el 2026-09-07, por la API de GitHub**: alertas y actualizaciones de seguridad de Dependabot encendidas; CodeQL default setup configurado (C#, TypeScript y Actions); el ruleset de `main` exige base al día y suma `Scenario verdicts` a los checks obligatorios (los dos checks de Docs quedan afuera a propósito: su workflow corre solo cuando cambian docs y un check obligatorio que no corre bloquea el merge); merge commit apagado a nivel repo y auto-merge habilitado. Política para Dependabot: sus PRs se revisan y mergean al abrir cada sprint; el bump de dotnet-sdk (#346) mergeado ese día después de rebasarlo | 0,5 | Claude por API |
| [#461](https://github.com/lucasidev/plan-b/issues/461) · 7 | **Actions pinneadas por sha y zizmor en CI**. **Hecho el 2026-09-07**: los 54 `uses` de los siete workflows pinneados al sha completo con la versión exacta al lado (Dependabot los mantiene); un job `Workflows` en CI corre `zizmor` y `actionlint` en cada PR; de leer las reglas de zizmor salieron `persist-credentials: false` en los checkouts que no pushean, `packages: write` bajado del workflow a los dos jobs que publican, y el `pull_request_target` del lockfile de Dependabot justificado en `.github/zizmor.yml` | 1 | Claude |
| [#462](https://github.com/lucasidev/plan-b/issues/462) · 8 | **Límites de memoria y rotación de logs en el compose del stage**, con valores medidos contra el consumo real. **Hecho el 2026-09-07**: `mem_limit` por servicio (`api` 768 MiB, `web` 256, `postgres` 512, `redis` 128, `mailpit` 128) desde lo medido en reposo en el Monitoring de Dokploy (`api` 362 MiB, `web` 94), menos de la mitad del servidor; logs en `json-file` con tres archivos de 10 MB por contenedor; los números y cómo volver a medir, en `deploy.md` | 0,5 | Claude |
| [#464](https://github.com/lucasidev/plan-b/issues/464) · 9 | **k6 con umbrales contra el stage**: un script de lectura y uno de escritura con p95 y tasa de error como umbrales, `just load` contra el stage o un build local, y la medición en `deploy.md` (VUs que aguanta y qué se degrada primero). **Hecho el 2026-09-07**: `k6/read.js` y `k6/write.js` con umbrales (p95 < 1500 ms, fallas < 5 %), corridos con la imagen oficial de k6 por podman o docker desde `just load`; medido en lectura contra el stage: 10 usuarios p95 146 ms, 25 p95 118 ms, 50 p95 382 ms, 100 p95 970 ms, cero fallas en todos; la escritura (el ingreso, con bcrypt) queda por medir con las cuentas sembradas | 1 | Claude |

### Secuencia

La pista 3 va primero: acelera el resto del sprint. En la pista 2, #407 va primero, porque la regla gobierna los tests que se escriben después; #408, #417 y #418 no dependen de nada y son los que más rompen, así que van temprano. La pista 1 corre en paralelo: sus tareas 1 a 3 son del repo y no dependen de nada; la 4 es de Lucas con el guion.

### Cómo se sabe que R4 está listo

1. Una URL de Dokploy responde `/health` y muestra la entrada con el corpus; la ficha de Pérez publica con 14 voces y la de Ruiz dice que le faltan 4; alguien se registra, verifica desde el Mailpit del stage, reseña y la reseña cuenta; el admin sembrado cura una frase; `down -v && up` vuelve a cero y resiembra igual.
2. `check-scenarios` corre en CI y devuelve cero escenarios sin veredicto en las 18 stories, y cada `roto` tiene su issue.
3. Cada invariante de la tesis tiene su ataque en la suite y ninguno cede; las pantallas del corazón tienen sus tests escritos desde la story; el corazón tiene su mutation score publicado y ningún mutante sobreviviente sin dueño.
4. CI sube los dos reportes de cobertura en cada PR.
5. axe en verde sobre lo público, el proyecto de celular pasa, y hay una primera medición de rendimiento publicada.
6. El job de unit y arquitectura queda bajo 120 s, el de integración bajo 5 minutos en CI y la integración local bajo 10 minutos, con el antes y el después escritos en `testing.md`. Reescrito el 2026-09-04 con los números reales: el corte original (489 s a menos de 180 s, y 25 minutos a menos de 8) se midió con 325 tests de integración; hoy son 642 y el job de unit tarda 83 s, el de integración entre 203 y 286 s, y la integración local 9 minutos. El escalón que sigue, el arranque del host por clase, queda para cuando la suite duela.
7. No queda ningún `fixme` sin fecha, `retries` en CI es 0, y ningún test pasa al segundo intento sin quedar contado.
8. Ninguna pantalla pública dice `ítem`, y `check-docs` falla si vuelve.
9. `/health` del stage devuelve el sha del último merge a `main` y chequea sus dependencias; `/metrics` expone las señales de oro y el compose de producción trae el tablero y las alertas provisionados; las imágenes corren sin root y con procedencia; el runbook cubre los casos del stage; k6 tiene una corrida con sus umbrales en verde y sus números en el doc; el repo tiene Dependabot, CodeQL y el ruleset al día.

### Cierre (2026-09-07)

Las cuatro pistas mergeadas; la última, la pista 4, en el PR #467, cuyo merge fue la primera corrida real de la espera del sha: falló en el instante del cambio de contenedores, cuando Traefik contesta HTML y `jq` corta el step con su exit code, mientras el stage llegaba a `872c313` igual; el arreglo entra con R5. De los 51 issues quedan abiertos #403 y #404: el tramo con cuenta del recorrido (verificar desde Mailpit, reseñar, el backoffice) todavía no se corrió contra el stage, y pasa a R5 con `just stage-walk`. Sin medir: `k6/write.js`. Un flake de E2E apareció en la última corrida (dos navegaciones, 1 corrida roja de 4 sobre el mismo código) y queda registrado como issue ([#477](https://github.com/lucasidev/plan-b/issues/477)).

### Lo que R4 deja afuera a propósito

- Personas reales y todo lo que solo ellas exigen: mail y dominio reales, consentimiento (US-228, Ley 25.326), Anonimato (SC-013), el piso en el contrato antes de enviar (US-159). Es lo primero del sprint en que las haya.
- El hardening de Production, que ya está escrito y espera su propio deploy.

## R5 · Lo construido contra lo deseado

Desde el 2026-09-08, acotado a una semana. Milestone [R5](https://github.com/lucasidev/plan-b/milestone/7), issues #468 a #477, 62 pts en tres pistas.

**Por qué este hilo.** Cuatro sprints construyeron la máquina que convierte reseñas en fichas y R4 la puso en una URL con el corpus sintético. Nadie midió todavía la distancia entre eso y lo que la tesis y las 91 stories piden. R5 mide esa distancia sobre el stage, que es el hecho, y no sobre el código leído: con norma (la tesis, las stories con sus escenarios, el índice de pantallas, las garantías y las restricciones) y con evidencia (la ruta del stage o el recorrido E2E que la pisa). La revisión es inquisitiva: los recorridos de persona son pruebas manuales simuladas que preguntan si el recorrido se cumple de verdad, no automatizaciones que aprueban lo que el código hace; si la respuesta es que hay que reconstruir, se reconstruye, con el tamaño que tenga. Su salida es el backlog priorizado de R6, no features: un sprint de revisión crece solo, porque todo es hallazgo, y por eso está acotado en tiempo. Y lo que el producto necesita de fuentes oficiales no existe todavía ni en el modelo ni en pantalla, y no se scrapeó nada: la tercera pista releva qué es, dónde está y en qué formato, antes de escribir una línea.

### Pista 1 · El stage rellenado (12 pts)

Hoy el corpus vive en una materia con tres cátedras; una revisión sobre eso mira una materia, no un producto. Ficción declarada, como ya lo es el corpus sintético: sirve para ver cada pantalla en cada estado, nunca para mostrar una tracción que no existe.

| # | Tarea | Pts |
|---|---|---|
| [#468](https://github.com/lucasidev/plan-b/issues/468) · 1 | **Catálogo sintético para dos carreras**: la Tecnicatura entera con cátedras en cada materia y docentes con nombre, y la misma carrera canónica en una segunda universidad de las cuatro sembradas, para que "Dónde estudiarla" y las comparaciones tengan contra qué mirar. Listo cuando: cada materia de la Tecnicatura tiene al menos una cátedra con titular, y la segunda carrera existe con su plan. | 5 |
| [#469](https://github.com/lucasidev/plan-b/issues/469) · 2 | **Corpus que cubre los estados de la ficha**: en varias materias, cátedras arriba y abajo del piso, co-cursadas que publican y que no, una frase retirada con su corte de serie, texto libre en el campo libre para que la curaduría tenga qué leer, notas editoriales de carrera y de institución, y reseñas de las personas sembradas para "Mis reseñas". Listo cuando: cada estado que nombra la ficha de cada pantalla pública tiene al menos un ejemplo en el stage, y el reset (`down -v` y Deploy) lo rearma igual. | 5 |
| [#470](https://github.com/lucasidev/plan-b/issues/470) · 3 | **El recorrido para Copas sobre el stage rellenado**: `deploy.md` con los números nuevos, `just stage-walk` en verde contra el stage, y #403 y #404 cerrados con eso. | 2 |

### Pista 2 · La revisión (31 pts)

| # | Tarea | Pts |
|---|---|---|
| [#471](https://github.com/lucasidev/plan-b/issues/471) · 4 | **Cuatro recorridos de persona como E2E contra el stage**, en `frontend/e2e/_stage/`, junto al de Copas y con su misma regla (nunca en CI; `just stage-walk`): Valentina elige sin cuenta (la entrada, buscar, la materia y sus cátedras hermanas, de qué está hecho cada conteo, Método); Lucía reseña (la cuenta recién cuando la acción la pide, una materia sola en menos de dos minutos, ver que contó, editar y deshacer); Matías dice algo incómodo (el campo libre que no se publica, su nombre en ninguna pantalla, sacar lo suyo e irse); Sofía sostiene el catálogo (cargar una cátedra con su titular, curar una frase en un solo lugar, una nota editorial sin nombres). Son pruebas manuales simuladas, escritas a ciegas: quien las escribe recibe la persona, las stories de su recorrido y la URL del stage, no el código, y cada paso asierta lo que la persona espera (que la reseña contó, que su nombre no está en ninguna pantalla, que tardó menos de dos minutos), no lo que la pantalla hace. Un paso que el producto no cumple falla y queda así: el recorrido no se acomoda al código, y el verde no es el objetivo. Listo cuando: los cuatro corrieron contra el stage y cada paso está en el mapa como cumple o no cumple, con el fallo textual y el ID de la story cuando no cumple. | 13 |
| [#472](https://github.com/lucasidev/plan-b/issues/472) · 5 | **El mapa**: un registro en `docs/history/reviews/` con las 11 épicas y cada pantalla del índice en tres estados (construido, parcial, no construido), con su evidencia (la ruta del stage o el recorrido que la pisa) y la tabla de escenarios que da `check-scenarios` (hoy 91 escenarios en 20 stories: 73 confirmados, 18 no construidos, 0 rotos). Listo cuando: ninguna épica ni pantalla del índice queda sin estado, y cada "parcial" dice qué falta. | 8 |
| [#473](https://github.com/lucasidev/plan-b/issues/473) · 6 | **Hallazgos con destino**: cada hallazgo del mapa y de los recorridos termina en una story (nueva o existente, a Backlog), un ADR o una decisión de Lucas, con el índice de revisiones actualizado; y la lista priorizada de R6 en este tracker. Incluye la decisión que la revisión va a destapar primero: cómo llegan las diez primeras voces de una cátedra. Listo cuando: el registro no tiene hallazgos sin destino y R6 tiene su lista. | 5 |
| [#477](https://github.com/lucasidev/plan-b/issues/477) · 10 | **El click de envío que no dispara la acción**: cuatro corridas rojas de doce en CI el 2026-09-07, en cuatro specs distintos, y las trazas muestran que después del click final la página no emite ningún request (ni el POST del server action, ni navegación) mientras los clicks anteriores del mismo test sí cambian la pantalla. Reproducirlo en local bajo CPU cargada con `--repeat-each` y trazas, encontrar la causa (la hipótesis es un handler que todavía no está montado cuando se clickea, y React 19 no reproduce ese click) y dejar la corrección hecha si es del arnés, o planificada en R6 si es del producto. Es lo que el recorrido de Lucía tiene que atrapar: si clickea "Enviar la reseña" y no pasa nada, la reseña no existió. Listo cuando: hay una reproducción con tasa, la causa está escrita en el issue, y el arreglo está hecho o en la lista de R6. | 5 |

### Pista 3 · Los datos oficiales (19 pts)

La tesis (§5 y el punto 9 de "Qué recabamos") y ADR-0085 piden datos que no se le preguntan a nadie porque son públicos, publicados con fecha y fuente. No hay entidad, tabla ni pantalla para eso, y las stories que los consumen no entraron a ningún sprint; el [recorrido de Valentina](../history/reviews/2026-09-07-valentina-walk.md) lo dejó a la vista (V01, V02, V04). Decidido el 2026-09-07: R6 construye el modelo, la ficha de carrera con los datos y Dónde estudiarla; R5 releva a fondo para que R6 arranque construyendo y no adivinando.

| # | Tarea | Pts |
|---|---|---|
| [#474](https://github.com/lucasidev/plan-b/issues/474) · 7 | **Qué pide la tesis, campo por campo**: la tabla de datos oficiales (dura en el papel y dura en la realidad, egreso por cohorte, plan vigente, acreditación, régimen de ingreso; y del relevamiento oficial: actas, presupuesto, nómina docente) con la story que lo consume (US-127, US-128, US-129, US-130, US-133, US-174, US-182) y la pantalla donde se ve. | 3 |
| [#475](https://github.com/lucasidev/plan-b/issues/475) · 8 | **Las fuentes, una por una**: para cada campo, la fuente (SPU: la Síntesis de Información Universitaria y el sistema de consulta de estadísticas; CONEAU: las acreditaciones; AGN: los informes; el sitio institucional y el plan de estudios en PDF), con el link exacto, el formato real (dataset descargable, API, PDF, HTML), una muestra bajada a mano y guardada, la cadencia de publicación, las condiciones de uso, y el veredicto por campo: automatizable (importación o scraping), a mano, o no está publicado. Y el inventario de lo demás que cada fuente publica y la tesis no pidió (ingresantes y reinscriptos por año, vigencia y resolución de cada acreditación, aranceles, modalidad, sedes, lo que haya): cada dato extra con una línea de a qué persona le serviría y en qué pantalla, sin decisión; entra a un sprint solo cuando Lucas lo elija, y el filtro es la tesis (los datos oficiales van al lado de las voces, la institución no tiene número). Sin scrapear todavía. Listo cuando: ningún campo queda sin fuente ni sin veredicto, cada veredicto tiene su muestra, y el inventario de lo extra está escrito. | 8 |
| [#476](https://github.com/lucasidev/plan-b/issues/476) · 9 | **Las carreras sembradas, relevadas a mano**: la Tecnicatura en Desarrollo y Calidad de Software en UNSTA y la carrera más cercana en cada una de las otras tres universidades sembradas (UNT, Siglo 21, UTN FRT), con cada campo, su valor, su fecha y su fuente, y la cuenta de "dura en la realidad" y "egreso por cohorte" hecha a mano con su regla escrita (qué se divide por qué, de qué años) y sus sesgos, porque no están publicados como tales. Es la muestra de lo que el modelo de ADR-0085 tiene que guardar y de lo que Método tiene que explicar; de ahí sale, como ADR, la propuesta de modelo, de ficha de carrera y de Dónde estudiarla para R6. El modelo no son cinco columnas fijas: cada dato oficial es una afirmación con valor, unidad, alcance (carrera o institución), fuente, fecha y estado, para que lo que el relevamiento encuentre entre sin migrar el esquema. Listo cuando: las cuatro carreras tienen cada campo con valor, fecha y fuente (o "no publicado", con evidencia), la regla de los derivados está escrita, y el ADR está listo para que R6 arranque construyendo. | 8 |

### Lo hecho hasta ahora (2026-09-08)

**La pista 3 relevó y no adivinó.** Tres registros y un ADR: [campo por campo](../history/reviews/2026-09-07-official-data-fields.md) (#474: once datos, siete stories, cuatro pantallas, ninguna entidad), [las fuentes](../history/reviews/2026-09-07-official-data-sources.md) (#475: once fuentes con muestra guardada en `docs/history/reviews/assets/2026-09-07-official-data/`, veredicto por campo y el inventario de lo que publican de más) y [la oferta de Tucumán relevada a mano](../history/reviews/2026-09-07-official-data-survey.md) (#476: las 1914 filas de SIPES de las cinco instituciones con sede o llegada en la provincia, las cuatro ofertas de programación dato por dato, y la regla del proxy de egreso con sus sesgos). Lo que manda: **egreso por cohorte y duración real no están publicados por carrera en ninguna fuente pública**; la SPU publica por institución y por disciplina, su sistema de consulta por título ya no existe, CONEAU no acredita tecnicaturas y las privadas no publican transparencia. De ahí sale el [ADR-0090](../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md), propuesto: el dato oficial es una afirmación fechada con valor, unidad, alcance, fuente y estado (publicado, derivado, no publicado, pedido, no aplica), y las pantallas de R6 se dibujan sobre eso. Queda para que Lucas apruebe el modelo y las pantallas antes de que sea decisión. La Guía SIU, leída con un navegador automatizado, dio las 229 ofertas de pregrado y grado que se dictan en la provincia (seis instituciones: una que no estaba sembrada, y Siglo 21 sin sede en la lista), con duración y condición de ingreso por oferta. Sin cerrar: la búsqueda por institución de CONEAU no se automatizó, el filtro por organismo de la API de la AGN no se identificó, y el sitio de UTN Tucumán no respondió en toda la sesión.

**El mapa está escrito** ([registro](../history/reviews/2026-09-07-map.md), #472): ninguna épica construida entera; siete a medias y cuatro sin una línea de código (Pedir una carrera, Cuidar lo publicado, Responder, Moderar); 17 stories construidas, 20 parciales, 49 no construidas y 5 rebasadas; 8 pantallas construidas, 14 parciales, 12 no construidas, y cinco rutas que ninguna ficha describe. El núcleo (reseñar, que cuente, que nadie sepa quién fue, leer sin cuenta) está; lo que lo rodea es la lista de R6.

**El click que CI pierde no es el click** (#477). Las trazas reales de la corrida citada en el issue muestran que el click dispara, el server action corre y persiste (200), el fetch de navegación de `router.push` o `router.refresh` responde 200 con el dato ya actualizado, y el App Router de Next 15.5 nunca aplica esa respuesta al árbol ni a la URL. No es hidratación ni arnés: es el router. No se reprodujo en local (40 corridas sin carga, 40 con carga de CPU, 40 con `Emulation.setCPUThrottlingRate`), así que no hay arreglo verificable todavía; tres candidatos quedan para decidir (un fallback a `window.location` si la navegación no se aplica en una ventana acotada, bajar el prefetch de los links del shell, o un bug conocido de Next 15.x). La causa va al issue cuando Lucas lo apruebe.

**El stage rellenado está escrito y sin verificar** (#468 y #469): la Tecnicatura entera con cátedras y docentes, una segunda carrera en UTN-FRT con plan propio, y el corpus que cubre cada estado de la ficha, en siete archivos del backend que todavía no se commitearon. El relevamiento de la pista 3 abrió una decisión antes del commit (K01 del [relevamiento](../history/reviews/2026-09-07-official-data-survey.md)): la segunda carrera del seed es una "Tecnicatura Universitaria en Desarrollo y Calidad de Software" ficticia en UTN, y la real de UTN es la Tecnicatura Universitaria en Programación.

### Secuencia

La pista 1 va primero: los recorridos y el mapa se hacen sobre el stage rellenado, no sobre el de hoy. En la pista 2, los recorridos (4) y el mapa (5) corren en paralelo y alimentan a 6, que cierra el sprint. La pista 3 es lectura y relevamiento, sin código: corre en paralelo con todo.

### Cómo se sabe que R5 está listo

1. El stage muestra cada pantalla pública en cada estado que su ficha nombra; el recorrido para Copas corre en verde contra él, y los cuatro recorridos de persona corrieron contra él con cada paso en el mapa como cumple o no cumple: ahí el verde no es el objetivo.
2. El registro de revisión existe con las 11 épicas y todas las pantallas del índice en tres estados con evidencia, la tabla de escenarios, y ningún hallazgo sin destino; el índice de revisiones lo lista.
3. R6 tiene su lista priorizada en este tracker, y la decisión de las diez primeras voces está tomada o pendiente con dueño.
4. La tabla de datos oficiales tiene fuente, formato, cadencia, condiciones de uso y una muestra por campo, y el inventario de lo que las fuentes publican de más; las cuatro carreras sembradas están relevadas a mano con valor, fecha y fuente por dato; la regla de los derivados está escrita; y el ADR con la propuesta de modelo, ficha y Dónde estudiarla está listo para R6.
5. R5 no construyó ninguna feature del producto: lo que la revisión encontró es backlog, no código.
6. El click que no dispara la acción (#477) tiene reproducción con tasa y causa escrita, y su arreglo está hecho o en la lista de R6.

### Cierre (2026-09-08)

Las tres pistas mergeadas en dos PRs: #479 (el `jq` de la espera del sha, que en su primer merge real terminó con "Redeploy the stage: success" y el stage en `d5aa283`) y #480 (los seeds, el mapa, los tres registros de la pista 3 y el ADR-0090), con Rebase and merge. El stage sirve `1544eb3` con el corpus nuevo, verificado en lo público: la cobertura de la Tecnicatura pasó de "1 de 21" a "4 de 21 materias", la entrada sortea cátedras nuevas, y la segunda corrida de Valentina sobre el stage rellenado repitió las mismas nueve fallas de la primera, todas del producto y ninguna del corpus. De los diez issues quedan #470 (el tramo con cuenta de `just stage-walk`, que corre Lucas con las credenciales del stage en su shell) y #473, que cierra con este plan: cada hallazgo de R5 tiene su destino en la tabla de R6 y su estado cambiado en su registro. Los cinco puntos de "cómo se sabe que está listo" se cumplen salvo el tramo con cuenta, que queda en la pista 4 de R6.

Lo que R5 decidió (2026-09-08): **desde R6 la única ficción son los alumnos**. Las instituciones, las carreras, los planes y los datos oficiales del stage salen de las fuentes relevadas, no del seed; las reseñas siguen siendo sintéticas y la entrada lo dice. **Las diez primeras voces de una cátedra llegan a mano**, cátedra por cátedra, empezando por la Tecnicatura de UNSTA: el producto no baja el piso ni inventa voces, y la ficha vacía ya explica qué falta (US-136). **El checklist de transparencia es una story nueva** (F01), no una ampliación de US-128 o US-133. **Las cinco rutas sin ficha** se documentan: la curaduría con ficha propia, y las otras cuatro como sub-rutas de las fichas del Catálogo y de la Ficha de carrera (E02). Y el [ADR-0090](../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md) pasa a aceptado con su modelo y sus pantallas.

### Lo que R5 deja afuera a propósito

- El modelo de datos oficiales, la ficha de carrera con ellos y Dónde estudiarla: se construyen en R6 con la muestra y el ADR de la pista 3 (decidido el 2026-09-07).
- Personas reales y todo lo que solo ellas exigen, lo mismo que dejó afuera R4.
- El compose de producción, escrito y sin levantar: espera su servidor.
- Reconstruir lo que los recorridos muestren mal hecho: se planifica en R6 con el tamaño que tenga, aunque sea rehacer una épica entera.

## R6 · Elegir dónde estudiar, con datos reales

Del 2026-09-09 al 2026-09-22, dos semanas. Milestone [R6](https://github.com/lucasidev/plan-b/milestone/8), issues #481 a #497, #506 y #507, 70 pts en cuatro pistas.

**Por qué este hilo.** R5 midió la distancia entre la tesis y el stage y encontró que el núcleo está (reseñar, que cuente, que nadie sepa quién fue, leer sin cuenta) y que lo que lo rodea no: Valentina no puede elegir dónde estudiar porque no hay datos oficiales, no hay Dónde estudiarla y el buscador no encuentra carreras (V01, V02, V04). El relevamiento de la pista 3 mostró además que ningún dato de carrera viene de una sola fuente ni con una sola forma, y que los dos que más importan (egreso por cohorte y duración real) no están publicados por carrera. R6 construye lo que la persona para la que el producto existe necesita para elegir, sobre el modelo del [ADR-0090](../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md) y sobre el catálogo real de Tucumán: **desde acá la única ficción son los alumnos**. Instituciones, carreras, planes y datos oficiales salen de las fuentes relevadas; las reseñas siguen siendo sintéticas, y la entrada lo dice.

### Pista 1 · Los datos oficiales en el producto (40 pts)

| # | Tarea | Pts |
|---|---|---|
| [#481](https://github.com/lucasidev/plan-b/issues/481) · 1 | **El modelo del ADR-0090**: `AcademicUnit` y `OfficialFact` en academic, con migración, read Dapper para las fichas y endpoint de carga con policy de admin y fuente obligatoria (US-194, US-202); `Career.DurationYears` y `CareerPlan.IsOfficial` se retiran cuando sus afirmaciones existen (F03, F04, F06, K04). Listo cuando: una afirmación con cada estado del ADR se guarda, se lee y se ve con su fuente. | 8 |
| [#482](https://github.com/lucasidev/plan-b/issues/482) · 2 | **El catálogo real de Tucumán**: las seis instituciones de la Guía SIU como entidades reales con su identidad; la oferta de programación con sus planes reales (la Tecnicatura de UNSTA ya lo es; UTN Tucumán con la Tecnicatura Universitaria en Programación y el plan de la Ordenanza 987 hasta que el plan 2024 se pueda bajar; UNT con Programador Universitario y el plan de la FACET; Siglo 21 con el Analista Universitario en Sistemas de Computación); el resto de la oferta de pregrado y grado de la Guía cargada como carreras con su duración y su condición de ingreso; la carrera ficticia de UTN retirada, y la entrada dice que las reseñas son sintéticas (K01, K02, K05, US-195). Listo cuando: ninguna institución, carrera ni plan del stage es inventado, y el reset lo rearma igual. | 8 |
| [#483](https://github.com/lucasidev/plan-b/issues/483) · 3 | **Las afirmaciones relevadas, cargadas**: los datos de las cuatro ofertas de programación y de las seis instituciones del [relevamiento](../history/reviews/2026-09-07-official-data-survey.md), por seed y por el backoffice, cada uno con su estado y su fecha; el pedido de egreso y duración real al DIU y a las universidades nacionales, registrado como "pedido" con fecha (O01, O07, O10, O11, K07). Listo cuando: cada dato del relevamiento está en el stage con la misma fuente que en el registro. | 3 |
| [#484](https://github.com/lucasidev/plan-b/issues/484) · 4 | **La ficha de carrera con sus datos**: el bloque de datos oficiales con fuente y período por dato, el régimen de ingreso, y la acreditación o la validez nacional según el nivel (US-127, US-133, US-130; V01, F02, F05, O03), con los escenarios de US-127 y US-133 reescritos con el dato como criterio (E01). Listo cuando: Valentina lee los seis datos de la Tecnicatura de UNSTA con su fuente, y lo no publicado se dice con fecha. | 5 |
| [#485](https://github.com/lucasidev/plan-b/issues/485) · 5 | **Dónde estudiarla**: la misma carrera canónica en las instituciones de la ciudad, con la localidad que normaliza la tarea 19 y caída a la provincia cuando no se pudo resolver; seis datos con la misma forma por tarjeta y cada celda con su estado, sin compuesto ni ganador; la carrera canónica la declara el equipo (US-128, US-195; V02, K02, K03). Listo cuando: la Tecnicatura de UNSTA se compara con las ofertas de UNT, UTN y Siglo 21 y la pantalla dice qué es cada una. | 6 |
| [#486](https://github.com/lucasidev/plan-b/issues/486) · 6 | **La ficha de institución**: cabecera de identidad y checklist de transparencia con una fila por campo y su estado, "no publicado" y "no informado" dichos con fecha, y "Ver fuentes"; la story nueva del checklist (F01), y la auditoría de la AGN que trae la tarea 18 (E05, O04, O06, K07). Listo cuando: las seis instituciones tienen su ficha y UNT muestra su nómina, su presupuesto y su boletín con link. | 4 |
| [#506](https://github.com/lucasidev/plan-b/issues/506) · 18 | **La auditoría de la AGN, por su API**: paginar `webagnapi.agn.gob.ar/api/views/busqueda_avanzada/informes` entero y filtrar por `organismo_auditado` en local, porque los `filter[...]` de JSON:API no filtran esa vista, y volcar el resultado como afirmaciones del ADR-0090 con su estado y su fecha; sin informes es "no publicado" con la fecha de consulta, y una consulta que falla no deja el dato a medias (O08). Listo cuando: las instituciones del catálogo tienen su afirmación de auditoría con su fuente y su fecha. | 3 |
| [#507](https://github.com/lucasidev/plan-b/issues/507) · 19 | **Las sedes, normalizadas contra Georef**: el domicilio de la Guía del SIU trae la ciudad adentro de la cadena y escrita como venga, y Dónde estudiarla se define por ciudad; resolver las nueve localidades de las 229 ofertas contra `apis.datos.gob.ar/georef` al cargar (siete por `/localidades`, las dos rurales por `/asentamientos`) y guardar el id y el nombre canónico junto al domicilio crudo. Sin resolución la comparación cae a la provincia y lo dice; es lo que la tarea 5 necesita para comparar por ciudad y no por provincia (V02). Listo cuando: Dónde estudiarla compara las ofertas de San Miguel de Tucumán entre sí sin mezclarlas con las de Concepción. | 3 |

**Las dos APIs que consumimos.** Las tareas 18 y 19 son las únicas del producto que traen datos de un servicio de terceros en vivo, y son la respuesta al pedido del enunciado de consumir APIs. Que sean dos, y que de las once fuentes oficiales que relevó R5 una sola exponga una API, no es una limitación del sprint: es el hecho que la tesis argumenta sobre la opacidad, y va dicho en Método.

### Pista 2 · Elegir de verdad (10 pts)

| # | Tarea | Pts |
|---|---|---|
| [#487](https://github.com/lucasidev/plan-b/issues/487) · 7 | **Buscar encuentra carreras e instituciones** (US-132; V04). Listo cuando: "Desarrollo y Calidad de Software" devuelve la carrera y "UNSTA" la institución. | 3 |
| [#488](https://github.com/lucasidev/plan-b/issues/488) · 8 | **Explorar por carrera**: la segunda lente, y `/careers` y `/subjects` dejan de responder 404 (US-222; V03, V11). | 3 |
| [#489](https://github.com/lucasidev/plan-b/issues/489) · 9 | **De la ficha al docente y del plan a la ficha**: el nombre del docente lleva a su página, y la lista de materias del plan marca cuáles tienen ficha (US-134; V06, V10). | 3 |
| [#490](https://github.com/lucasidev/plan-b/issues/490) · 10 | **La ficha no desborda en celular**: el buscador del header entra en 393 px (V13). | 1 |

### Pista 3 · Reseñar sin fisuras (12 pts)

| # | Tarea | Pts |
|---|---|---|
| [#491](https://github.com/lucasidev/plan-b/issues/491) · 11 | **El click que el router pierde** ([#477](https://github.com/lucasidev/plan-b/issues/477)): el fallback a `window.location` cuando la navegación no se aplica en una ventana acotada, y el prefetch del shell autenticado apagado, medidos con repeticiones bajo carga antes y después; si la causa aparece en el tracker de Next, se cita. Listo cuando: doce corridas seguidas de los cuatro specs sin la firma. | 5 |
| [#492](https://github.com/lucasidev/plan-b/issues/492) · 12 | **La puerta dice el motivo y vuelve**: Ingresar desde "Reseñala" dice para qué, y después de verificar el mail aterriza en la reseña que había empezado (US-229; L01, L03). | 3 |
| [#493](https://github.com/lucasidev/plan-b/issues/493) · 13 | **El contrato dice el piso y el duplicado no se envía** (US-159, US-163; L04, L06). | 2 |
| [#494](https://github.com/lucasidev/plan-b/issues/494) · 14 | **Mis aportes por frase**: la opción elegida en cada frase y las voces que suma (US-162; L05). | 2 |

### Pista 4 · Verificar y ordenar (8 pts)

| # | Tarea | Pts |
|---|---|---|
| [#495](https://github.com/lucasidev/plan-b/issues/495) · 15 | **Los recorridos sobre lo nuevo**: Valentina y Lucía repetidos contra el stage con lo construido, con lo que el arnés dejó sin ejercer (Corregir, cerrar sesión, la baja y el conteo después de borrar: L08) y la fama y la comparación sobre Ibáñez (V05, V12); y el tramo con cuenta de `just stage-walk` sobre el stage rellenado ([#470](https://github.com/lucasidev/plan-b/issues/470)). | 4 |
| [#496](https://github.com/lucasidev/plan-b/issues/496) · 16 | **Las fichas que faltan y la postura de Método**: SC-036 Curaduría para `/admin/curation`; `/admin/chairs` y `/admin/teachers` documentadas en SC-027, y `/careers/[id]/plans` y `/plans/[id]/subjects` en SC-001 (E02); Método dice que no hay acuerdos con instituciones (US-185, V14). | 2 |
| [#497](https://github.com/lucasidev/plan-b/issues/497) · 17 | **El cierre de R5 en cada registro** ([#473](https://github.com/lucasidev/plan-b/issues/473)): cada hallazgo de R5 con su estado cambiado en su registro y el índice al día, y el glosario con Cohorte y Datos oficiales al modelo del ADR (F04). | 2 |

### Los hallazgos de R5, con destino

| Destino | Hallazgos |
|---|---|
| Tarea 1 | F03, F04, F06, K04 |
| Tarea 2 | K01, K02, K05, S05 (US-195) |
| Tarea 3 | O01, O07, O10, O11, K07 |
| Tarea 4 | V01, E01, F02, F05, O03 |
| Tarea 5 | V02, K03 |
| Tarea 6 | E05, F01, O04, O06 |
| Tarea 18 | O08 |
| Tarea 19 | la geografía que V02 necesita |
| Tareas 7 a 10 | V04; V03 y V11; V06 y V10; V13 |
| Tareas 11 a 14 | #477; L01 y L03; L04 y L06; L05 |
| Tareas 15 a 17 | V05, V12, L08 y #470; E02 y V14; E04 |
| Resuelto | V09 (#469) |
| Cerrados | O02, O05 |
| Confirmaciones | O09, K06 |
| Backlog, con nombre | V07 (US-167), V08 (US-180), L02 (personas reales, US-228), L07 (US-161), S01 (Pedir una carrera y la cola: US-139 a US-142, US-191, US-192, US-200, US-203), S02 (US-196), S03 (US-199), S04 (US-216, US-218), el resto de S05 (US-193, US-194, US-197, US-202, US-204), S06 (con la decisión abierta), E03 (las cuatro épicas), E06 (los mails de producto) |

### Secuencia

La pista 1 manda: 1 y 2 arrancan juntas; 3 detrás de 1; 4, 5 y 6 detrás de 3. Las dos que consumen APIs entran donde las necesita su consumidor: 19 detrás de 2 y antes de 5, porque sin la localidad normalizada la comparación no se puede agrupar; 18 detrás de 1 y junto a 6. La pista 2 corre en paralelo desde el primer día. La 3 también, con 11 primero porque todo E2E depende de él. La 4 cierra el sprint.

### Cómo se sabe que R6 está listo

1. Valentina, sin cuenta, elige entre la Tecnicatura de UNSTA y las ofertas de UNT, UTN y Siglo 21 leyendo datos oficiales con su fuente, y ninguna institución, carrera ni plan del stage es inventado.
2. Lo no publicado se dice con fecha en cada ficha, y Método explica el proxy de egreso y sus sesgos.
3. El producto consume dos APIs de terceros: la de la AGN para saber si una institución fue auditada, y Georef para saber en qué ciudad está cada sede. Las dos con su fecha de consulta y sin tumbar la pantalla cuando no responden.
4. El buscador devuelve carreras e instituciones, y Explorar tiene las dos lentes.
5. Lucía entra desde la acción con el motivo, vuelve a la reseña, el contrato dice el piso y Mis aportes muestra qué sumó cada frase.
6. Doce corridas seguidas de los cuatro specs sin la firma de #477.
7. Los recorridos corrieron sobre lo nuevo y el tramo con cuenta de `just stage-walk` pasó.

### Lo que R6 deja afuera a propósito

- Pedir una carrera y su cola, Responder, Moderar sin romper el producto y Cuidar lo publicado: cuatro épicas enteras, al Backlog con nombre.
- Los mails de producto (E06), la reseña a medias (L07), el equipo docente desde la pantalla (S02), la cola de revisión de lo destilado (S03) y quién hizo qué en pantalla (S04).
- Los planes con materias de las 229 ofertas de la provincia: solo los de programación entran; el resto se carga como carrera con su duración y su condición de ingreso.
- Personas reales, y producción.

## Lo anterior: el producto en retiro

Todo lo que sigue, de S0 a S12, es el planificador de cuatrimestre. Se conserva como historia y no se edita.

---

## S0 (pre-sprint) ✓ Done

**Rango**: hasta 2026-04-25 (todo el trabajo previo a la formalización del cycle de sprints).

**Foco**: foundations del repo, modelo DDD, primer slice end-to-end de Identity.

### Entregables documentales

- **33 ADRs** (`docs/decisions/`) cubriendo decisiones de dominio, arquitectura, frontend, tooling, workflow y outcomes recientes del DDD discovery (ADR-0063 a ADR-0033).
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

- ADR-0063 Reseñas opcionales + premium features como reward (no gating del simulador).
- ADR-0063 Bounded Context Planning separado.
- ADR-0030 Cross-BC consistency vía Wolverine outbox.
- ADR-0063 ReviewAuditLog como projection.
- ADR-0063 Edit destructive de EnrollmentRecord invalida Review.
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

**Sesión de rediseño UX (post-S1, 2026-05-02)** generó 3 ADRs (ver [ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md)):
- [ADR-0039](../decisions/0039-meilisearch-as-the-global-search-engine.md): Meilisearch como motor de búsqueda global.
- [ADR-0040](../decisions/0040-notifications-as-a-new-bounded-context.md): Notifications como BC nuevo.
- [ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md): Delta del rediseño + plan de migración.

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
  - **1 ADR nuevo**: [ADR-0042](../decisions/0042-audit-log-per-bc-not-central.md) (audit log per-BC, no central; extiende ADR-0063).
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

- **US-016 no necesita todavía el BC `Planning`**: su propio AC dice "no persiste nada: solo computación de read models" ([ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md)). El aggregate `SimulationDraft` recién hace falta para guardar simulaciones (US-023), que [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md) define como premium. S10 es read models Dapper cross-schema, un domain service de cumplimiento de correlativas, y conectar el shell que ya existe.
- **El histograma de combinaciones similares entra completo**, con un riesgo asumido explícito: el AC lo define como exact match del subject set agrupando alumnos que cursaron la misma combinación, y con el corpus actual cada combinación va a tener muestras de 0 o 1 alumnos. Es una limitación de **volumen de datos, no de implementación**: el panel se va a ver vacío hasta que haya corpus real. Si se lo necesita poblado para una demo, sembrar enrollments realistas es trabajo aparte, a decidir por separado.
- **Las premium de planificación quedan fuera**: US-023 (guardar draft), US-024 (compartir), US-025 (editar), US-026 (borrar), US-027 (ver públicas). Entran cuando el simulador base esté validado con usuarios reales, no antes.
- **El backoffice restante se difiere a S11**: US-065 y US-067 quedaron **parciales** en S7 y US-081 nunca aterrizó su dashboard (los tres detectados en la auditoría de docs del 2026-07-20). Es valor para el operador, no para el alumno, así que va después del simulador.
- **Descubrimiento (US-056 Meilisearch + US-057 rankings) se difiere a S12**: gana valor cuando ya haya corpus y catálogo completos, y US-056 además suma infraestructura nueva.

### Cierre (2026-07-26)

Las tres US entraron:

- **US-016** hecho: módulo `Planning` con el endpoint de evaluación de la combinación (materias disponibles/bloqueadas por correlativas + carga semanal + dificultad ponderada por reseñas + pass-rate de la cohorte con su muestra mínima anti re-identificación, fijada en el código) y el panel de métricas del `/plan` cableado a datos reales. Lo que queda mock en `/plan` es "En curso"/"Borradores", que es US-023 (premium, fuera de scope).
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

- **La forma de los `ítems` del borrador quedó abierta**: hoy es tabla hija (`simulation_draft_items`), pero el data-model había definido un array desnormalizado, y el borrador se lee y se escribe entero (un documento embebido también encaja). Marcado como abierto en [`architecture/data-model.md`](../engineering/data-model.md).
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
  se retira con el planificador. La doctrina de su ADR (gate por cobertura, ADR-0085) queda
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
| [US-015](../history/domain-v1/stories/US-015.md) | El `PATCH` de una cursada propia, con revalidación de invariantes y el evento que manda a `under_review` la reseña afectada (ADR-0063). Enabler del resto. |
| [US-097](../history/domain-v1/stories/US-097.md) | El momento del cierre: qué cursadas están pendientes, qué se le pregunta al alumno (incluido el método de aprobación) y el handoff a la reseña. |
| [US-098](../history/domain-v1/stories/US-098.md) | El agregado por (materia, comisión) y su lectura en el picker, con la vigencia del plantel medida contra `reviewed_teacher_name`. |
| [US-099](../history/domain-v1/stories/US-099.md) | La reseña simple, una sola pregunta y sin docente, ofrecida al confirmar el import de historial. Siembra corpus el día uno en vez de esperar un cuatrimestre. |

### Decisiones de producto que definen el sprint

- **La unidad de decisión es (materia, comisión), no (materia, docente).** El alumno se inscribe en una comisión; el docente es lo que esa comisión tiene este cuatrimestre. El riesgo de que el agregado envejezca cuando el docente cambia se mide, no se esconde: cada reseña guarda siempre el nombre del docente que nombró (ADR-0082), así que las reseñas reconstruyen el plantel histórico que el catálogo no tiene.
- **La app planifica, no lleva el historial.** El registro académico oficial vive en la plataforma de la universidad. Lo que ella no da, y esto sí, es la complejidad de una materia, la carga resultante de juntar varias, y las valoraciones.
- **El método de aprobación se pregunta en el cierre, nunca en la carga retroactiva.** En el cierre el alumno se acuerda; tres años después inventaría.
- **La reseña de carga tardía no nombra docente, y es decisión.** De una materia vieja se recuerda cuánto costó, no cuál de los tres docentes tocó. Eso además deja sin entradas la cola de resolución de referencias del punto 4 de ADR-0082, que por ahora no hace falta construir.

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
- Edit destructive de EnrollmentRecord invalida Review (ADR-0063).

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
