# EPIC-02: Identidad y autenticación

**Status**: In progress
**BCs involved**: Identity primario

## Capability

Registrarse, verificar email, loguearse, gestionar la cuenta básica. Es el muro entre Visitor y Member. En progreso: slices A+B done (US-010 backend + frontend), slices C/D/E pendientes (verify email, profile, disable, resend, expire).

## User Stories

- [US-010-b](../user-stories/US-010-b.md): Register backend
- [US-010-f](../user-stories/US-010-f.md): Register frontend
- [US-011-b](../user-stories/US-011-b.md): Verify email backend
- [US-011-f](../user-stories/US-011-f.md): Verify email frontend
- [US-012](../user-stories/US-012.md): Crear StudentProfile
- [US-021](../user-stories/US-021.md): Reenviar verification email
- [US-022](../user-stories/US-022.md): Expirar registro no verificado
- [US-068](../user-stories/US-068.md): Deshabilitar cuenta member

## Decisiones que la condicionan

- [ADR-0008](../../decisions/0008-roles-exclusivos-profiles-como-capacidades.md): roles exclusivos, profiles como capacidades
- [ADR-0023](../../decisions/0023-auth-flow-jwt-cookie-layout-guards.md): auth flow JWT cookie + layout guards
- [ADR-0033](../../decisions/0033-verification-token-como-child-entity.md): VerificationToken como child entity
