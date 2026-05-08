# Shared Kernel

VOs y patrones que viven en todos los BCs (no son específicos de un aggregate). En código viven en `Planb.SharedKernel` (`backend/libs/shared-kernel/`).

## Result y Result\<T\>

Wrappers para representar success/failure sin exceptions. Implicit operators desde `Error` → `Result` / `Result<T>`. Implicit desde `T` → `Result<T>`.

Uso típico: factories de VOs y application service handlers devuelven `Result<T>` con la value en éxito o un `Error` en falla. El HTTP layer mapea el `ErrorType` a status code.

## Error y ErrorType

`Error` es un `record (string Code, string Message, ErrorType Type)` con factories typed:

- `Error.Validation(code, message)`
- `Error.Conflict(code, message)`
- `Error.NotFound(code, message)`
- `Error.Unauthorized(code, message)`
- `Error.Forbidden(code, message)`
- `Error.Problem(code, message)`

`ErrorType` es un enum que el HTTP layer mapea a status codes (400, 404, 409, etc.) sin parsear strings de `Error.Code`.

## Strongly-typed IDs (patrón)

Todos los IDs son VO. Ningún aggregate ni entity usa `Guid` directamente. Razón: type safety, pasar un `ReviewId` donde se esperaba un `UserId` debe ser error de compilación, no bug silencioso.

**Convención**: `readonly record struct <Name>(Guid Value)` con factory `New()` y validación en ctor.

| ID | BC | Tipo wrapped | Notas |
|---|---|---|---|
| `UserId` | Identity | Guid | Implementado en S0 |
| `VerificationTokenId` | Identity | Guid | Implementado en S0 (renombrado en S1 de `EmailVerificationTokenId`) |
| `StudentProfileId` | Identity | Guid | S1 |
| `TeacherProfileId` | Identity | Guid | Post-MVP |
| `UniversityId` | Academic | Guid | Cuando se implementa Academic module |
| `CareerId` | Academic | Guid |: |
| `CareerPlanId` | Academic | Guid |: |
| `SubjectId` | Academic | Guid |: |
| `PrerequisiteId` | Academic | Guid | child entity de Subject, igual ID strongly-typed |
| `TeacherId` | Academic | Guid |: |
| `AcademicTermId` | Academic | Guid |: |
| `CommissionId` | Academic | Guid |: |
| `CommissionTeacherId` | Academic | Guid | child entity de Commission |
| `HistorialImportId` | Enrollments | Guid |: |
| `EnrollmentRecordId` | Enrollments | Guid |: |
| `ReviewId` | Reviews | Guid |: |
| `TeacherResponseId` | Reviews | Guid | child entity de Review |
| `ReviewReportId` | Moderation | Guid |: |
| `SimulationDraftId` | Planning | Guid |: |

(El guión en la columna "Notas" indica "sin nota especial".)

## Patrón estándar

```csharp
public readonly record struct UserId
{
    public Guid Value { get; private init; }

    public UserId(Guid value)
    {
        if (value == Guid.Empty)
            throw new ArgumentException("UserId cannot be empty.", nameof(value));
        Value = value;
    }

    public static UserId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
```

EF Core mapping vía `HasConversion(id => id.Value, value => new UserId(value))`.

## Refs

- Código: [`backend/libs/shared-kernel/`](../../../backend/libs/shared-kernel/)
- ADRs: [ADR-0017](../../decisions/0017-persistence-ignorance.md), [ADR-0030](../../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md)
