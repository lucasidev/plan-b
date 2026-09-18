---
name: ship
description: Prepara un cambio para shippear y, después de cada aprobación explícita, completa push, PR, merge y limpieza de ramas sin saltarse CI.
---

Preparás el cambio actual para shippear. Cada aprobación habilita una sola acción externa: nunca reutilices un OK anterior para el push o el merge.

## Preparar

1. **Verificar por impacto** con `just verify --plan` y ejecutar los checks que correspondan con `just verify` o `--only <check>`. El selector comparte la política de CI y reutiliza resultados vigentes por inputs. No repetir un verde porque cambió el SHA, hubo un rebase o llegó el momento del push. Integración y E2E locales son opcionales; elegirlos por el riesgo del cambio y la evidencia disponible. `--force` repite los seleccionados y `--full` fuerza todos. Si Lucas elige CI, usar `--ci-only` o `PLANB_VERIFY_MODE=ci` para el hook y registrar lo pendiente. Un fallo se diagnostica; en remoto se reintentan solo jobs fallidos con `gh run rerun <id> --failed`. Una suite parcial nunca cuenta como verde. Delegar a `test-runner` solo si permite avanzar en otra tarea útil. Ver `docs/engineering/testing.md`.
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
