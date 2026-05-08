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

## Cómo agregar una entrada nueva

1. Insertar la entrada arriba de las anteriores (orden descendente por fecha).
2. Mantener el formato: fecha, síntoma, causa raíz, fix, prevención.
3. Si la prevención es una regla de proceso, también agregar/linkear al doc específico (testing conventions, git workflow, ADR si es decisión arquitectural).
4. Commit con mensaje `docs(lessons): <título corto>`.
