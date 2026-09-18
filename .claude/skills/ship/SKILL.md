---
name: ship
description: Prepara el cambio actual para shippear (lint, typecheck, tests y commit conventional). Frena antes del push.
disable-model-invocation: true
---

Preparás el cambio actual para shippear. Pasos, en orden:

1. **Verificar por impacto** con `just verify --plan` y ejecutar los checks que correspondan con `just verify` o `--only <check>`. El selector comparte la política de CI y reutiliza resultados vigentes por inputs. No repetir un verde porque cambió el SHA, hubo un rebase o llegó el momento del push. Integración y E2E locales son opcionales; elegirlos por el riesgo del cambio y la evidencia disponible. `--force` repite los seleccionados y `--full` fuerza todos. Si Lucas elige CI, usar `--ci-only` o `PLANB_VERIFY_MODE=ci` para el hook y registrar lo pendiente. Un fallo se diagnostica; en remoto se reintentan solo jobs fallidos con `gh run rerun <id> --failed`. Una suite parcial nunca cuenta como verde. Delegar a `test-runner` solo si permite avanzar en otra tarea útil. Ver `docs/engineering/testing.md`.
2. **Commit** con Conventional Commits: `type(scope): descripción`, subject en minúscula, sin atribución a IA. Body con las US si aplica.
3. **PARAR. NO hacer push.** Lucas aprueba antes de pushear (regla dura, ver `feedback_no_push_without_ok`).

Mostrá el diff/summary y esperá el OK explícito para push + PR (aclarando merge strategy: Rebase por default, Squash si hay commits WIP).
