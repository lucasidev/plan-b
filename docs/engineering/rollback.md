# Rollback playbook

Cuándo y cómo deshacer un cambio que rompió main.

Living doc. Cuando aterrice deploy (Fase 6+) se va a expandir con sección "rollback de deploy" + "rollback de DB en prod". Por ahora cubre sólo lo aplicable pre-deploy.

Decisión que la motiva: estamos pre-deploy, sin branch protection estricta histórica, y CI corre tanto en PR como post-merge (push:main). Eso significa que **un PR con CI pre-merge verde puede aterrizar en main y romper el CI post-merge** (e.g. Squash que cambia el commit final, race conditions, workflows que no corren en PR como `e2e.yml` on-demand).

## Política: revert first, investigate after

Cuando CI **post-merge** queda en rojo en main:

1. **Notificación**: GitHub te manda mail + el badge de Actions queda rojo.
2. **Decidir**: ¿bug obvio que arreglo en 5 min o complicado?
3. **Si es chico** → forward fix. PR nuevo con el arreglo, mergear ese.
4. **Si NO es chico** → revertir primero. Volvemos main a verde, investigamos tranquilo, y abrimos PR nuevo con la solución cuando esté lista.

La regla por default cuando dudás: **revert**. Main verde es el estado por default. Mantenerlo así protege a quien venga después y haga `git pull origin main`.

## Rollback de código

### Caso típico: revertir el merge de un PR

```bash
# 1. Identificar el merge commit en main que querés revertir
git fetch origin main
git log origin/main --oneline | head -5
# ej: af4a527 feat(test): playwright e2e infra (US-T02)

# 2. Estar en main al día
git checkout main
git pull origin main

# 3. Revertir
git revert <sha> --no-edit
# Si fue Rebase merge con N commits, revert te pide ir uno por uno con
# `git revert <sha-base>..<sha-tip>` o iterar manualmente. Si fue Squash,
# es un solo revert.

# 4. Push directo a main
git push origin main
```

Esto crea un commit nuevo `Revert "<original title>"` que **deshace los cambios sin reescribir historia**. Auditable, reversible (podés revertir el revert para reaplicar el cambio).

### Quirk con el changelog auto-append

Nuestro workflow `changelog.yml` (ADR-0037) mapea commits `revert:` a la sección **"Removed"** del CHANGELOG. Eso deja rastro:

```markdown
## [Unreleased]

### Added
- foo (frontend): abc123

### Removed
- "feat(frontend): foo (commit abc123)": def456 **(BREAKING)**
```

Si el commit del revert no tiene type `revert:` (e.g. `Revert "feat(test): ..."`), el script no lo procesa porque no matchea el regex de Conventional Commits. Si querés que entre al CHANGELOG, editá el title:

```bash
git commit --amend -m "revert: feat(test): playwright e2e infra (US-T02)" --no-edit
```

### Rollback parcial con `git revert <range>`

Si varios commits seguidos en main rompieron algo y querés revertir todos:

```bash
git revert <sha-anterior-al-problema>..HEAD --no-edit
```

Cada commit se revierte como uno nuevo. Si hay conflicts en algún paso, `git revert --abort` y resolver de a uno.

### Si el revert tiene conflicts

Pasa cuando alguien mergeó algo encima del PR que querés revertir y hay overlap. `git revert --abort` y considerá si:
- El commit más reciente DEBE quedar (resolver el conflict manualmente).
- O si conviene revertir ambos (`git revert <both>`).

## Rollback de DB schema (migraciones EF Core)

```bash
cd backend

# Ver migraciones aplicadas
dotnet ef migrations list \
  --project modules/identity/src/Planb.Identity.Infrastructure \
  --startup-project host/Planb.Api

# Volver a una migración previa (corre los Down() en orden inverso)
dotnet ef database update <migration-anterior> \
  --project modules/identity/src/Planb.Identity.Infrastructure \
  --startup-project host/Planb.Api

# Si la migración rota todavía no se commiteó / no aterrizó en otros DBs:
dotnet ef migrations remove \
  --project modules/identity/src/Planb.Identity.Infrastructure \
  --startup-project host/Planb.Api
```

**Caveat**: si el `Down()` de la migración está mal escrito (no es rollback-safe), `database update <previa>` falla. Hoy no hay test automático para `Down()` correctness: es responsabilidad del autor de la migración escribir uno consistente.

**En dev local**: si todo se rompió y querés empezar de cero, `just infra-reset` (volca volúmenes + relevanta containers + recrea DB).

## Hitos narrativos como anchor de rollback

ADR-0038 permite tags manuales para hitos. Si vas a hacer un cambio grande y querés un punto de retorno:

```bash
# Antes del cambio
git tag pre-academic-refactor -m "Snapshot estable antes de mover Academic BC"
git push origin pre-academic-refactor

# Si después necesitás volver
git diff pre-academic-refactor HEAD            # ver qué cambió
git revert pre-academic-refactor..HEAD --no-edit  # revertir todo desde el tag
git push origin main
```

Estos tags **no son releases** y no aparecen en CHANGELOG.

## Lo que NO podemos rollbackear (todavía)

| Cosa | Por qué |
|---|---|
| Deploy en prod a versión previa | No hay deploy. Llega con Fase 6 (Dokploy). |
| DB de prod desde backup | No hay prod DB todavía. |
| Feature toggles sin redeploy | No hay deploy ni feature flags. Considerar GrowthBook cuando aterrice deploy. |
| Cookies / sessions emitidas a usuarios | Mitigado parcialmente con `IRefreshTokenStore.RevokeAllForUserAsync` (ADR-0034 + US-033 infra). Si una vulnerabilidad aterriza, podemos invalidar todas las sesiones de un user. |

## Checklist post-rollback

Después de revertir un commit problemático, antes de cerrar el incidente:

- [ ] CI volvió a verde en main.
- [ ] `git log origin/main` muestra el revert claramente attribuido.
- [ ] Si el cambio rollbackeado era de migration: corrió `just migrate` localmente y la DB queda consistente.
- [ ] Si el cambio rollbackeado tocaba CHANGELOG: el revert apareció en "Removed" automáticamente, o lo agregaste manualmente si el script no lo capturó.
- [ ] Issue / PR / nota para investigar la causa raíz. El revert NO es la solución, sólo gana tiempo.

## Refs

- [ADR-0026](../decisions/0026-git-workflow-github-flow-con-rebase.md): git workflow.
- [ADR-0027](../decisions/0027-integration-tests-shared-postgres.md): cómo se manejan DBs en tests (no aplicable a prod, pero relevante para entender el modelo).
- [ADR-0034](../decisions/0034-redis-como-cache-y-ephemeral-state.md): refresh token revocation (rollback de auth state).
- [ADR-0036](../decisions/0036-testing-pyramid-cross-stack.md): testing layers que protegen pre-merge.
- [ADR-0037](../decisions/0037-changelog-automation-auto-append.md): cómo el revert entra al changelog.
- [ADR-0038](../decisions/0038-release-and-versioning-policy.md): tags narrativos como anchor.
