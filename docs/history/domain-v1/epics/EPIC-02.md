# EPIC-02: Identidad y autenticación

**Status**: In progress
**BCs involved**: Identity primario

## Capability

Registrarse, verificar email, loguearse, cerrar sesión, gestionar la cuenta básica. Es el muro entre Visitor y Member.

## User Stories

### Sprint S0 (done)
- [US-010-b](../stories/US-010-b.md): Register backend
- [US-011-b](../stories/US-011-b.md): Verify email backend

### Sprint S1 (current: auth slice end-to-end + cleanup)
**Done:**
- [US-010-f](../stories/US-010-f.md): Register frontend (sign-up tab del AuthView)
- [US-011-f](../stories/US-011-f.md): Verify email frontend (rehecho con design system)
- [US-028-b](../stories/US-028-b.md): Login backend
- [US-028-f](../stories/US-028-f.md): Login frontend (sign-in tab del AuthView)
- [US-029-i](../stories/US-029-i.md): Sign-out integrated

**Pending (added in S1 mid-sprint replan):**
- [US-021-b](../stories/US-021-b.md): Resend verification backend
- [US-021-f](../stories/US-021-f.md): Resend verification frontend
- [US-022-b](../stories/US-022-b.md): Expirar registros no verificados (backend)
- [US-022-i](../stories/US-022-i.md): Expirar registros no verificados (infra: migrations + scheduling)
- [US-033-i](../stories/US-033-i.md): Recuperación de contraseña (integrated)

### Sprint S1 (perfil)
- [US-012-b](../stories/US-012-b.md): Crear StudentProfile (backend): frontend diferido a una US separada cuando aterrice JwtBearer middleware en backend

### Backlog
- [US-035](../stories/US-035.md): Sign-in con Google (OAuth)
- [US-058](../stories/US-058.md): Deshabilitar cuenta member

## Decisiones que la condicionan

- [ADR-0008](../../../decisions/0008-exclusive-roles-with-profiles-as-capability-unlockers.md): roles exclusivos, profiles como capacidades
- [ADR-0023](../../../decisions/0023-auth-flow-jwt-cookie-layout-guards.md): auth flow JWT cookie + layout guards
- [ADR-0033](../../../decisions/0033-verification-token-as-a-child-entity.md): VerificationToken como child entity
- [ADR-0034](../../../decisions/0034-redis-as-cache-and-ephemeral-state.md): Redis para refresh tokens + rate limiting
