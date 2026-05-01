# Git workflow: reglas duras

Cómo se commitea, cómo se hace branching, cómo se resuelven conflictos, cómo se mergea. Sin excepciones.

Vivieron antes en [ADR-0026](../decisions/0026-git-workflow-github-flow-con-rebase.md) (decisión + rationale) pero el ADR no es operacional. Este doc es la bitácora paso a paso. Si algo de acá se contradice con el ADR, gana el ADR; el doc se actualiza.

Motivación: durante US-T01..T04 cometí errores de naming de branches, PR titles, y resolución de race conditions de mergeo. Cada error fue chico pero acumulaba ruido. Esto los previene de raíz.

## TL;DR: formato canónico

| Elemento | Formato | Ejemplo válido | Ejemplo inválido |
|---|---|---|---|
| Commit message subject | `<type>(<scope>): <descripción>` (lowercase) | `feat(identity): forgot-password backend` | `Feat(Identity): Forgot password` |
| Branch name | `<type>/<scope-description>` | `feat/identity-forgot-password`, `docs/rollback-policy` | `feat/T04-architecture-tests`, `feature/usT01` |
| PR title | Igual al commit subject (Conventional Commits) | `test(backend): reglas de arquitectura con NetArchTest (US-T04)` | `Test: NetArchTest rules` |
| US reference | En el commit body o PR body, **NUNCA** en branch o subject | `feat(identity): forgot-password backend (US-033-i)` | `feat/us033-forgot-password` |

## Conventional Commits: todos los detalles

### Subject

```
<type>(<scope>): <descripción>
```

- **type**: uno de `feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert`. Validado por Lefthook commit-msg + commits.yml en CI.
- **scope** (opcional pero recomendado): módulo o feature. Ejemplos: `identity`, `academic`, `frontend`, `ci`, `test`, `infra`. Letras minúsculas + dígitos + guiones.
- **descripción**: imperativa, lowercase first letter, ≤ 72 chars desde el `:` hasta el final.

### Body (opcional pero deseable)

Separado del subject por una línea en blanco. Explica el **por qué**, no el **qué** (el diff dice qué). Wrap en ~72 chars por línea.

```
feat(identity): forgot-password backend (US-033-i)

Anti-enumeración: el endpoint siempre responde 204, sin importar si el
email existe / está verificado / está deshabilitado. La decisión de
mandar mail vive en el handler, no en el endpoint.

Rate limit 5/h por IP hasheada en Redis.
```

### Footer

Tags especiales:
- `BREAKING CHANGE: descripción`: marca breaking change. Aparece en CHANGELOG con `**(BREAKING)**`.
- `[skip changelog]`: opt-out del auto-append (útil para reverts manuales o syncs).

### Reglas duras

- **Una sola unidad de trabajo por commit.** Si el commit hace dos cosas, son dos commits. Si lo amerita, dos PRs.
- **Subject empieza en minúscula.** Si por convención del nombre propio ("NetArchTest", "Playwright") tendría que ser mayúscula, **reformulá la frase** para que empiece con palabra común. La regla pr-title.yml es estricta: regex `^(?![A-Z]).+$`. Ya nos mordió 2 veces (US-T02, US-T04).
- **Body es para el porqué.** Diferenciá lo que es decisión del autor vs lo que el diff hace obvio. La gente lee `git log` para entender por qué.

## Branching

### Formato canónico

```
<type>/<scope-description>
```

- **type**: igual que Conventional Commits.
- **scope-description**: descriptor en kebab-case del cambio. Suficientemente específico como para identificar el branch entre 10 abiertos. Sin US numbers.

### Ejemplos válidos

```
feat/identity-forgot-password
feat/identity-resend-verification
fix/moderation-threshold
docs/adr-git-workflow
docs/rollback-policy
docs/git-workflow-rules
ci/workflow-improvements
ci/changelog-auto-append
test/identity-handler-units
test/architecture-rules-netarchtest
fix/changelog-workflow-multi-commit
```

### Ejemplos inválidos (no hacer)

