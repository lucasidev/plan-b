# Value Objects — planb

Inventario de Value Objects del modelo. Un VO no tiene identidad — su igualdad se define por sus atributos. En .NET 10 / C# 14 los modelamos como `readonly record struct` cuando son simples (un solo valor wrapped) o `readonly record class` cuando contienen colecciones o son más pesados.

**Regla de oro**: si la pregunta "dos instancias con los mismos atributos son la misma cosa?" es **sí**, es VO. Si es "no, cada una tiene historia propia", es Entity.

---

## Strongly-typed IDs

Todos los IDs son VO. Ningún aggregate ni entity usa `Guid` directamente. Razón: type safety — pasar un `ReviewId` donde se esperaba un `UserId` debe ser error de compilación, no bug silencioso.

**Convención**: `readonly record struct <Name>(Guid Value)` con factory `New()` y validación en ctor.

| ID | BC | Tipo wrapped | Notas |
|---|---|---|---|
| `UserId` | Identity | Guid | Implementado en slice A |
| `VerificationTokenId` | Identity | Guid | Implementado en slice B (renombrado en slice C de `EmailVerificationTokenId`) |
| `StudentProfileId` | Identity | Guid | Slice D |
| `TeacherProfileId` | Identity | Guid | Post-MVP |
| `UniversityId` | Academic | Guid | Cuando se implementa Academic module |
| `CareerId` | Academic | Guid | — |
| `CareerPlanId` | Academic | Guid | — |
| `SubjectId` | Academic | Guid | — |
| `PrerequisiteId` | Academic | Guid | child entity de Subject — pero igual ID strongly-typed |
| `TeacherId` | Academic | Guid | — |
| `AcademicTermId` | Academic | Guid | — |
| `CommissionId` | Academic | Guid | — |
| `CommissionTeacherId` | Academic | Guid | child entity de Commission |
| `HistorialImportId` | Enrollments | Guid | — |
| `EnrollmentRecordId` | Enrollments | Guid | — |
| `ReviewId` | Reviews | Guid | — |
| `TeacherResponseId` | Reviews | Guid | child entity de Review |
| `ReviewReportId` | Moderation | Guid | — |
| `SimulationDraftId` | Planning | Guid | — |

**Patrón estándar**:

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

---

## Domain primitives (VOs no-ID)

VOs que representan conceptos de dominio más allá de los identifiers.

### Identity

#### `EmailAddress` (Identity / shared candidato)

Representa un email validado y normalizado.

```csharp
public readonly record struct EmailAddress
{
    public string Value { get; private init; }
    private EmailAddress(string value) => Value = value;
    public static Result<EmailAddress> Create(string? raw) { ... }
    public string Domain { get { ... } }
    public override string ToString() => Value;
}
```

**Validaciones que aplica `Create`**:

- No vacío.
- Length ≤ 254 chars.
- Formato local@domain con punto en el domain.
- Lowercase normalization.

Si en futuro otros BCs necesitan normalize emails (ej. notificaciones), promover a shared kernel. Por ahora vive en `Identity.Domain.Users.EmailAddress`.

#### `UserRole` (Identity)

Enum: `Member`, `Moderator`, `Admin`, `UniversityStaff`. Mapeado a Postgres native enum (ver [ADR-0008](../../decisions/0008-roles-exclusivos-profiles-como-capacidades.md)).

#### `TokenPurpose` (Identity)

Enum: `UserEmailVerification`, `TeacherInstitutionalVerification`. Parametriza al child entity `VerificationToken`.

### Enrollments

#### `EnrollmentStatus` (Enrollments)

Enum: `Cursando`, `Aprobada`, `Desaprobada`, `Abandonada`, `Equivalencia`. State del EnrollmentRecord.

#### `ApprovalMethod` (Enrollments)

Enum: `Parcial`, `Final`, `Promocion`, `Equivalencia`. Cómo se aprobó la cursada.

#### `Grade` (Enrollments) — candidato post-MVP

Wrapper sobre `decimal` con validación `[0, 10]`. Hoy es columna directa en EnrollmentRecord; si la lógica de "aprobado vs desaprobado según escala de cada universidad" crece, se promueve a VO.

### Academic

#### `Slug` (Academic)

Wrapper sobre string con validación de slug (lowercase, alphanum + hyphens, ≤ 50 chars). Lo usa `University.Slug`.

#### `TermKind` (Academic)

Enum: `Cuatrimestre`, `Bimestre`, `Anual`. Cadencia de los AcademicTerms.

### Reviews

#### `Difficulty` (Reviews)

Wrapper sobre `int` con rango `[1, 5]`. Validado en ctor.

#### `ReviewStatus` (Reviews)

Enum: `Published`, `UnderReview`, `Removed`. State del Review.

#### `FilterVerdict` (Reviews)

Result type del domain service `IReviewContentFilter`. Tiene dos variantes:

- `Clean` — el filtro no detectó problemas; review puede publicarse directo.
- `Triggered(reasons[])` — el filtro detectó algo; review pasa a `under_review` con razones documentadas.

```csharp
public abstract record FilterVerdict
{
    public sealed record Clean : FilterVerdict;
    public sealed record Triggered(IReadOnlyList<string> Reasons) : FilterVerdict;
}
```

### Moderation

#### `ReportReason` (Moderation)

Enum: `Spam`, `Insult`, `OffTopic`, `PersonalAttack`, `Other`. Cuando es `Other`, requiere `details` no vacío.

#### `ReportStatus` (Moderation)

Enum: `Open`, `Upheld`, `Dismissed`.

### Planning

#### `SimulationVisibility` (Planning)

Enum: `Private`, `Shared`. Controlado por métodos `Share`/`Unshare` del SimulationDraft.

---

## Shared kernel VOs

VOs que aparecen en múltiples BCs y por eso viven en `Planb.SharedKernel`:

### `Error`

Record `(string Code, string Message, ErrorType Type)` con factories typed (`Validation`, `Conflict`, `NotFound`, `Unauthorized`, `Forbidden`, `Problem`).

### `Result`, `Result<T>`

Wrappers para representar success/failure sin exceptions. Implicit operators desde `Error` → `Result`/`Result<T>`. Implicit desde `T` → `Result<T>`.

### `ErrorType`

Enum que el HTTP layer mapea a status codes sin parsear strings de Error.Code.

---

## Anti-patterns que evitamos

- **Primitive obsession**: NO usar `Guid` sin wrapper, NO usar `string` para emails, NO usar `int` para difficulty/grade donde el rango importa.
- **Setters públicos en VOs**: ningún VO permite cambiar sus atributos después de construido. Toda mutación es "crear un nuevo VO con los nuevos valores".
- **Fallar silenciosamente**: factories devuelven `Result<T>` para representar fallas de validación. Los ctors lanzan `ArgumentException` solo cuando es responsabilidad del caller (typed IDs internos).
- **Over-engineering**: si un valor es realmente un primitive (ej. `IsActive` boolean), no lo wrappeamos. La regla es: ¿hay validación, normalización, o invariante? Si no, primitive sirve.

---

## Cómo agregar un VO nuevo

1. Crear `readonly record struct` (o `record class` si tiene colecciones).
2. Constructor privado + factory `Create(...)` que devuelve `Result<T>` si tiene validación.
3. Si lo persiste EF Core: agregar `HasConversion` en la configuration del aggregate que lo contiene.
4. Tests unitarios cubriendo: validación, equality, normalization (si aplica).
5. Si lo usan ≥ 2 BCs, considerar promoverlo a `shared-kernel`.
