---
name: ship
description: Prepara un cambio para shippear y, después de cada aprobación explícita, completa push, PR, merge y limpieza de ramas sin saltarse CI.
---

Preparás el cambio actual para shippear. Cada aprobación habilita una sola acción externa: nunca reutilices un OK anterior para el push o el merge.

## Preparar

1. **Verificar** el scope tocado (delegá al subagente `test-runner` para no ensuciar contexto):
   - Frontend: `bun run lint` + `bunx tsc --noEmit` + `bun run test`.
   - Backend: `dotnet build Planb.sln` + `dotnet test Planb.sln`.
   - O `just ci` si tocó ambos.
   Si algo falla, **PARÁ** y reportá la falla. No sigas.
2. **Commit** con Conventional Commits: `type(scope): descripción`, subject en minúscula, sin atribución a IA. Body con las US si aplica.
3. **PARAR. NO hacer push.** Lucas aprueba explícitamente antes de cada push.

Mostrá el diff/summary y esperá el OK explícito para push + PR (aclarando merge strategy: Rebase por default, Squash si hay commits WIP).

## Después del OK para push

1. Pusheá la rama y creá o actualizá el PR.
2. Esperá CI y reportá su estado. CI rojo bloquea el merge.
3. **PARAR. NO mergear.** El merge necesita un OK explícito nuevo.

## Después del OK para merge

1. Confirmá CI verde y conversaciones resueltas.
2. Mergeá con Rebase por default o Squash si el PR conserva commits WIP. Con GitHub CLI, incluí `--delete-branch`.
3. Actualizá `origin/main` y verificá que el branch no conserve parches únicos con `git cherry origin/main <branch>`.
4. Borrá la rama local. Si Rebase o Squash cambió los hashes, `-D` solo está permitido después de verificar que no queda ninguna línea `+`.
5. Retirá o archivá el worktree terminado. Ejecutá `bun scripts/cleanup-agent-branches.ts --base origin/main --apply` para borrar ramas auxiliares ya integradas.
6. Terminá únicamente cuando `git worktree list` y `git branch --list` no muestren residuos del trabajo cerrado. Una rama activa o con un parche único se conserva y se reporta.