```
feat/T04-architecture-tests          ← US number en branch (US-T04)
feat/us033-forgot-password            ← idem
feat/us-T01-frontend-testing          ← idem
feature/identity-register             ← "feature" no es Conventional Commits type
feat/Identity-Register                ← MAYÚSCULA en scope
identity-forgot-password              ← falta el type
```

### Reglas duras

- **NUNCA poné el ID de US en el branch name.** Las US se referencian en commit body y PR body. Branch name es scope técnico, no tracking de proyecto.
- **NUNCA crees branches desde otra branch que no sea `main`.** Si necesitás trabajar sobre un PR todavía no mergeado de otro, esperá a que mergee. Si es urgente, charlamos.
- **Branch corta + única**: una unidad de trabajo, una branch, un PR. Si el trabajo crece, abrí un nuevo PR (no apiles 5 features en una branch).
- **Branches efímeras**: nacen para un PR, mueren al merge. Borrar local + remote tras merge:
  ```bash
  git branch -d feat/identity-forgot-password         # local
  git push origin --delete feat/identity-forgot-password   # remote (si no se borró auto)
  ```

## Resolución de conflictos

### Antes de pushear: rebase sobre main

Si tu branch quedó atrás de `main` (porque mergeaste otra cosa entre tanto):

```bash
git fetch origin main
git rebase origin/main
```

Si hay conflictos:
1. Git pausa en el commit conflictivo. `git status` muestra los archivos en conflicto.
2. Editar cada archivo, decidir qué versión queda. Buscar marcadores `<<<<<<<`, `=======`, `>>>>>>>`.
3. Tras editar:
   ```bash
   git add <archivo-resuelto>
   git rebase --continue
   ```
4. Si la cosa se complica y querés abortar:
   ```bash
   git rebase --abort
   ```
5. **Correr tests local antes de re-pushear** (`just ci` o al menos los del área tocada). El rebase puede haber introducido un bug que el test atrapa.

### Force-push al PR (con cuidado)

Tras un rebase, tu branch local diverge del remote → `git push` falla. Necesitás force-push **a tu propia branch**:

```bash
git push --force-with-lease origin <tu-branch>
```

`--force-with-lease` es como `--force` pero falla si alguien pusheó sobre tu branch entre tanto (cuando colaboramos eventualmente). Default safe.

**NUNCA force-push a `main`.** Branch protection lo bloquea, pero la regla mental también está acá.

### Conflictos en el merge UI de GitHub

Si GitHub dice "merge conflict" en el PR:
1. **NO uses la UI de GitHub para resolver** (genera merge commits y rompe la convención de Rebase and merge per ADR-0026).
2. Resolver local con el flow de arriba (`git fetch + rebase + force-push-with-lease`).

### Después de un revert: caveat

Si revertiste un commit y querés volver a aplicarlo después: NO basta con cherry-pick del commit revertido. Git considera que ya está aplicado (porque el revert lo deshizo, pero el SHA original está en historia). Tenés que `git revert <sha-del-revert>` para volver a aplicar el cambio original.

## Merging

### Estrategias permitidas (Fases 1-5)

Per [ADR-0026](../decisions/0026-git-workflow-github-flow-con-rebase.md):
- **Rebase and merge**: default. Preserva commits atómicos. Historia lineal.
- **Squash and merge**: sólo si el PR tiene WIP / fixup commits que no aportan al history.
- **Merge commit (Create a merge commit)**: **deshabilitado en branch protection.** No usar.

### Antes de mergear

- [ ] CI verde. Branch protection enforcea: `Backend (.NET 10)`, `Frontend (Next.js 15 / Bun)`, `Validate every commit message`, `Validate PR title`. Sin esos, el merge button está deshabilitado.
- [ ] Conversaciones del PR resueltas (branch protection lo enforce).
- [ ] PR title es Conventional Commit válido (especialmente importante si Squash, porque pasa a ser el commit en main).

### Squash merge: caveat de title

Cuando squasheás, **el PR title se vuelve el commit en main**. Por eso `pr-title.yml` valida que el title cumpla CC. Si tu title está mal, el commit final también lo está → `changelog.yml` lo procesa mal o lo skipea.

