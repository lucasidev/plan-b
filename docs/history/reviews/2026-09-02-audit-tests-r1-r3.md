# Auditoría de tests del rework, R1 a R3 (2026-09-02)

> Registro de auditoría ([índice](README.md)). **Alcance**: lo construido en R1, R2 y R3, o sea las 18 stories que el código cita, contra tres normas: la pirámide de [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md) y [`testing.md`](../../engineering/testing.md), la regla de que el test cita el escenario que cubre ([ADR-0072](../../decisions/0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)), y las [restricciones del producto](../../product/README.md#restricciones-los-requisitos-no-funcionales-del-producto) que el [DoD](../../plan/definition-of-done.md) exige sostener. **Método**: conteo mecánico sobre el repo (scripts de una pasada, no se guardan), cobertura de líneas medida con `dotnet-coverage` y `@vitest/coverage-v8`, y lectura de cada test contra los escenarios de 13 stories. Lo que salió de un script se dice como número; lo que salió de leer se dice como lectura.

Estados: **Resuelto** (con el commit o PR), **Cerrado** (una decisión lo cerró), **Pendiente** (espera una decisión de Lucas), **Descartado** (con la razón), **Confirmación** (no era hallazgo).

## Qué se encontró, en una línea

La suite es grande y verde, y está desbalanceada: el dominio tiene entre 86 y 93 % de líneas cubiertas y casi la mitad de sus tests son caminos negativos, pero la capa de aplicación se prueba casi solo por integración, las pantallas del corazón del producto tienen 0 % en vitest, y los escenarios escritos en cada story casi nunca son lo que los tests verifican: 9 de 75 los citan.

## Los números

| Capa | Tests | Cobertura de líneas | Negativos o borde (por nombre) |
|---|---|---|---|
| Dominio, unit | 562 (identity 189, academic 227, reviews 146) más 26 del shared kernel | identity 91 %, academic 86 %, reviews 93 % | 36 %, 55 %, 48 % |
| Handler, unit | identity 10 archivos sobre 21 features; academic 4 sobre 12; reviews 1 sobre 12 | aplicación: identity 14 %, academic 9 %, reviews 1 % (solo lo que tocan los unit) | |
| Integración | 325 (identity 106, academic e infra 146, reviews 73); 90 de 91 endpoints con test | medido sobre el área Reviews sola (73 tests bajo instrumentación): Reviews.Application 89 %, Reviews.Infrastructure 99 %, Reviews.Domain 78 %; el único archivo de aplicación en 0 % es código muerto (Q12) | 19 % |
| Arquitectura | 27 casos sobre 9 reglas de frontera | | |
| Frontend, vitest | 514 en 49 archivos (26 de componentes, 10 de actions, 13 de schema o lib) | 27 % de líneas, 67 % de ramas | 68 % |
| E2E | 72 en 25 specs: 69 pasan y 3 están en `fixme` desde el 25 de mayo | | 42 % |

En total, 1.526 tests. La distribución de los 514 de vitest: 292 están en los cuatro CRUD del backoffice heredado (carreras 98, materias 97, períodos 53, universidades 44); reseñar, la ficha de cátedra, la de materia, mis reseñas y la curaduría tienen cero.

Cobertura de vitest por área, las peores primero, con al menos 60 líneas: `app` 0 %, `write-review` 0 %, `chair-facts` 0 %, `subject-facts` 0 %, `my-reviews` 0 %, `verify-email` 0 %, `reset-password` 0 %, `manage-chairs` 0 %, `manage-teachers` 0 %, `curation` 4 %, `settings` 15 %, `components/layout` 17 %. Las mejores: `components/facts` 98 %, `deactivate-account` 94 %, `home` 92 %, `method` 89 %, `career-facts` 87 %, `sign-in` 82 %, `landing` 80 %.

## Trazabilidad: escenario declarado, test que lo cita, test que lo ejerce

Las 18 stories que el código cita tienen 75 escenarios E/N declarados en sus `scenarios.md`, más 42 casos borde. Los tests citan 9. Leyendo test por test, el cuadro es este ("ejercido" es lectura de los nombres y, en los casos marcados, del cuerpo del test):

| Story | E/N | Citados | Ejercidos | Sin test | Lo que no está construido |
|---|---|---|---|---|---|
| US-146 Reseñar en menos de cinco minutos | 2 | 0 | E1, N1 | borde del doble click (el 409 del backend existe; el doble click de la UI no) | |
| US-147 Reseñar una materia sola | 2 | 0 | E1 | N1 (tildar dos materias), borde de materia sin resultados | US-160 |
| US-148 Que nadie sepa que fui yo | 2 | 0 | E1, N1 y los dos bordes | | |
| US-165 Editar o borrar lo que dije | 7 | 0 | E1, N1, N3 | E2, E3, N4 parcial; N2 | el aviso de N2 y la reseña pendiente de vincular |
| US-166 La baja anonimiza | 9 | 0 | E1 y N4 en `DeactivateAccountEndpointTests` (la fila sobrevive anonimizada, el mail se puede volver a usar, 409 si ya estaba); E3, N5, N6 en vitest (el modal y la confirmación); N1 parcial (el 204 borra las cookies) | **E2: que lo aportado siga contando después de la baja, la promesa de ADR-0044, no tiene test**; N3 (el reenganche anual se apaga) | N2 es de US-165 |
| US-130 Ver cómo se calcula cada número | 6 | 0 | E4, N1, los dos bordes | E1, E2, E3, E5: son copy, ningún test lee el texto | |
| US-231 Ver si lo que reseñé sirvió | 7 | 1 | E1, E3, N1, N3 | E2 (cobertura de la carrera en Inicio), N2, N4 | |
| US-221 Ver el instrumento andando al llegar | 4 | 0 | E1, E3, N1 | E2 (rotación entre varias fichas) | los tres bordes están sin decidir |
| US-129 Atribuir a la carrera o a la institución | 4 | 0 | E1, N1 | | E2, E3 (datos oficiales, ADR-0085) |
| US-134 Ver la cobertura detrás de la tarjeta | 4 | 0 | E1, N1 parcial, borde del piso exacto | E2, E3, bordes del plan reformado y de dos cátedras | |
| US-196 Cargar la cátedra desde el backoffice | 4 | 2 | E1, E2, E3, borde de cátedras en paralelo | | N1 y el borde de verificación son de US-210 |
| US-143 Ver con qué se llevó la materia | 3 | 1 | E1, N1, N2 y los dos bordes | | |
| US-198 Curar la frase en un lugar | 5 | 5 | los 5 y 4 bordes | | |
| US-155 Preguntar el año de ingreso una vez | 2 | 0 | E1 parcial (action) | N1 | |
| US-127 Ficha de carrera | 4 | 0 | E1 parcial vía US-134 | | E2, E3 (datos oficiales) |
| US-132 Buscar | 3 | 0 | E1 por `SearchEndpointTests`, que no la cita | E2, N1 | |
| US-197 Vincular la materia declarada a la canónica | 4 | 0 | | | entera (la canónica no existe) |
| US-204 La reforma no parte el corpus | 3 | 0 | | | entera |

Leído de la tabla: de 75 escenarios, 9 citados, alrededor de 38 ejercidos por algún test, alrededor de 22 sin test aunque la funcionalidad existe, y alrededor de 15 describen cosas que no están construidas. El archivo de escenarios no distingue las dos últimas, y esa es la mitad del problema: leído solo, dice que 22 y 15 son lo mismo.

## Hallazgos

| ID | Hallazgo | Severidad | Estado |
|---|---|---|---|
| Q01 | **Los escenarios no gobiernan los tests.** ADR-0072 dice que cada "listo cuando" se traduce al test que lo verifica y el test cita el ID. Pasa en una story de 18 (US-198) y parcialmente en tres. El resto se probó por intuición del que construyó: bien en general (38 ejercidos), pero con 22 escenarios sin test que nadie sabía que faltaban, porque nada los cuenta. | alta | Pendiente: decidir la regla (cada E/N tiene test que lo cita, o la story lo marca como no construido) y el script que la cuente |
| Q02 | **La aplicación se prueba solo con Postgres.** Reviews tiene 1 test de handler sobre 12 features; academic, 3 sobre 12. Handlers con lógica real (publicar una reseña, abrir un código nuevo, armar la ficha) solo corren dentro de la suite de integración, que tarda 29 minutos y se corre por área. Es lo contrario de la regla de `testing.md` ("subir un nivel solo si el inferior no alcanza"). | alta | Pendiente |
| Q03 | **Las pantallas del corazón tienen 0 % en vitest.** Reseñar, ficha de cátedra, ficha de materia, mis reseñas, curaduría, verificar mail, reset. Solo el E2E las toca, y el E2E prueba un recorrido, no los estados de cada pantalla: un copy roto, un estado de error o un piso mal dicho pasan. Mientras tanto, 292 de los 514 tests de vitest están en cuatro CRUD del backoffice heredado. | alta | Pendiente |
| Q04 | **Catorce tests de integración leen el body sin afirmar el status.** Un 500 los deja en verde (es el patrón que ya pegó una vez en `#393`). Están en `CareerPlanImportQueue` (2), `Search` (1), `SubjectsAndTermsCatalog` (2), `GetCareerFacts` (1), `GetChairFacts` (2), `GetCurrentInstrument` (1), `GetMyReviewedChairs` (3), `GetSubjectFacts` (1), `MyReviews` (1). | media | Pendiente: mecánico, entra a R4 |
| Q05 | **El guard anti-puntaje recorre dos rutas.** `path-to-the-ficha.spec` promete que "ninguna pantalla pública muestra un promedio, una estrella ni un testimonio" y visita `/` y una página de docente. Las fichas de cátedra, materia y carrera, que son lo que la tesis publica, no pasan por él. | media | Pendiente: entra a R4 |
| Q06 | **Ninguna restricción del producto tiene test.** WCAG 2.2 AA, celular chico, rendimiento de lo público: están en el DoD de cada story y no hay axe, ni viewport móvil en Playwright, ni ninguna medición. Se firman en cada PR sin verificarse. | media | Pendiente |
| Q07 | **Tres E2E en `fixme` desde el 25 de mayo**: dos de Mi perfil y uno de Ajustes. Las pantallas siguen en el producto. Tres meses sin su test es lo mismo que no tenerlo, con la diferencia de que el reporte dice "skipped" y parece decidido. | media | Pendiente: arreglar o borrar |
| Q08 | **ADR-0036 promete tracking de cobertura y no hay ninguno.** "Coverage gates: no. Tracking sí (subir reports a artifacts)". CI sube resultados de tests y logs; ningún reporte de cobertura, y hasta hoy no había tooling para generarlo. Para esta auditoría se instaló `dotnet-coverage` (global, fuera del repo) y `@vitest/coverage-v8@2.1.9` (queda en `package.json`, sin commitear). | baja | Pendiente: decidir si el tooling queda y CI sube el reporte |
| Q09 | `EditorialNote` (reviews) y `UserSettings` (identity) son aggregates sin test de dominio. `GET /api/reviews/publishing-rules` es el único endpoint sin test de integración: lo cubre solo el E2E de Método. | baja | Pendiente |
| Q10 | Nueve rutas sin rastro en ningún E2E: `/admin/teachers` y sus dos hijas, `/admin/universities/new`, `/teacher-claim`, `/verify-teacher`, `/design-check`, `/maintenance`, `/offline`. Las de docente y claim son del modelo anterior y su destino no está decidido. | baja | Pendiente |
| Q11 | La heurística de negativos da 19 % en integración contra 36 a 55 % en dominio. Es coherente con la pirámide (los sad paths viven abajo), pero los 400 y 403 por endpoint no son sistemáticos: solo curaduría y cátedras los tienen completos. | baja | Pendiente |
| Q12 | Tres restos: `just db-seed` llama a un verbo `seed` que el host no tiene; el workflow `test-gaps` lista `enrollments` y `moderation`, que se podaron; y `Planb.Reviews.Application/Constants/AllowedTags.cs` es la taxonomía de tags del modelo anterior (US-089), sin una sola referencia en el código. | baja | Pendiente: entra a R4 |
| Q13 | **Lo que está bien, medido**: el dominio entre 86 y 93 % con caminos negativos de verdad; 90 de 91 endpoints con test de integración; 62 aserciones de 401 o 403; la regla de ADR-0076 (registrarse responde igual exista o no la cuenta) con 8 tests; `MigrationRollbackTests` revierte y reaplica cada migración nueva; el E2E corre entero en cada PR y gatea el merge. Donde el repo decidió invertir, invirtió bien. | | Confirmación |

## Lo que la auditoría no miró

Mutation testing (no hay), la tasa de flakes más allá del único caso medido (el `router.refresh()` al 50 %, ya resuelto), el rendimiento, y el cuerpo de los tests de identity: se leyeron nombres, no implementaciones. Los tests de las pantallas heredadas (auth, ajustes, mi perfil, catálogo) se contaron y no se juzgaron: son del producto anterior y su destino lo decide el plan, no esta auditoría.
