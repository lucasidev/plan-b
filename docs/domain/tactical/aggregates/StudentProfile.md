# StudentProfile (Identity)

**Tipo**: lean
**BC**: Identity
**Root ID**: `StudentProfileId`
**Child entities**: ninguna

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(userId, careerPlanId, enrollmentYear, clock)` | Member con email verificado | Factory; crea profile activo. Cross-aggregate validation: `User` debe estar verificado (app service consulta `IIdentityQueryService.IsVerified`); CareerPlan existe (app service); no haya StudentProfile activo del mismo user para el mismo plan. Emite `StudentProfileCreated`. |
| `MarkGraduated(graduatedAt, clock)` | Member desde UI | Pasa a `Status='graduated'`, setea `GraduatedAt`. Emite `StudentProfileMarkedGraduated`. |
| `MarkAbandoned(clock)` | Member desde UI | Pasa a `Status='abandoned'`. Emite `StudentProfileMarkedAbandoned`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `StudentProfileCreated` | Tras `Create` | Identity (audit), telemetría de funnel |
| `StudentProfileMarkedGraduated` | Tras `MarkGraduated` | Identity (audit) |
| `StudentProfileMarkedAbandoned` | Tras `MarkAbandoned` | Identity (audit) |

Sin integration events cross-BC en MVP.

### 3. Invariantes que protege

- `UserId` referencia un User (validado en app service, no FK cross-BC dentro del schema).
- `(UserId, CareerPlanId)` UNIQUE entre profiles activos.
- `EnrollmentYear ∈ [1950, año actual]`.
- State machine `Status`: `active | graduated | abandoned`. Reglas:
  - `Status='graduated'` requiere `GraduatedAt NOT NULL`.
  - `Status IN ('active', 'abandoned')` requiere `GraduatedAt IS NULL`.

### 4. Cómo se carga / identifica

- Root ID: `StudentProfileId`.
- Lookup primario: por ID.
- Lookup secundario: por `UserId` (listar profiles del user), por `(UserId, CareerPlanId)`.
- Persistencia: EF Core schema `identity`. Tabla `student_profiles`.

### 5. Boundary

- `User` está afuera (aggregate separado en mismo BC).
- Cross-aggregate validation "User está verificado" se hace en application service vía `IIdentityQueryService.IsVerified(userId)` antes de instanciar el aggregate.

## Value Objects propios

Ninguno específico (usa enum simple para `Status` que se modela como columna).

## Refs

- BC: [Identity](../../strategic/bounded-contexts.md#identity)
- ADRs: [ADR-0008](../../../decisions/0008-roles-exclusivos-profiles-como-capacidades.md)
- User Stories: [US-012-b](../../user-stories/US-012-b.md), [US-015](../../user-stories/US-015.md), [US-016](../../user-stories/US-016.md)
