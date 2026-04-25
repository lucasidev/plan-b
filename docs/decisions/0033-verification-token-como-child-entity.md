# ADR-0033: VerificationToken como child entity (no aggregate independiente)

- **Estado**: aceptado
- **Fecha**: 2026-04-25

## Contexto

Slice B implementó `EmailVerificationToken` como **aggregate independiente** — propio repositorio, propio Entity con IAggregateRoot, separado del aggregate `User`. Discovery del dominio reveló que esta separación es incorrecta: hay invariantes cross-objects (User + Token) que merecen consistencia atómica.

Discovery también identificó que el mismo shape de token se reusará para verificación de email institucional de docentes (UC-031). Pregunta abierta: ¿el token es un type específico por contexto, o uno genérico parametrizado?

Tres modelos posibles:

- **A — Aggregate independiente** (lo que está en código hoy): `EmailVerificationToken` aggregate root, repositorio propio. Cross-aggregate invariants ("un solo activo por user") via app service / saga.
- **B — Aggregate genérico independiente**: `VerificationToken` aggregate parametrizado por `purpose`, repositorio propio. Mismo problema de cross-aggregate invariants.
- **C — Child entity dentro del aggregate-owner**: `VerificationToken` entity (sin IAggregateRoot, sin repositorio) que vive dentro de `User` o de `TeacherProfile`. Invariantes ("un solo activo por purpose") quedan internos al aggregate root.

## Decisión

**Modelo C: VerificationToken como child entity, parametrizada por `Purpose` enum.**

```csharp
// Domain/Identity/Users/User.cs
public sealed class User : Entity<UserId>, IAggregateRoot
{
    private readonly List<VerificationToken> _verificationTokens = [];
    public IReadOnlyCollection<VerificationToken> VerificationTokens => _verificationTokens;

    public void IssueVerificationToken(string rawValue, TokenPurpose purpose, TimeSpan ttl, IDateTimeProvider clock)
    {
        InvalidatePendingTokensFor(purpose, clock);  // invariante interno
        _verificationTokens.Add(VerificationToken.Issue(rawValue, purpose, ttl, clock));
        Raise(new VerificationTokenIssuedDomainEvent(...));
    }

    public Result MarkEmailVerifiedFor(string rawValue, IDateTimeProvider clock)
    {
        var token = _verificationTokens.SingleOrDefault(t =>
            t.Value == rawValue && t.Purpose == TokenPurpose.UserEmailVerification);
        // ... validate, consume, mark user verified — atomic
    }
}

// Child entity — no IAggregateRoot, no repositorio
internal sealed class VerificationToken : Entity<VerificationTokenId>
{
    public string Value { get; private set; }
    public TokenPurpose Purpose { get; private set; }
    // state: issued / consumed / invalidated / (implicit) expired
}
```

`TeacherProfile` aggregate sigue el mismo patrón con `purpose=TeacherInstitutionalVerification`.

### Razonamiento del cambio respecto a slice B

El test de Khorikov / Mantinband: **"¿Necesito cargar este objeto independientemente?"** Si la respuesta es no, es child entity, no aggregate.

Para VerificationToken:

1. **Cuando llega `?token=<rawValue>`**, conceptualmente queremos "el User dueño de este token pendiente". No queremos el token *desconectado* de su user. La query natural es "find user with pending token X".

2. **El invariante "un solo token activo por purpose"** es interno al User. Si tokens fueran aggregates, ese invariante requiere coordinación cross-aggregate (saga). Con tokens como child entities, el User aggregate lo enforce trivialmente al iterar su collection antes de issue.

3. **"Consume token + marca user verified" es una sola transición de negocio**. Si fueran aggregates separados, requiere transactional consistency cross-aggregate (eventual o vía outbox). Con child entity, es atómico al SaveChanges del User aggregate.

4. **Token no tiene meaning sin User**: existe para verificar al user. Su lifecycle es derivado del lifecycle del user. No hay queries "todos los tokens del sistema" — siempre se accede vía un user específico.

## Alternativas consideradas

### A — Aggregate independiente especializado por contexto (`EmailVerificationToken`)

Lo que tenemos en código de slice B. Funciona — el handler usa app service para cross-aggregate. Pero:

- Pierde atomicidad de "consume + verify".
- Repository y aggregate boundary innecesarios.
- Cuando agreguemos teacher institutional verification, duplicamos: `TeacherInstitutionalVerificationToken` aggregate. Dos clases con la misma lógica.

### B — Aggregate genérico independiente (`VerificationToken` con `purpose`)

Mejor que A (no duplica), pero sigue teniendo los problemas de cross-aggregate invariants. Sin atomicidad.

### C — Child entity (elegido)

Único modelo donde el invariante "un solo activo por purpose por user" se enforce sin saga. Único modelo donde "consume + verify" es atómico. Mismo type de entity reusable parametrizada por purpose.

## Consecuencias

**Positivas**:

- Atomicidad: consume + verify en una transacción del User aggregate.
- Invariante "un solo activo por purpose" es trivial — el aggregate root itera y enforce.
- Reuso para teacher claim: mismo `VerificationToken` entity, distinto purpose, vive dentro de `TeacherProfile` aggregate.
- Modelo conceptualmente más limpio: el token es PARTE del user, no algo independiente.

**Negativas**:

- **Refactor required en slice C**:
  - Borrar `IEmailVerificationTokenRepository`.
  - Mover la entity al folder de User (Domain/Users/Entities/VerificationToken.cs).
  - User aggregate gana métodos `IssueVerificationToken`, `MarkEmailVerifiedFor`.
  - Migration: rename tabla `email_verification_tokens` → `verification_tokens` + agregar columna `purpose` enum.
  - Refactor de `RegisterUserCommandHandler` para llamar `user.IssueVerificationToken(...)` antes del `users.Add(user)`.
- Costo del refactor: medio. Slice C ya iba a tocar tokens (verify flow), aprovechamos.
- Cargar User trae los tokens en eager: ~mismo dato que antes (un user típico tiene 0-1 tokens activos), no es perf concern.

**Tabla canónica de child entities**:

Este ADR formaliza que en planb, las siguientes son child entities (no aggregates):

| Child entity | Aggregate owner | Razón |
|---|---|---|
| `VerificationToken` | User, TeacherProfile | invariante "un solo activo por purpose" + atomicidad consume+verify |
| `Prerequisite` | Subject | "Subject.Prerequisites" es parte de la definición de Subject |
| `CommissionTeacher` | Commission | "asignación de teacher a commission" es parte del estado de Commission, no entity independiente |
| `TeacherResponse` | Review | una response por review (UNIQUE), cascade natural si Review se remueve |

Detalle completo + criterios en `docs/domain/tactical/aggregates.md`.

## Cuándo revisitar

- Si VerificationToken gana un purpose que tiene invariantes propias (ej. password reset con regla "no se puede reset si el user creó cuenta hace < 1 hora"), evaluar si ese purpose merece su propio aggregate. Mientras los tres purposes (UserEmailVerification, TeacherInstitutionalVerification, futuro PasswordReset) compartan invariantes, comparten el shape de entity.
- Si emerge un caso donde necesitamos query directa de tokens (ej. "cuántos tokens active en el sistema" para metrics), agregar query service en Application/Contracts/. NO promover a aggregate por eso.

Refs: [ADR-0008](0008-roles-exclusivos-profiles-como-capacidades.md), [ADR-0017](0017-persistence-ignorance.md), [ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md). Ver también `docs/domain/tactical/aggregates.md` para el catálogo completo de aggregates / entities / VOs / projections.
