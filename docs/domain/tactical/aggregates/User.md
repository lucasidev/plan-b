# User (Identity)

**Tipo**: rich
**BC**: Identity
**Root ID**: `UserId`
**Child entities**: `VerificationToken` (collection, parametrizada por `purpose`)

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Register(email, passwordHash, clock)` | Visitor en signup público | Factory; crea User con `role=member`, `email_verified_at=null`. Emite `UserRegistered`. |
| `CreateStaff(email, passwordHash, role, clock)` | Admin desde backoffice | Factory; crea User con `role IN (moderator, admin, university_staff)`, `email_verified_at=now` (auto-verified). Emite `StaffUserCreated`. |
| `IssueVerificationToken(rawValue, purpose, ttl, clock)` | Application service del flow de email verification | Invalida tokens activos del mismo `purpose`; agrega un token nuevo. Emite `VerificationTokenIssued` (+ `VerificationTokenInvalidated` si había activos). |
| `MarkEmailVerifiedFor(rawValue, clock)` | Endpoint de verificación de email | Busca token con `purpose=UserEmailVerification`, valida (no consumed, no invalidated, no expired), lo consume, marca `email_verified_at=now`. Emite `VerificationTokenConsumed` + `UserEmailVerified`. |
| `Disable(byId, reason, clock)` | Admin desde backoffice | Setea `disabled_at`. Emite `UserDisabled` (también integration event). |
| `Restore(clock)` | Admin desde backoffice | Limpia `disabled_at`. Emite `UserRestored`. |
| `ExpireUnverifiedRegistration(clock)` | Job de expiración | Setea `expired_at` (terminal); libera el email para re-registro. Emite `UnverifiedRegistrationExpired`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `UserRegistered` | Después de `Register` | Identity (envío de mail de verificación) |
| `StaffUserCreated` | Después de `CreateStaff` | Identity (audit), notificación opcional al staff |
| `UserEmailVerified` | Después de `MarkEmailVerifiedFor` exitoso | Identity (telemetría de funnel) |
| `UserDisabled` | Después de `Disable` | Identity local + traducido a `UserDisabledIntegrationEvent` para Reviews y Moderation |
| `UserRestored` | Después de `Restore` | Identity (audit) |
| `UnverifiedRegistrationExpired` | Después de `ExpireUnverifiedRegistration` | Identity (audit) |
| `VerificationTokenIssued` | Cuando se agrega un token al collection | Identity (envío de mail si purpose=UserEmailVerification) |
| `VerificationTokenConsumed` | Cuando un token se consume exitosamente | Identity (audit, telemetría) |
| `VerificationTokenInvalidated` | Cuando un token activo del mismo purpose se invalida (resend, force expire) | Identity (audit) |

### 3. Invariantes que protege

- `Email` único entre users non-expired (índice único parcial `WHERE expired_at IS NULL`).
- `PasswordHash` no vacío.
- State machine `email_verified_at`: NULL hasta verificación; una vez set, no se re-asigna.
- State machine `disabled_at` y `expired_at`: terminal states, mutuamente compatibles según flow.
- Como mucho un `VerificationToken` activo por `purpose` (invariante interno multi-objeto): cuando se emite uno nuevo, los anteriores activos del mismo purpose se invalidan en la misma operación.
- `MarkEmailVerifiedFor(rawValue)` busca el token, lo consume y marca al user verified de forma atómica.

### 4. Cómo se carga / identifica

- Root ID: `UserId`.
- Lookup primario: por `UserId` en repositorio.
- Lookup secundario: por `EmailAddress` (uniqueness check + login).
- Carga eager de children: la collection de `VerificationToken` se carga junto con el aggregate (al menos los activos / no terminales).
- Persistencia: EF Core schema `identity`. Tablas `users` y `verification_tokens` (FK a `users.id`).

### 5. Boundary

- Quedan afuera: StudentProfile y TeacherProfile (aggregates separados que referencian `UserId` por valor).
- Cross-aggregate validations (ej. "User está verificado al crear StudentProfile") se validan en application service vía `IIdentityQueryService`, no atravesando el aggregate de User.
- VerificationToken con `purpose=TeacherInstitutionalVerification` vive en `TeacherProfile`, no acá: mismo type de child entity reusado en otro aggregate.

## Value Objects propios

- `EmailAddress`: email validado y normalizado. `Create(raw)` devuelve `Result<EmailAddress>`. Validaciones: no vacío, length ≤ 254, formato `local@domain` con punto en domain, lowercase normalization. Expone `Domain` para chequeos institucionales. Candidato a shared kernel si otros BCs lo necesitan.
- `UserRole`: enum `Member | Moderator | Admin | UniversityStaff`. Mapeado a Postgres native enum (ver [ADR-0008](../../../decisions/0008-roles-exclusivos-profiles-como-capacidades.md)).
- `TokenPurpose`: enum `UserEmailVerification | TeacherInstitutionalVerification`. Parametriza al child `VerificationToken`.
- `PasswordHash`: wrapper sobre string del hash Argon2/BCrypt. No vacío, formato del algoritmo. (Implementación concreta vive en Identity domain.)

## Refs

- BC: [Identity](../../strategic/bounded-contexts.md#identity)
- ADRs: [ADR-0008](../../../decisions/0008-roles-exclusivos-profiles-como-capacidades.md), [ADR-0033](../../../decisions/0033-verification-token-como-child-entity.md)
- User Stories: [US-010-b](../../user-stories/US-010-b.md), [US-011-b](../../user-stories/US-011-b.md), [US-013](../../user-stories/US-013.md), [US-014](../../user-stories/US-014.md), [US-080](../../user-stories/US-080.md)
