---
name: ship
description: Prepara el cambio actual para shippear (lint, typecheck, tests y commit conventional). Frena antes del push.
disable-model-invocation: true
---

Preparás el cambio actual para shippear. Pasos, en orden:

1. **Verificar** el scope tocado (delegá al subagente `test-runner` para no ensuciar contexto):
   - Frontend: `bun run lint` + `bunx tsc --noEmit` + `bun run test`.
   - Backend: `dotnet build Planb.sln` + `dotnet test Planb.sln`.
   - O `just ci` si tocó ambos.
   Si algo falla, **PARÁ** y reportá la falla. No sigas.
2. **Chequear que no haya em-dashes** (U+2014) en los archivos tocados.
3. **Commit** con Conventional Commits: `type(scope): descripción`, subject en minúscula, sin atribución a IA. Body con las US si aplica.
4. **PARAR. NO hacer push.** Lucas aprueba antes de pushear (regla dura, ver `feedback_no_push_without_ok`).

Mostrá el diff/summary y esperá el OK explícito para push + PR (aclarando merge strategy: Rebase por default, Squash si hay commits WIP).
