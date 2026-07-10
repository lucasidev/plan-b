---
paths:
  - "backend/modules/**/Features/**/*Endpoint.cs"
  - "backend/modules/**/Infrastructure/Reading/**/*.cs"
---

# Security (planb)

Estás tocando un endpoint o un read con Dapper. Las dos cosas que se rompen acá y un test no las caza solo:

## Auth/gating en endpoints

No hay default seguro: cada endpoint declara su acceso explícito, o queda abierto.

- **Público de verdad** (catálogo, sign-in, register): `.AllowAnonymous()`.
- **Autenticado** (cualquier user logueado): `.RequireAuthorization()`. El user sale del JWT con `CurrentUser.RequireUserId(http)` (claim `sub`), nunca del body.
- **Staff/rol**: `.RequireAuthorization(p => p.RequireRole(ModerationPolicy.StaffRoles))` (Moderator/Admin) o `AdminTeacherPolicy.RoleName` (Admin). Nunca hardcodees el string del rol: usá la policy.

Regla que se olvida: **si el endpoint muta o expone datos de un user o de staff, NO puede ser `AllowAnonymous`.** Ante la duda, gatealo. Detalle del flujo JWT en [ADR-0023](../../docs/decisions/0023-auth-flow-jwt-cookie-layout-guards.md).

## Injection en reads Dapper

Todo parámetro va **parametrizado** (`WHERE id = @Id` con `new { Id }`), nunca interpolado en el string SQL. Un solo `$"...{value}..."` dentro de un SQL es una vulnerabilidad de inyección. Ver skill `dapper-read`.
