# Lessons learned

Bitácora append-only de errores que costaron tiempo o generaron bugs, con la regla operacional que sale para que no vuelva a pasar. Una entrada por incidente, ordenadas de más reciente a más vieja.

Formato de cada entrada:

- **Fecha** del descubrimiento (cuándo nos cayó el peso, no cuándo se introdujo).
- **Síntoma**: qué se vio.
- **Causa raíz**: qué pasaba realmente, una capa más abajo.
- **Fix**: cómo se arregló esa instancia concreta.
- **Prevención**: regla operacional para evitarlo en el futuro. Si la regla aplica a un proceso del repo, también queda en el doc específico (testing conventions, git workflow, etc.).

---

## 2026-05-08 · Regla "zona E2E" + auto-label vs olvidos del label `e2e`

**Síntoma**: la entrada anterior del 2026-05-08 ("CI estándar verde no implica E2E verde") cerró el incidente concreto pero dejó la regla operacional dependiendo de memoria humana ("aplicar label `e2e` cuando el PR toca código que afecte E2E"). En la práctica eso falla: olvidé el label en al menos 4 PRs seguidos pre-incidente y casi olvido en el siguiente.

**Causa raíz**: regla escrita en prosa, sin lista cerrada de paths que la disparen + sin enforcement. La memoria humana no escala como mecanismo de detección.

**Fix**: 

- Lista cerrada de paths (zona E2E) en `docs/testing/conventions.md` sección "Cuándo un PR necesita E2E".
- Auto-label vía GitHub Action en `.github/workflows/auto-label.yml` + `.github/labeler.yml`. Si el PR matchea la zona E2E, el label `e2e` se aplica solo (y se quita si en una iteración siguiente ya no aplica, gracias a `sync-labels: true`).
- Recipe `just frontend-test-e2e-show` (headed + slowMo) para que correr E2E local sea cero fricción cognitiva.

**Prevención**:

- Antes de mergear un PR con label `e2e`, correr `just frontend-test-e2e-show` local y validar 16/16 verde. Si la suite no pasa local, no mergear.
- Si el auto-label no detecta tu PR pero sabés que tocó algo que va a romper E2E, agregar el label a mano + actualizar `.github/labeler.yml` con el path nuevo en el mismo PR.
- Si el auto-label se aplica pero es false positive (toca un path de la lista pero la zona E2E no aplica realmente), removerlo a mano + considerar si el path glob es demasiado laxo.

---

## 2026-05-08 · CI estándar verde no implica E2E verde

**Síntoma**: PRs mergearon a main con `CI ✅` pero al push a main el workflow `E2E (Playwright)` corrió y falló. Específicamente, los specs `forgot-password`, `route-guards`, `sign-in`, `sign-out`, `sign-up` rompieron post-merge desde US-037-f hasta US-038-f (cuatro PRs seguidos).

**Causa raíz**: dos factores combinados.

1. US-037-f introdujo un guard en `app/(member)/layout.tsx` que redirige a `/onboarding/welcome` si el user no tiene `StudentProfile`. Los seed personas (Lucía, Mateo) no traían profile, así que sign-in con cualquiera de ellas mandaba a `/onboarding/welcome` en lugar de `/home`. Los specs E2E pre-existentes esperaban `/home` y rompían.
2. El workflow `e2e.yml` corre **on-demand**: solo se dispara con label `e2e` en el PR o push a main. Los PRs no tenían el label, entonces el E2E **no se ejercía pre-merge**. CI estándar (`ci.yml`) no incluye E2E. El indicador "verde" del PR ocultaba el problema.

**Fix**:

