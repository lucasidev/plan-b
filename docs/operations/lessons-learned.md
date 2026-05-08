# Lessons learned

Bitácora append-only de errores que costaron tiempo o generaron bugs, con la regla operacional que sale para que no vuelva a pasar. Una entrada por incidente, ordenadas de más reciente a más vieja.

Formato de cada entrada:

- **Fecha** del descubrimiento (cuándo nos cayó el peso, no cuándo se introdujo).
- **Síntoma**: qué se vio.
- **Causa raíz**: qué pasaba realmente, una capa más abajo.
- **Fix**: cómo se arregló esa instancia concreta.
- **Prevención**: regla operacional para evitarlo en el futuro. Si la regla aplica a un proceso del repo, también queda en el doc específico (testing conventions, git workflow, etc.).

---

## 2026-05-08 · CI estándar verde no implica E2E verde

**Síntoma**: PRs mergearon a main con `CI ✅` pero al push a main el workflow `E2E (Playwright)` corrió y falló. Específicamente, los specs `forgot-password`, `route-guards`, `sign-in`, `sign-out`, `sign-up` rompieron post-merge desde US-037-f hasta US-038-f (cuatro PRs seguidos).

**Causa raíz**: dos factores combinados.

1. US-037-f introdujo un guard en `app/(member)/layout.tsx` que redirige a `/onboarding/welcome` si el user no tiene `StudentProfile`. Los seed personas (Lucía, Mateo) no traían profile, así que sign-in con cualquiera de ellas mandaba a `/onboarding/welcome` en lugar de `/home`. Los specs E2E pre-existentes esperaban `/home` y rompían.
2. El workflow `e2e.yml` corre **on-demand**: solo se dispara con label `e2e` en el PR o push a main. Los PRs no tenían el label, entonces el E2E **no se ejercía pre-merge**. CI estándar (`ci.yml`) no incluye E2E. El indicador "verde" del PR ocultaba el problema.

Resultado: el bug se introdujo en US-037-f y aterrizó silente en main. Cada PR posterior heredó el rojo en E2E sin detectarlo. Al inspeccionar el log de runs en main, vimos cuatro pushes seguidos con `E2E ❌`.

**Fix**:

- Agregar `StudentProfile` a Lucía en el seed (PR #80). Mateo se queda sin profile a propósito para cubrir el path "user nuevo va a onboarding".
- Aplicar label `e2e` al PR del fix antes de mergear, validar suite completa (16/16) verde, después mergear.

**Prevención**:

- **Regla**: aplicar label `e2e` cuando el PR toca cualquier código que pueda afectar lo que un E2E spec verifica. Lista por path en [`docs/testing/conventions.md`](../testing/conventions.md) (sección "E2E").
- **Regla complementaria**: cuando se corre E2E local pre-merge, correr la suite completa (`bunx playwright test` sin filtro), no solo el spec específico de la US tocada.
- **No reescribimos historia**: los runs `E2E ❌` en commits intermedios de main quedan como evidencia. Lo importante es que el HEAD de main esté verde.

---

## 2026-05-07 · Renombrar option de Notion rompe los IDs

**Síntoma**: después de renombrar la option `Sprint 0` a `S0` en la database `plan-b: Tasks` vía API (`ALTER COLUMN ... SET SELECT(...)`), 8 pages que apuntaban a esa option quedaron con `Sprint=null`. Las views basadas en filtros por `Sprint` dejaron de mostrar esas US.

**Causa raíz**: el `ALTER COLUMN ... SET SELECT(...)` de la Notion API no renombra options preservando ID — borra el option viejo y crea uno nuevo con ID distinto. Las pages que apuntan al ID viejo no migran automáticamente. La option renombrada es funcionalmente nueva.

Esto pasó dos veces en el mismo flujo:
1. Antes (manualmente en la UI?), `Finished sprints` se renombró a `Sprint 0`. La UI sí preserva ID al renombrar inline, así que las pages estaban OK.
2. Después yo renombré `Sprint 0` a `S0` por API. La API NO preserva ID. Las 8 pages quedaron huérfanas.

**Fix**: reasignar manualmente cada página huérfana al nuevo option `S0`.

**Prevención**:

- **Regla**: no renombrar options de Select / Status en Notion. Si necesitás un valor nuevo, agregar option nuevo. Si una option queda obsoleta, dejarla sin uso (no borrar) hasta confirmar que ninguna page la referencia.
- **Si renombrar es absolutamente necesario**: hacer en la UI de Notion (preserva ID) y verificar con un fetch que las pages siguen apuntando bien. Nunca via API.
- Documentado en la página `🛠️ Cómo mantener plan-b: Tasks` dentro del workspace de Notion.

---

## 2026-05-06 · Status de US en Notion no se actualiza al mergear PR

**Síntoma**: tras mergear PRs (US-038-b, US-038-f), las US correspondientes en Notion quedaron con `Status=Sprint backlog` en vez de `Done`. Las views como "Sprint actual" y "Kanban" mostraban datos incorrectos: la US aparecía como pendiente cuando en realidad ya estaba en main.

**Causa raíz**: no había convención sobre quién actualiza Notion al mergear. El workflow asumía que iba a actualizarse solo, pero no hay automatización entre GitHub y Notion. El drift se acumuló silente.

**Fix**: barrido manual de las 4 US drifteadas (US-037 parent, US-038 parent, US-038-b, US-038-f) a `Status=Done`.

**Prevención**:

- **Regla**: cuando un PR mergea a main, el que mergea actualiza el `Status` a `Done` en la(s) page(s) de Notion correspondiente(s). Para esta sesión, eso lo hace el asistente IA: cuando Lucas dice "mergeado" / "mergeé" / equivalente, antes de seguir con cualquier otro trabajo, actualizar Notion.
- Cuando el flujo crezca a más PRs/día o más devs, evaluar GitHub Action que sincroniza vía API. Hoy es manual.
- Documentado en la página `🛠️ Cómo mantener plan-b: Tasks` dentro de Notion.

---

## Cómo agregar una entrada nueva

1. Insertar la entrada **arriba de las anteriores** (orden descendente por fecha).
2. Mantener el formato: fecha, síntoma, causa raíz, fix, prevención.
3. Si la prevención es una regla de proceso, también agregar/linkear al doc específico (testing conventions, git workflow, ADR si es decisión arquitectural).
4. Commit con mensaje `docs(lessons): <título corto>`.