### Después de mergear

```bash
git checkout main
git pull origin main
git branch -d <tu-branch>           # local
# Remoto se borra automáticamente si tenés "Automatically delete head branches" en repo settings.
```

## Workflow completo: ejemplo

Imaginá que vas a empezar US-013 (Cargar historial manual):

```bash
# 1. Sincronizar main
git checkout main
git pull origin main

# 2. Crear branch (NO incluye "us013" en el nombre)
git checkout -b feat/enrollments-historial-manual

# 3. Trabajar, commitear con CC válidos
git add modules/enrollments/...
git commit -m "$(cat <<'EOF'
feat(enrollments): cargar historial manual (US-013)

Endpoint POST /api/enrollments/historial que acepta una lista de
materias aprobadas + fechas. Persiste como EnrollmentRecord con
source=manual.
EOF
)"

# 4. Pushear + abrir PR
git push -u origin feat/enrollments-historial-manual
gh pr create --base main \
  --title "feat(enrollments): cargar historial manual (US-013)" \
  --body "Closes US-013. ..."

# 5. Si CI rojo o pediste cambios:
#    - editar archivos
#    - git add + git commit (otro commit, NO --amend salvo que sea fixup)
#    - git push (sin --force, porque sólo agregué commits)

# 6. Si main avanzó mientras: rebase + force-push
git fetch origin main
git rebase origin/main
# resolver conflicts si los hay, correr tests
git push --force-with-lease

# 7. Cuando CI verde + reviewer OK (o solo, en pre-MVP), mergear con Rebase
gh pr merge --rebase

# 8. Limpieza
git checkout main
git pull origin main
git branch -d feat/enrollments-historial-manual
```

## Anti-patterns observados (history)

Errores reales que cometí + lección:

| Error | Cuándo | Lección |
|---|---|---|
| `feat/t01-frontend-testing-infra` (branch con US ID) | US-T01 | Branch name = scope, no tracking. Sería `feat/frontend-testing-infra`. |
| `feat/t04-backend-architecture-tests` | US-T04 | Idem. |
| PR title `feat(test): Playwright e2e infra` (P mayúscula) | US-T02 | pr-title.yml subjectPattern es `^(?![A-Z]).+$`. Reformular o usar otra palabra. |
| PR title `test(backend): NetArchTest rules ...` (N mayúscula) | US-T04 | Mismo bug, segunda vez. Doblé el cuidado. |
| Mergeé US-033 (PR #29) antes que el fix del workflow (PR #30) | post-T05 | Si dos PRs son interdependientes, mergeá el "infra" primero. Mi fault: lo invertí y main quedó con changelog perdido (lo arreglé con backfill manual). |
| `git revert <sha>` en main directo cuando branch protection no lo permitía | después de un PR mal mergeado | Aún para rollback, ir por PR. |

## Cuando rompés una regla

A veces hay razones legítimas (ej. el bot de Dependabot no respeta el subjectPattern → fix con `if: ... actor != 'dependabot[bot]'` en lugar de cambiar la regla). Cuando eso pasa:

1. Documentá el por qué en el commit / PR / ADR.
2. Si el work-around es estable, codificalo en el workflow / hook.
3. Si es one-off (excepción justificada), agregá nota a este doc.

No silenciar la regla "porque sí".

## Refs

- [ADR-0026](../decisions/0026-git-workflow-github-flow-con-rebase.md): la decisión arquitectónica detrás de Rebase + Conventional Commits.
- [ADR-0037](../decisions/0037-changelog-automation-auto-append.md): cómo los commits alimentan CHANGELOG.
- [ADR-0038](../decisions/0038-release-and-versioning-policy.md): release & versioning policy.
- [docs/operations/rollback.md](rollback.md): qué hacer cuando algo entra a main y rompe.
- `.github/workflows/{commits,pr-title}.yml`: enforcement automatizado.
- `lefthook.yml`: enforcement local (commit-msg, pre-commit format).
