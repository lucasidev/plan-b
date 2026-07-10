---
name: e2e-zone
description: Recordá y ejecutá la regla de zona E2E de planb antes de pedir OK para commit o push. Usalo SIEMPRE que un cambio toque rutas reales del frontend (páginas, layouts, server actions, navegación, auth o gating por rol): hay que correr el spec E2E en modo visible (o verificar manual en el browser) y mostrar el output ANTES de pedir OK, porque verde en build/lint/types no prueba que el flujo ande end-to-end.
---

Aplicás la regla de zona E2E. Es una regla CULTURAL, no tooling: si un slice toca rutas reales, verde en lint/types/unit NO alcanza. Hay que ver el flujo correr.

## Cuándo aplica

El cambio toca rutas reales: una página nueva o modificada, un layout o guard, una server action que muta, navegación entre vistas, auth o gating por rol. Si el diff es solo un componente aislado o lógica pura sin ruta, no hace falta.

## Cómo se corre en modo visible

El E2E visible (headed, con slow-motion para que se vea) se corre con la recipe del Justfile:

```bash
just frontend-test-e2e-show <path-al-spec>
```

Que por dentro corre `bunx playwright test --headed` con `PLAYWRIGHT_SLOWMO`. Ejemplos:

```bash
just frontend-test-e2e-show e2e/auth/sign-in.spec.ts
just frontend-test-e2e-show --grep "happy path"
```

Los specs viven en `frontend/e2e/`. Reusá las personas pre-seeded de `frontend/e2e/helpers/personas.ts` (matchean el seed del backend), no crees usuarios nuevos: la DB E2E es compartida y se ensucia.

## El gate

1. Corré el spec de la zona que tocaste (o verificá manual en el browser si no hay spec).
2. **Mostrá el output** (o el resultado del browser) a Lucas.
3. Recién ahí pedí OK para commit/push.

Si no levantaste el feature y lo viste andar end-to-end, decilo explícito arriba del PR: "no lo probé end-to-end". Build verde no es "funciona".
