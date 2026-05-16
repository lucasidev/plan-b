using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Domain.HistorialImports;

/// <summary>
/// Aggregate root del flujo "Importar historial" (US-014). Captura el upload del alumno
/// (PDF binario o texto pegado), su procesamiento por el parser heurístico, y el resultado
/// que el user revisa antes de confirmar.
///
/// <para>
/// Lifecycle:
/// <list type="number">
///   <item><c>Create</c> con <see cref="HistorialImportStatus.Pending"/>. El endpoint POST
///         responde 202 con el id.</item>
///   <item><see cref="MarkParsing"/> cuando el worker Wolverine toma el job.</item>
///   <item><see cref="MarkParsed"/> con <see cref="HistorialImportPayload"/> cuando el parser
///         termina OK. El user puede consultar via GET y revisar el preview.</item>
///   <item><see cref="MarkFailed"/> si algo explota (PDF encriptado, timeout, parser bug).
///         El user reintenta o cae al flujo manual de US-013.</item>
///   <item><see cref="MarkConfirmed"/> cuando el user revisa el preview, ajusta y confirma.
///         Los <c>EnrollmentRecord</c> ya están creados en el mismo SaveChanges (responsabilidad
///         del handler de confirm). Terminal.</item>
/// </list>
/// </para>
///
/// <para>
/// <see cref="StudentProfileId"/> es FK lógica a <c>identity.student_profiles.id</c> sin FK
/// Postgres cross-schema (ADR-0017). El handler valida que el user tenga profile activo via
/// <c>IIdentityQueryService</c> antes de crear el import.
/// </para>
/// </summary>
public sealed class HistorialImport : Entity<HistorialImportId>, IAggregateRoot
{
    public Guid StudentProfileId { get; private set; }
    public HistorialImportSourceType SourceType { get; private set; }
    public HistorialImportStatus Status { get; private set; }
    public HistorialImportPayload? Payload { get; private set; }
    public string? Error { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? ParsedAt { get; private set; }
    public DateTimeOffset? ConfirmedAt { get; private set; }

    private HistorialImport() { }

    /// <summary>
    /// Alta del import. Se invoca desde el handler del POST. El payload todavía no se procesó
    /// (eso lo hace el worker async).
    /// </summary>
    public static HistorialImport Create(
        Guid studentProfileId,
        HistorialImportSourceType sourceType,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var now = clock.UtcNow;
        return new HistorialImport
        {
            Id = HistorialImportId.New(),
            StudentProfileId = studentProfileId,
            SourceType = sourceType,
            Status = HistorialImportStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Transición a <see cref="HistorialImportStatus.Parsing"/>. El worker la invoca al tomar
    /// el job. Defense en profundidad: si el aggregate ya está en otro estado terminal,
    /// devolvemos error (el worker se retiraría).
    /// </summary>
    public Result MarkParsing(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (Status != HistorialImportStatus.Pending)
        {
            return HistorialImportErrors.InvalidStateTransition;
        }
        Status = HistorialImportStatus.Parsing;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    public Result MarkParsed(HistorialImportPayload payload, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(payload);
        ArgumentNullException.ThrowIfNull(clock);
        if (Status != HistorialImportStatus.Parsing)
        {
            return HistorialImportErrors.InvalidStateTransition;
        }
        Payload = payload;
        Status = HistorialImportStatus.Parsed;
        var now = clock.UtcNow;
        ParsedAt = now;
        UpdatedAt = now;
        return Result.Success();
    }

    public Result MarkFailed(string errorMessage, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (Status is HistorialImportStatus.Parsed or HistorialImportStatus.Confirmed)
        {
            // Una vez parseado o confirmado no podemos volver a "failed". Si el worker
            // crashed después de marcar parsed, ese problema lo cubre la retry policy del
            // host, no este aggregate.
            return HistorialImportErrors.InvalidStateTransition;
        }
        Status = HistorialImportStatus.Failed;
        Error = errorMessage;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    public Result MarkConfirmed(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (Status != HistorialImportStatus.Parsed)
        {
            return HistorialImportErrors.NotReadyForConfirm;
        }
        Status = HistorialImportStatus.Confirmed;
        var now = clock.UtcNow;
        ConfirmedAt = now;
        UpdatedAt = now;
        return Result.Success();
    }

    /// <summary>
    /// Reconstitución para EF rehydration. Saltea las validaciones de transición.
    /// </summary>
    public static HistorialImport Hydrate(
        HistorialImportId id,
        Guid studentProfileId,
        HistorialImportSourceType sourceType,
        HistorialImportStatus status,
        HistorialImportPayload? payload,
        string? error,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        DateTimeOffset? parsedAt,
        DateTimeOffset? confirmedAt) =>
        new()
        {
            Id = id,
            StudentProfileId = studentProfileId,
            SourceType = sourceType,
            Status = status,
            Payload = payload,
            Error = error,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
            ParsedAt = parsedAt,
            ConfirmedAt = confirmedAt,
        };
}