- Agregar `StudentProfile` a Lucía en el seed (PR #80). Mateo se queda sin profile a propósito para cubrir el path "user nuevo va a onboarding".
- Aplicar label `e2e` al PR del fix antes de mergear, validar suite completa (16/16) verde, después mergear.

**Prevención**:

- Aplicar label `e2e` cuando el PR toca cualquier código que pueda afectar lo que un E2E spec verifica. Lista por path en `docs/testing/conventions.md` (sección E2E).
- Cuando se corre E2E local pre-merge, correr la suite completa (`bunx playwright test` sin filtro), no solo el spec específico de la US tocada.
- No reescribimos historia: los runs `E2E ❌` en commits intermedios de main quedan como evidencia.

---

## 2026-05-08 · Link rot: docs restructured y recursos externos cambiados

**Síntoma**: tres incidentes distintos de links rotos detectados por lychee post-merge a main. (1) `docs/.../US-033-f.md` linkeado, pero US-033 se integró y vive en `US-033-i.md`. (2) `US-005.md` referenciado, pero el archivo no existe. (3) link a `agilealliance.org/glossary/invest/` devolvía 404 porque la página fue reorganizada.

**Causa raíz**: distintas pero del mismo origen. Cuando una US se reestructura (split, integration, rename), los links a su archivo viejo quedan colgando si nadie hace `git grep` antes de cerrar el PR de la reestructura. Cuando un recurso externo se reorganiza, los links pudren sin nada que avise. La entry "Lychee CI fail por links a docs aún no mergeados" cubre el caso pre-merge; este es maintenance ongoing.

**Fix** (cada uno en su commit):

- `e304ad1` quitar link `US-033-f` (US-033 integrated en `US-033-i.md`).
- `bfbb254` convertir link a `US-005.md` (no existe) en texto plano.
- `b0a3763` reemplazar link de Agile Alliance por XP123 de Bill Wake (más estable como source).

**Prevención**:

- Cuando una US se reestructura (split / merge / rename), `git grep` por su path viejo antes de cerrar el PR de la reestructura. Cualquier referencia stale, fixear en el mismo PR.
- Para recursos externos, preferir links a sources estables (sitios personales de autores reconocidos, papers, RFCs) sobre páginas corporativas que pueden reorganizar.
- Lychee en main post-merge atrapa estos incidentes; no es prevención, es detección. La prevención es el `git grep` pre-merge.

---

## 2026-05-07 · Renombrar option de Notion vía API rompe los IDs

**Síntoma**: después de renombrar la option `Sprint 0` a `S0` en la database `plan-b: Tasks` vía API (`ALTER COLUMN ... SET SELECT(...)`), 8 pages que apuntaban a esa option quedaron con `Sprint=null`. Las views basadas en filtros por `Sprint` dejaron de mostrar esas US.

**Causa raíz**: el `ALTER COLUMN ... SET SELECT(...)` de la Notion API no renombra options preservando ID; borra el option viejo y crea uno nuevo con ID distinto. Las pages que apuntan al ID viejo no migran automáticamente. La option renombrada es funcionalmente nueva.

**Fix**: reasignar manualmente cada página huérfana al nuevo option `S0`.

**Prevención**:

- No renombrar options de Select / Status en Notion. Si necesitás un valor nuevo, agregar option nuevo. Si una option queda obsoleta, dejarla sin uso (no borrar) hasta confirmar que ninguna page la referencia.
- Si renombrar es absolutamente necesario: hacer en la UI de Notion (preserva ID) y verificar con un fetch que las pages siguen apuntando bien. Nunca via API.
- Documentado en la página `🛠️ Cómo mantener plan-b: Tasks` dentro del workspace de Notion.

---

## 2026-05-06 · Status de US en Notion no se actualiza al mergear PR

**Síntoma**: tras mergear PRs (US-038-b, US-038-f), las US correspondientes en Notion quedaron con `Status=Sprint backlog` en vez de `Done`. Las views como "Sprint actual" y "Kanban" mostraban datos incorrectos.

**Causa raíz**: no había convención sobre quién actualiza Notion al mergear. El workflow asumía que iba a actualizarse solo, pero no hay automatización entre GitHub y Notion. El drift se acumuló silente.

**Fix**: barrido manual de las 4 US drifteadas a `Status=Done`.

**Prevención**:

- Cuando un PR mergea a main, el que mergea actualiza el `Status` a `Done` en la(s) page(s) de Notion correspondiente(s). El asistente IA tiene esta regla en su memoria operacional: cuando Lucas dice "mergeado" / "mergeé" / equivalente, antes de seguir con cualquier otro trabajo, actualizar Notion.
- Cuando el flujo crezca a más PRs/día o más devs, evaluar GitHub Action que sincroniza vía API. Hoy es manual.

---

## 2026-05-06 · Em-dashes en outputs del asistente

**Síntoma**: archivos de código, PR bodies y commit messages aparecieron con em-dashes (—) generados por el asistente, contradiciendo la regla absoluta del proyecto de no usarlos.

**Causa raíz**: hábito del modelo (LLM). Los em-dashes son marker típico de output AI y "delatan" que el contenido lo escribió la IA, no Lucas. Aunque la regla ya estaba en la memoria operacional del asistente, la frecuencia de generación de contenido nuevo hizo que recayera.

**Fix**: barrido manual sobre archivos afectados (PR #79 + 6 PRs mergeados ya con bodies editados).

**Prevención**:

- Regla absoluta del proyecto: nunca usar em-dashes en output. Reemplazar por dos puntos, comas, paréntesis o frases separadas.
- Auto-monitoreo del asistente al generar contenido nuevo: revisar antes de commitear.
- Convenciones de escritura técnica del proyecto (en mi memoria operacional, no en docs porque es de comportamiento del asistente, no del proceso).

---

## 2026-05-05 · Wire format mismatch entre backend y frontend (`'current'` vs `'Active'`)

**Síntoma**: el E2E spec del onboarding quedaba colgado esperando opciones en el dropdown de plans. El backend devolvía planes pero el filtro client-side los descartaba todos.

**Causa raíz**: el frontend filtraba `plans.filter(p => p.status === 'current')`. El backend serializaba `CareerPlanStatus` enum vía `HasConversion<string>()` de EF, dando los valores literales `'Active'` y `'Deprecated'`. Cero match. La doc del DTO inicial (mía) decía "current/draft/deprecated" sin verificar el wire format real del backend.

**Fix**: cambiar filtro a `p.status === 'Active'`. Actualizar doc del DTO en backend + tipo del frontend con valores reales.

**Prevención**:

- Antes de filtrar/comparar contra strings de un endpoint, verificar el wire format real haciendo un `curl` o un fetch directo al endpoint en dev. No asumir basado en doc.
- Cuando un .NET enum cruza a JSON, EF con `HasConversion<string>()` serializa el nombre exacto del enum (PascalCase). Documentar en el DTO.

---

## 2026-05-05 · Dependabot resolution drift en testing infra

**Síntoma**: vitest con `@vitejs/plugin-react` colgaba la suite local + en CI con error de "vite/internal mismatch". Tests que pasaban antes empezaron a fallar sin cambios de código.

**Causa raíz**: el `package.json` tenía `"@vitejs/plugin-react": "^4.3.4"`. Al regenerar `bun.lock` por algún PR, bun resolvió a 4.7.0, que tiene un mismatch con la versión de vite que vitest 2.x bundlea internamente. Versión legítimamente "compatible" según semver caret pero rota en runtime.

**Fix**: pin estricto a `~4.3.4` (sólo permitir patches). Regenerar `bun.lock`.

**Prevención**:

- Para dependencias de testing infra (`@vitejs/plugin-react`, `vite`, `vitest`, `@playwright/test`, `@testing-library/*`): pin estricto con `~` (patch-only) en lugar de `^` (minor permitido).
- Cuando un test pasa a fallar sin cambios de código, primero verificar si hubo bumps recientes en `bun.lock` (incluso si `package.json` no cambió).
- Tier-based pinning policy en `dependabot.yml` para Tier 1 deps (framework + testing infra).

---

## 2026-05-04 · JWT issuer mismatch entre frontend y backend en CI

**Síntoma**: tests E2E pasaban local pero fallaban en CI con `"iss claim mismatch"`. El JWT firmado por backend era rechazado por jose.jwtVerify del frontend.

**Causa raíz**: el backend leía `JWT__Issuer` de configuración (env-based, `'planb-test'` en CI). El frontend tenía hardcodeado `'planb'` en `lib/session.ts`. Match en local (donde backend defaultea a `'planb'`), mismatch en CI.

**Fix**: refactorizar frontend para leer `JWT_ISSUER` y `JWT_AUDIENCE` de env (`lib/env.ts`). Actualizar `e2e.yml` para inyectar los valores correctos en `.env.local` durante el job. Actualizar `session.ts` para usar `serverEnv()`.

**Prevención**:

- Secretos y config que cruzan capas (backend ↔ frontend) deben ser env-based en ambos lados, no hardcoded en uno.
- Cuando un valor de auth/session está hardcoded en algún lado, es smell de que va a romper en otro entorno.
- Verificar con `git grep` antes de mergear que el secreto no esté en strings literales del frontend.

---

## 2026-05-04 · Lychee CI fail por links a docs aún no mergeados

**Síntoma**: CI workflow `Check links in markdown` (lychee) falló dos veces seguidas, en PRs distintos, por links a `docs/domain/user-stories/US-037-f.md` que el PR referenciaba pero que vivía en otra rama todavía no mergeada.

**Causa raíz**: lychee resuelve links relativos a archivos del repo. Si el doc destino no está en main, falla. Cuando dos PRs interdependientes (ej. US-037-b referenciando US-037-f que aún no mergeó) se trabajan en paralelo, el primero en mergear rompe lychee.

**Fix (las dos veces)**: cambiar el link a texto plano (sin `[...](...)`) hasta que el doc destino mergee. Restaurar el link en un commit posterior.

**Prevención**:

- Linkear a un .md de otra rama solo si el otro PR ya mergeó.
- Si el otro PR aún no mergeó, mencionar como texto plano "ver `US-XXX-f.md` cuando aterrice" y volver a linkear post-merge.
- Si aplican muchos cross-links simultáneos, considerar mergear el doc primero (sin código) en un PR docs-only para que los otros PRs puedan linkear seguros.

---

## 2026-05-03 · Path double-namespacing `(auth)/auth/sign-in/page.tsx`

**Síntoma**: rutas auth quedaron en `app/(auth)/auth/sign-in/page.tsx` produciendo URL `/auth/sign-in`. El segmento `auth/` redundante.

**Causa raíz**: malentendido sobre route groups en Next.js App Router. Los route groups `(group)` agrupan layouts pero NO aparecen en la URL. Si dentro de `(auth)/` se crea otra carpeta `auth/`, esa sí aparece. Resultado: doble namespacing visible.

**Fix**: rename a `app/(auth)/sign-in/page.tsx`. URL queda en `/sign-in` que es lo deseado. Convención: cada flow de auth tiene su propia ruta top-level dentro del route group `(auth)`.

**Prevención**:

- Convención documentada en `frontend/CLAUDE.md`: el route group `(auth)` no aparece en la URL. Las páginas viven todas top-level: `/sign-in`, `/sign-up`, `/forgot-password`, `/verify-email`. No crear `auth/` adentro.

---

## 2026-05-03 · Pinchazos múltiples mientras se estabilizaba la suite E2E en S1

**Síntoma**: la primera puesta en marcha de la suite Playwright contra el backend real coleccionó seis fallas distintas en una semana, todas chiquitas, todas en commits diferentes.

**Causa raíz**: cada fix era narrow, todos del mismo período de "primera vez que esto corre de verdad". Los seis casos:

1. `21b513d` merge conflict en `package.json` perdió `dotenv` de devDependencies. Local pasaba con `node_modules` cacheado; CI hace `bun install` fresco según el lockfile.
2. `4d2b7db` race entre animación de Radix dropdown del avatar y el click sobre "Cerrar sesión": el selector matcheaba el trigger todavía visible.
3. `2277bd4` locator `getByText('Te enviamos un mail')` se rompió cuando el hint pasó a botón "Reenviar verificación" en otro PR.
4. `a69b27b` helper para limpiar Redis entre specs usaba `podman exec`, rompiendo en CI Docker y en cualquier dev sin podman.
5. `9101155` + `3f96ea9` secrets `JWT_SECRET` / `SESSION_SECRET` no estaban inyectados al frontend en CI; faltaba materializar `.env.local` durante el job.
6. `6a647e1` debug logs temporales en `getSession` y `forwardSetCookies` se committearon a main para diagnosticar un E2E fail; después tocó limpiarlos.

**Fix**: cada commit lo mencionado arriba. Suite estable al final de la semana.

**Prevención**:

- Después de resolver un conflict en `package.json` / lockfile / `*.csproj`, validar con `bun install --frozen-lockfile` (o `dotnet restore --locked-mode`) en shell limpia. `node_modules` cacheado oculta el drift.
- Locators E2E atados a roles + name accesible (`getByRole('button', { name: ... })`), no a copy literal. Para visuales sin rol, `data-testid` explícito.
- Cuando un componente bajo test tiene animación (Radix transitions), esperar visibilidad explícita antes de interactuar; nunca patchear con `waitForTimeout` arbitrario.
- Test helpers no shellean al runtime de containers (podman/docker); hablan el protocolo del servicio (TCP, HTTP, SQL). La container detection ya está resuelta para `just infra-up`, no replicarla en helpers.
- Si decido committear debug logs temporales para diagnosticar un fail en CI, abrir issue / TODO con sha de revert. Idealmente: log behind feature flag o env var, no `console.log` raw en código de auth.

---

## 2026-05-02 · Logística del proyecto se filtró a comentarios de código

**Síntoma**: `git grep -nE "Sprint|MVP|Fase|F[1-7]|aterriza"` en archivos `.cs` / `.ts` / `.tsx` devolvió decenas de matches. Comentarios tipo `// Will be wired in Sprint S2`, `// post-MVP`, `// cuando aterrice US-016` poblaban el código.

**Causa raíz**: cuando se escribía un módulo y dependía de algo que todavía no existía, era natural dejar un comment con el plan ("esto se completa en F3"). La logística (sprint, fase, US numbers) se mueve y el código vive más que el cronograma. Un comment que diga "Sprint S2" envejece mal y confunde al que lee 6 meses después.

**Fix**: barrido manual via `git grep` y eliminación / reescritura de los comments (commit `6648374`). Los que tenían WHY técnico (no logístico) se mantienen. Los que apuntaban a un ADR o US específica usan ref estable (`ADR-NNNN`, `US-NNN`), no fechas o sprints.

**Prevención**:

- Comments en código `.cs` / `.ts` / `.tsx` hablan del código (por qué, invariantes, tradeoffs). El cronograma (Sprint, Fase, MVP, "cuando aterrice X") va en docs, US, ADR.
- Si necesito rastrear "esto se completa cuando", usar TODO con ref estable a una US o ADR, sin fechas ni sprints. Reservar TODO para deuda concreta, no para narrativa.
- Regla absoluta del proyecto. Documentada como feedback en mi memoria operacional.

---

## 2026-05-02 · AuthView con tabs era diseño equivocado

**Síntoma**: el shell de auth en S1 era una sola pantalla `/auth` con tabs Sign-up / Sign-in. Sesión de claude-design del 2026-05-02 reveló que mezclaba dos verbos distintos (registrarse vs autenticarse) en una sola pantalla.

**Causa raíz**: el diseño inicial priorizaba reutilización de código (un layout, dos forms) sobre claridad de UX. Cada flow auth tiene su propia intención y propio estado mental del user; meterlos en tabs hace que el user dude qué tab está mirando.

**Fix**: US-036 (auth rebuild). Cuatro rutas separadas (`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`), cada una con layout dedicado. Componente `AuthView` eliminado. Documentado en ADR-0041.

**Prevención**:

- Cuando un componente shared mezcla dos verbos del dominio, evaluar si la economía de código vale la confusión de UX.
- Si la duda es "uno o dos artifacts": dos. La economía premature de código es deuda visual.
- En general el frontend prioriza claridad de UX sobre DRY de código.

---

## 2026-05-02 · Capas de planning innecesarias (slices A/B/C/D)

**Síntoma**: STATUS.md, ADRs, eventstorming y otros docs hablaban de "slices A/B/C/D" como subdivisión de Fase 2. Nadie podía explicar fuera de contexto qué significaba "slice C". Cuando aparecieron los Sprints S0/S1/S2 formales, los slices quedaron como capa redundante: decir "slice C en S1" es lo mismo que "S1".

**Causa raíz**: los slices se inventaron antes de tener sprints formales para subdividir Fase 2 en chunks ejecutables. Cuando los sprints aterrizaron, nadie eliminó la capa anterior. Se arrastró por 3 ADRs y varios docs.

**Fix**: barrido sistemático en docs (PR #77). Reemplazo `slice A/B → S0`, `slice C → S1`, `slice D → S2`. ADRs históricos también actualizados (Lucas autorizó por consistencia de vocabulario).

**Prevención**:

- Antes de inventar una capa nueva de planning, evaluar si las existentes (sprints, US, epics) ya cubren la necesidad.
- Cuando se introduce una capa nueva de planning, eliminar la anterior si queda redundante.
- Una sola dimensión de planning operativa (sprints + US). Las fases macro del cronograma original quedan como narrativa institucional, no operativa.

---

## 2026-05-01 · pr-title workflow no se skipea en re-runs de Dependabot

**Síntoma**: `pr-title.yml` falla en PRs de Dependabot incluso después del primer fix con `github.actor != 'dependabot[bot]'` (commit `6aae01f`). Al pedir `@dependabot rebase` el workflow re-runea y vuelve a fallar. PRs #39, #40, #41 todos rojos.

**Causa raíz**: `github.actor` puede cambiar entre runs. En re-runs disparados vía comment de Dependabot, queda con el initiator del comment, no con el bot. La condición `github.actor != 'dependabot[bot]'` evalúa `true` y el job ejecuta.

**Fix**: chequear `github.event.pull_request.user.login`, que es el creador del PR e invariante a re-runs / rebases. Para Dependabot PRs siempre es `'dependabot[bot]'` (commit `921113b`).

**Prevención**:

- En conditions de GitHub Actions que skipean por "quién abrió el PR", usar `github.event.pull_request.user.login`. `github.actor` describe "quién triggereó esta run" y es volátil en re-runs.
- Antes de mergear un fix de CI, verificar el comportamiento en re-run (botón "Re-run all jobs"), no solo en el run inicial.

---

## 2026-05-01 · E2E first-run: tres bugs distintos en una corrida

**Síntoma**: la primera puesta en marcha end-to-end de la suite Playwright no pasó. Tres síntomas en specs distintos: prompt nativo del browser dejaba el test colgado, sign-in fallaba porque el seed terminaba después del primer fetch, y la validación del form no encontraba los messages de error.

**Causa raíz**: tres bugs distintos en el mismo PR.

1. Confirm dialog en delete-account no se aceptaba: Playwright requiere `page.on('dialog', d => d.accept())` registrado antes de la acción.
2. Race entre seed asíncrono y page-load: el `goto('/sign-in')` corría antes de que el seed terminara.
3. Validation messages estaban dentro de `<p data-error>` del FormField, pero el spec usaba `getByText` que no scopeaba al input correcto.

**Fix**: dialog handler global, `await ensureSeed()` blocking en `beforeEach`, locators de validation atados a roles ARIA o testid (commit `ba8e5ce`).

**Prevención**:

- Native browser dialogs (alert / confirm / prompt) en Playwright requieren handler explícito antes de la acción que los dispara. Documentar en `docs/testing/conventions.md`.
- Seeds asíncronos van en hook `beforeEach` con await blocking, no en setup global background.
- Locators de validation messages atados a `getByRole('alert')` / `getByRole('status')` o `data-testid`, no a `getByText` sobre el message literal.

---

## 2026-04-30 · Changelog automation: dos bugs en su primer live run

**Síntoma**: el workflow `changelog.yml` (ADR-0037) corrió por primera vez en el merge de PR #28 y se comportó mal de dos formas. Skipeó todos los commits del PR aunque ninguno tenía el opt-out marcado, y de los 3 commits del PR (Rebase merge) solo el último entró al CHANGELOG.

**Causa raíz**: dos bugs distintos en `scripts/append-changelog.ts`.

1. La detección del skip-tag usaba `body.includes('[skip changelog]')`. Las commit messages mencionaban el feature en prosa ("Honors `[skip changelog]` in body"), false-positiveando los 3.
2. El script solo procesaba `HEAD`. Con Rebase merge (default por ADR-0026), un PR con N commits dispara un solo push event; `head_commit` es el último de los N. Los otros N-1 no llegaban al script.

**Fix**:

- Skip-tag matchea con `/^\s*\[skip changelog\]\s*$/m`, anclado a línea completa.
- Cuando GHA expone `before` y `after`, el script itera `git log BEFORE..AFTER --reverse` y procesa cada commit. Fallback a HEAD si no hay env vars (initial push, local).
- `fetch-depth: 0` en checkout para que el rango completo esté disponible.
- Backfill manual de las 3 entries de US-033 que se perdieron (commit `ced2c1f`).

**Prevención**:

- Para flags textuales en commit / PR body, anclar el match a línea completa con `^...$` y multiline. `String.includes()` es trampa para flags estructurales.
- Workflows que reaccionan a "el commit que mergeó" deben procesar el rango `before..after` del push event, no solo `HEAD`. Rebase merges con N>1 commits son la norma acá (ADR-0026).
- Tests automatizados para parsing / regex helpers en scripts de CI antes de habilitarlos en producción.

---

## 2026-04-30 · VerificationToken: aggregate vs child entity

**Síntoma**: la implementación inicial de `EmailVerificationToken` como aggregate root independiente requería cross-aggregate invariants y app services para coordinar (ej. "un solo token activo por user").

**Causa raíz**: error de modelado DDD. El test de Khorikov / Mantinband: "¿Necesito cargar este objeto independientemente?" Si la respuesta es no, es child entity. VerificationToken siempre se accede vía un User; nunca hay queries "todos los tokens del sistema".

**Fix**: refactor a child entity dentro del aggregate `User` (ADR-0033). Borrar `IEmailVerificationTokenRepository`. Mover entity a `Domain/Users/`. User aggregate gana `IssueVerificationToken`, `MarkEmailVerifiedFor`, etc. Migration: rename `email_verification_tokens` → `verification_tokens` + agregar columna `purpose` enum para reusar para teacher claim.

**Prevención**:

- Antes de modelar algo como aggregate independiente, aplicar el test "¿se carga independientemente?". Si no, es child entity.
- Si hay invariantes cross-objects (ej. "un solo X activo por Y"), eso es señal fuerte de que X debe ser child de Y.
- Documentar en `docs/domain/tactical/aggregates.md` el patrón "child entity" con casos canónicos (VerificationToken, Prerequisite, CommissionTeacher).

---

## 2026-04-28 · Replan mid-sprint S1 (cuándo es válido extender)

**Síntoma**: el sprint S1 arrancó con el "slice de auth completo end-to-end" como foco (register UI + verify + login + sign-out). En el día 2, ese foco ya estaba cerrado con runway restante en el sprint.

**Causa raíz**: el effort de los 4 flows fue subestimado (más bajo de lo previsto). En vez de tener un sprint con 5 días libres, se decidió ampliar scope con cleanup auth (resend / expire / forgot password) + AppShell + home + StudentProfile + T-series.

**Fix**: replan documentado en STATUS.md con la decisión explícita y la nueva meta ("el evaluador entra a plan-b y ve la silueta completa del producto post-login").

**Prevención** (este es un patrón positivo, no error):

- Cuando hay runway sobrante mid-sprint, está bien expandir scope si las US adicionales están listas (DoR cumplido) y el sprint sigue siendo coherente narrativamente.
- Documentar el replan explícito en STATUS.md, no implícito por commits.
- No es un anti-pattern: cerrar un sprint con runway sobrante por debajo del compromiso original es peor desperdicio que ampliar con scope listo.

---

## 2026-04-27 · Config crítica fail-fast en startup, no silente en runtime

**Síntoma**: serie de bugs durante S0/S1 donde la app arrancaba sin errores pero rompía impredecible en runtime cuando un endpoint llegaba a un código path que asumía X infra. Casos: Redis fallback a `null`, Smtp host con default `localhost` que en otro entorno no aplicaba, `JWT__Issuer` / `Audience` sin valor concreto, embeddings API key con string dummy.

**Causa raíz**: patrón compartido. Cuando se scaffoldeó cada módulo, se metieron defaults convenientes en `appsettings.json` (base) o registraciones condicionales del DI ("si la connection string existe, registrar; si no, registrar `null`"). El `appsettings.json` base se shippea en el container; sin env override los defaults dev quedaban activos. La registración condicional disfrazaba el problema porque la app arrancaba aparentando funcionar.

**Fix** (varios commits a lo largo de S0/S1):

- `1ce2daf` Redis connection string requerido. Si no está, app no arranca.
- `65a2d2f` vaciar valores dev-leaning del `appsettings.json` base, mover a `appsettings.Development.json` (gateado por env).
- `db48205` + `5a05913` `SmtpOptions` y `VerificationEmailOptions` con defaults que fail fast en lugar de strings dummy.
- `132ab03` `ValidateOnStart()` para esas Options classes.
- `f7b02d7` Smtp host default `localhost` solo via `appsettings.Development.json`, no en base.
- `1fcb143` service `redis` y env vars JWT en `ci.yml` para que el DI pueda construir el host en Release.

**Prevención**:

- Para infra crítica (DB, Redis, mensajería, secretos), no hay "modo opcional" en runtime. O está configurado y arranca, o no está y falla en startup con mensaje específico.
- `appsettings.json` base solo tiene config legítimamente compartida entre todos los entornos (logging levels, feature flags neutrales). Secretos y endpoints van por env var, requeridos.
- `ValidateOnStart()` para todas las Options classes que tienen propiedades sin default seguro. Fallar en startup es siempre mejor que silently broken.
- En code review de PRs que tocan `appsettings*.json` o registración del DI, preguntarse "¿este default es seguro si nadie lo overridea?". Si no, no va.

---

## 2026-04-26 · DX gaps en setup de Dev: launchSettings y migrations on startup

**Síntoma**: dos pinchazos de DX que se descubrieron por separado al hacer setup limpio. (1) `dotnet run` directo arrancaba la app en `Production` (sin Swagger, sin migrations, fallando en `ValidateOnStart()`). (2) Cada `git pull` con migrations nuevas obligaba a correr `just migrate` manual o el endpoint reventaba con "relation does not exist".

**Causa raíz**: ambos comparten origen. ASP.NET Core no tiene defaults útiles para Dev sin opt-in explícito.

1. Sin `Properties/launchSettings.json` checked-in que setee `ASPNETCORE_ENVIRONMENT=Development`, `dotnet run` defaultea a `Production`.
2. Sin código que ejecute `Database.Migrate()` (decisión inicial razonable: en Prod no querés apply-on-startup), cada cambio de schema requiere migración manual.

`just dev-backend` enmascaraba ambos porque inyectaba env y corría `just migrate` antes. Devs que no usaban `just` chocaban con los dos.

**Fix**:

- `host/Planb.Api/Properties/launchSettings.json` checked-in con profile `https` + `applicationUrl` + `ASPNETCORE_ENVIRONMENT=Development` (commit `65eb7dc`).
- `app.Services.GetRequiredService<IMigrationsRunner>().RunAsync()` en startup, gateado por `if (app.Environment.IsDevelopment())` (commit `25cdbb4`).

**Prevención**:

- Lo que es operacionalmente correcto en Producción no aplica en Dev. Apply-on-startup y env defaults van checked-in para DX; en Producción se hace por pipeline con approval.
- `just dev-backend` y `dotnet run` deben converger en arrancar la app igual. Si el segundo arranca distinto, falta config en el repo.
- Si hay un comando que dev "tiene que correr siempre que cambie X", evaluarlo automatizable gateado por environment.

---

## 2026-04-26 · Mergear página off-style obliga a revertear

**Síntoma**: PR de US-011-f (verify-email page) mergeó a main con el flow funcional verde, pero la pantalla era visualmente "Tailwind genérico": sin paleta apricot, sin Geist + Instrument Serif, sin primitives `Logo` / `eyebrow` / `h-display` / `lede`, sin voz rioplatense. Estridente respecto al resto del producto.

**Causa raíz**: cuando se implementó la página, el design system todavía no había aterrizado. Se implementó con Tailwind crudo y se aprobó el merge porque "funcionaba". Una vez en main, el contraste con el resto de la UI quedó visible y costoso de pulir incremental.

**Fix**: `revert: verify-email page (US-011-f)` (commit `5c871e3`). Borrar la página entera. La US queda parked hasta que aterrice la design system foundation (US-016: tokens, fonts, primitives). Después se reimplementa en el lenguaje visual del proyecto.

**Prevención**:

- "Funciona" no es criterio de merge para un PR de UI. Si el output es estridente respecto al resto del producto, es deuda visual y se corrige antes del merge o se holdea la US.
- Si una US de UI llega antes que el design system base, parkear. No implementar con Tailwind genérico "para tener el flow disponible".
- Antes de mergear un PR de UI, comparar lado a lado con otra pantalla del producto. Si parecen de apps distintas, no mergea.

---

## 2026-04-25 · SESSION_SECRET potencialmente bundleable al client en Next.js

**Síntoma**: code review reveló que `frontend/lib/env.ts` exportaba `env.SESSION_SECRET` como single export. En Next.js 15 App Router cualquier env importada desde un Client Component se inlinea en el bundle. El secret podía terminar accesible en browser si algún Client Component lo importaba transitivamente.

**Causa raíz**: usar un solo módulo `env.ts` que mezcla server-only secrets con client-safe vars (`NEXT_PUBLIC_*`) es trampa en App Router. Next.js no distingue: la importación desde un Client Component traga todo lo que el módulo exporta y lo bundlea.

**Fix**: split en `lib/env.ts` (client-safe, expone solo `NEXT_PUBLIC_*`) y `lib/env.server.ts` (con `import 'server-only'` al tope; `serverEnv()` devuelve `SESSION_SECRET` y secrets backend) (commit `66a9e71`).

**Prevención**:

- Server secrets en App Router viven en módulos con `import 'server-only'` al tope. Esa directiva hace que el build falle si un Client Component los importa, lo cual es la guard que necesitamos.
- Convención del proyecto: `env.ts` (client) + `env.server.ts` (server-only). Un módulo único mezclando ambos es smell.
- Code review checklist para PRs que tocan auth o config: ¿algún server secret cruzó hacia un Client Component vía import?

---

## 2026-04-25 · Architecture drift entre `features/` del frontend y `frontend/CLAUDE.md`

**Síntoma**: `frontend/src/features/identity/` arrancó con la convención de `frontend/CLAUDE.md` (`api.ts`, `actions/`, `components/`, etc.) pero terminó con archivos sueltos en la raíz, helpers en `src/lib/` que en realidad eran del feature, y subdirs no documentadas. Doble fix necesario en commits sucesivos.

**Causa raíz**: la convención estaba escrita en `frontend/CLAUDE.md` pero al implementar US-010-f / US-028-f se desvió. Cuando se vuelve a la convención meses después, ya hay alias y referencias que asumen el layout drifteado.

**Fix**:

- `9121968` reorganizó `identity/` para conformarse a la convención (mover archivos, fixear imports).
- `9c06995` movió `forward-set-cookies` de `lib/` a la feature dir donde pertenecía.
- `a25d4ce` refactor más amplio: `features/<feature>/` como vertical slice, con `frontend/CLAUDE.md` actualizado para reflejar la convención real.

**Prevención**:

- Cuando arranco una feature, abrir `frontend/CLAUDE.md` y leer la sección de estructura ANTES de crear archivos. No empezar y "después acomodar".
- Si la convención que leo no se ajusta al feature concreto, el fix es updatear `CLAUDE.md` primero, después implementar. La convención es viva pero explícita.
- En code review de PRs que crean features nuevas, primer pass: ¿layout coincide con `CLAUDE.md`? Si no, blocker.

---

## 2026-04-25 · Port del mockup no fue fiel la primera vez

**Síntoma**: la pantalla de auth en el frontend se veía "parecida" al mockup pero con desviaciones de spacing, color del CTA, jerarquía tipográfica del hero. Lucas pidió "1:1 con el mockup" tres veces; cada PR seguía dejando drift visual menor.

**Causa raíz**: el primer port se hizo "interpretando" el mockup en vez de traducir literal el `styles.css` del HTML del mockup. Las custom properties (apricot tones, escalas tipográficas, grid de 8) no se transcribieron, se aproximaron a clases Tailwind cercanas.

**Fix**: refactor a port literal de `styles.css` (commit `8cb48d5`), pegado a las custom properties exactas del mockup. Después un fix adicional para forms (commit `a729a65`) tras notar que faltaban detalles de focus-ring + sizing.

**Prevención**:

- Cuando el mockup viene como HTML + CSS (no Figma), el port arranca copiando `styles.css` al proyecto y refactorizando desde ahí. No "leer el HTML y reimplementar en Tailwind".
- Diff visual lado a lado pre-merge. Si parecen de apps distintas, no es 1:1.
- "Diseño primero" no aplica solo a no-borrar visuales (regla en mi memoria); aplica también a fidelidad del port inicial.

---

## 2026-04-25 · Filenames y line endings cross-platform Windows / Linux CI

**Síntoma**: dos síntomas relacionados que aparecieron al ir y venir entre Windows local y CI Linux. (1) El link al ADR-0005 (`reseñas-...md`) rompía en algunos clones del repo: tres commits sucesivos (`bb2cc03`, `877bf2c`, `b492308`) renombraron el archivo y no terminaban de converger. (2) PRs con diffs de "todas las líneas cambiaron" sin haber tocado más de 2 líneas reales.

**Causa raíz**: Windows + Git + Linux CI es terreno minado para cualquier carácter no-ASCII en filenames (la ñ se codificaba inconsistente entre NFD y NFC, y `core.precomposeunicode` no estaba alineado entre máquinas) y para line endings (yo escribo CRLF por default; CI espera LF; sin `.gitattributes` Git serializaba lo que cada máquina escribía).

**Fix**:

- Filename ADR-0005 convergió a encoding NFC consistente (commit `b492308`).
- `.gitattributes` con `* text=auto eol=lf` + `git add --renormalize .` para resetear todo el repo a LF (commit `4e7c809`).

**Prevención**:

- Filenames del repo solo ASCII. Tildes y ñ en el contenido del archivo (títulos, prosa) sí, en el nombre del archivo no.
- `.gitattributes` con `* text=auto eol=lf` es regla básica para repos cross-platform desde el primer commit. No esperar el síntoma.
- En Windows, `core.autocrlf=input` (escribe LF al repo, no convierte al checkout) o `core.autocrlf=false` con editor configurado a LF.
- Si veo un PR con diff de "todas las líneas cambiaron", chequear line endings antes que culpar al author.

---

## 2026-04-24 · MailHog en dev y Mailpit en CI: drift garantizado

**Síntoma**: tests de integración que verificaban envío de email pasaban local con MailHog pero fallaban en CI con Mailpit (o vice versa según el lado del cliente). El cliente de API tenía dos paths de código rotos. Bonus: tests de integración paralelos de xUnit raceaban en la DB de Postgres compartida.

**Causa raíz**: dev usaba MailHog v1.0.1 (HTTP API en `/api/v2/messages`); CI estaba configurado con Mailpit (HTTP API en `/api/v1/messages` y shape de mensaje distinto). Mantener dos tools forkeados producía drift local-green / CI-red sistemático. Bonus: MailHog tiene SMTP-binding bugs conocidos en GHA service containers, así que ese lado nunca iba a converger.

**Fix**: consolidar en Mailpit en ambos lados (commit `044c377`). `docker-compose.yml`, scripts de infra, env vars renombradas (`MAILHOG_*` a `MAILPIT_*`), client de tests, todo apuntando al mismo servicio. Test parallelism de xUnit deshabilitado para integration tests porque las fixtures por-clase raceaban en la DB compartida (commit `41ab29c`).

**Prevención**:

- Una herramienta de infra en dev tiene que ser la misma en CI. Forkear los dos lados a tools distintos es deuda con interés compuesto.
- Si una herramienta tiene bugs conocidos en GHA service containers (búsqueda rápida en su issue tracker), elegir otra antes de empezar a usarla.
- Renames de env var en `.env.example` + `create-env.ts` + `ensure-infra.ts` van todos en el mismo commit que el swap, sino dev local queda roto entre commits.

---

## 2026-04-24 · .NET 10 recién salido: ecosystem lag y CVE arrastrada

**Síntoma**: `dotnet build` arrancaba con warnings ruidosos sobre version conflicts entre paquetes transitivos y emitía CVE alerts sobre paquetes embebidos en deps de Microsoft. CI rojo desde el primer push del backend.

**Causa raíz**: .NET 10 había salido recientemente. Wolverine 5.31, paquetes de OpenTelemetry, JwtBearer, etc. todavía pinearon `Microsoft.*` 8.x o 9.x. NuGet resolvía a versiones intermedias raras o dejaba downgrades implícitos. Una dependencia transitiva arrastraba un paquete con CVE conocida.

**Fix**: bump de Wolverine a 5.32 (que ya soportaba .NET 10) y package overrides explícitos en `.csproj` para forzar la versión segura del paquete con CVE (commit `83fc4d8`).

**Prevención**:

- Adoptar la versión latest de .NET / Node / Bun apenas sale tiene un costo: las libraries del ecosystem tardan semanas a meses en updatearse. Aceptarlo y planificar tiempo extra en `chore(deps)` durante el primer mes de vida de un major release.
- `<PackageReference Include="X" VersionOverride="..." />` es legítimo cuando hay CVE y la dep transitiva está pinned por otro paquete. Documentar el override con un comentario que diga cuándo se puede sacar.
- Antes de pinear el stack a un major recién salido, mirar dependabot security alerts y los issue trackers de las libraries críticas.

---

## 2026-04-24 · Biome canary + CSS plugin bloqueando CI

**Síntoma**: CI workflow del frontend rojo desde el primer push. `bun run lint` con Biome rompía con errores parsing CSS y la versión `canary` introducía cambios de API que no estaban en docs.

**Causa raíz**: el initial scaffold del frontend pineó Biome a `canary` aspirational ("queremos features bleeding edge") y habilitó el CSS linter, que en esa fecha tenía bugs con Tailwind 4 directives. Doble filo: canary inestable + plugin con bugs sobre código generado por nuestro propio framework.

**Fix**: bajar Biome a `latest` stable, deshabilitar `lint.css` en `biome.json`, formatear todo el repo con la nueva config (commit `d9b00ee`).

**Prevención**:

- Linter / formatter para CI tiene que estar en versión stable, no canary. Las features bleeding edge no compensan la fragilidad del CI.
- Cuando un plugin de un linter tiene bugs sobre el lenguaje crítico del proyecto (CSS en frontend), dejarlo apagado y volverlo a probar cuando se reporte fix en su changelog.

---

## Cómo agregar una entrada nueva

1. Insertar la entrada arriba de las anteriores (orden descendente por fecha).
2. Mantener el formato: fecha, síntoma, causa raíz, fix, prevención.
3. Si la prevención es una regla de proceso, también agregar/linkear al doc específico (testing conventions, git workflow, ADR si es decisión arquitectural).
4. Commit con mensaje `docs(lessons): <título corto>`.
