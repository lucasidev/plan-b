using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.CareerPlanImports;

/// <summary>
/// Aggregate del flujo "Importar plan de estudios" (US-088). Vive en el bounded context Academic
/// (no Enrollments, distinto al <c>HistorialImport</c> de US-014: ese es del historial del
/// alumno, esto es del catálogo).
///
/// <para>
/// Captura quién hizo el upload (<see cref="UploadedByUserId"/>), el contexto que el alumno
/// proveyó (<see cref="UniversityId"/> + <see cref="CareerName"/> + <see cref="PlanYear"/> +
/// <see cref="StudentEnrollmentYear"/>) y el resultado del parser. Al aprobar, el handler
/// materializa el <c>CareerPlan</c> + sus <c>Subject</c>s (todos <c>IsOfficial = false</c>) y
/// los expone al onboarding paso 2 para que el alumno termine.
/// </para>
///
/// <para>
/// Lifecycle: <c>Pending</c> → <c>Parsing</c> → <c>Parsed</c> → <c>Approved</c> (terminal) o
/// <c>Rejected</c> (terminal, con motivo). Pending/Parsing pueden transitar a <c>Failed</c>
/// (terminal). Mismo pattern que <c>HistorialImport</c>.
/// </para>
/// </summary>
public sealed class CareerPlanImport : Entity<CareerPlanImportId>, IAggregateRoot
{
    public Guid UploadedByUserId { get; private set; }
    public UniversityId UniversityId { get; private set; }
    public string CareerName { get; private set; } = null!;
    public int PlanYear { get; private set; }
    public int StudentEnrollmentYear { get; private set; }
    public CareerPlanImportSourceType SourceType { get; private set; }
    public CareerPlanImportStatus Status { get; private set; }
    public CareerPlanImportPayload? Payload { get; private set; }
    public string? Error { get; private set; }
    public Guid? ApprovedCareerPlanId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? ParsedAt { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public string? RejectionReason { get; private set; }
    public DateTimeOffset? RejectedAt { get; private set; }

    private CareerPlanImport() { }

    public static Result<CareerPlanImport> Create(
        Guid uploadedByUserId,
        UniversityId universityId,
        string careerName,
        int planYear,
        int studentEnrollmentYear,
        CareerPlanImportSourceType sourceType,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(careerName))
        {
            return CareerPlanImportErrors.CareerNameRequired;
        }

        // Rango holgado: planes desde 1990 (carreras IT de los 90s pueden tener plan vigente
        // todavía) hasta el año actual.
        var currentYear = clock.UtcNow.Year;
        if (planYear < 1990 || planYear > currentYear)
        {
            return CareerPlanImportErrors.PlanYearOutOfRange;
        }

        var now = clock.UtcNow;
        return new CareerPlanImport
        {
            Id = CareerPlanImportId.New(),
            UploadedByUserId = uploadedByUserId,
            UniversityId = universityId,
            CareerName = careerName.Trim(),
            PlanYear = planYear,
            StudentEnrollmentYear = studentEnrollmentYear,
            SourceType = sourceType,
            Status = CareerPlanImportStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// El worker toma el job. Acepta volver desde <see cref="CareerPlanImportStatus.Parsing"/>
    /// (mismo criterio que <c>HistorialImport.MarkParsing</c>): estar ya en Parsing significa que
    /// el proceso anterior se cayó a mitad, y rechazar la redelivery dejaba el import trabado ahí
    /// para siempre.
    /// </summary>
    public Result MarkParsing(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (Status is not (CareerPlanImportStatus.Pending or CareerPlanImportStatus.Parsing))
        {
            return CareerPlanImportErrors.InvalidStateTransition;
        }
        Status = CareerPlanImportStatus.Parsing;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    public Result MarkParsed(CareerPlanImportPayload payload, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(payload);
        ArgumentNullException.ThrowIfNull(clock);
        if (Status != CareerPlanImportStatus.Parsing)
        {
            return CareerPlanImportErrors.InvalidStateTransition;
        }
        Payload = payload;
        Status = CareerPlanImportStatus.Parsed;
        var now = clock.UtcNow;
        ParsedAt = now;
        UpdatedAt = now;
        return Result.Success();
    }

    public Result MarkFailed(string errorMessage, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (Status is CareerPlanImportStatus.Parsed
            or CareerPlanImportStatus.Approved
            or CareerPlanImportStatus.Rejected)
        {
            return CareerPlanImportErrors.InvalidStateTransition;
        }
        Status = CareerPlanImportStatus.Failed;
        Error = errorMessage;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    public Result MarkApproved(Guid approvedCareerPlanId, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (Status != CareerPlanImportStatus.Parsed)
        {
            return CareerPlanImportErrors.NotReadyForApprove;
        }
        Status = CareerPlanImportStatus.Approved;
        ApprovedCareerPlanId = approvedCareerPlanId;
        var now = clock.UtcNow;
        ApprovedAt = now;
        UpdatedAt = now;
        return Result.Success();
    }

    /// <summary>
    /// El staff revisa el preview (mismo punto de decisión que <see cref="MarkApproved"/>) y decide
    /// no incorporarlo al catálogo. A diferencia de <see cref="MarkFailed"/> (el parser lo tira por
    /// un error técnico), acá el motivo lo redacta una persona para que el alumno entienda por qué
    /// su plan no apareció. Solo válido desde <see cref="CareerPlanImportStatus.Parsed"/>: es el
    /// mismo estado desde el que se puede aprobar.
    /// </summary>
    public Result MarkRejected(string reason, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (string.IsNullOrWhiteSpace(reason))
        {
            return CareerPlanImportErrors.RejectionReasonRequired;
        }
        if (Status != CareerPlanImportStatus.Parsed)
        {
            return CareerPlanImportErrors.InvalidStateTransition;
        }
        Status = CareerPlanImportStatus.Rejected;
        RejectionReason = reason.Trim();
        var now = clock.UtcNow;
        RejectedAt = now;
        UpdatedAt = now;
        return Result.Success();
    }

    public static CareerPlanImport Hydrate(
        CareerPlanImportId id,
        Guid uploadedByUserId,
        UniversityId universityId,
        string careerName,
        int planYear,
        int studentEnrollmentYear,
        CareerPlanImportSourceType sourceType,
        CareerPlanImportStatus status,
        CareerPlanImportPayload? payload,
        string? error,
        Guid? approvedCareerPlanId,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        DateTimeOffset? parsedAt,
        DateTimeOffset? approvedAt,
        string? rejectionReason,
        DateTimeOffset? rejectedAt) =>
        new()
        {
            Id = id,
            UploadedByUserId = uploadedByUserId,
            UniversityId = universityId,
            CareerName = careerName,
            PlanYear = planYear,
            StudentEnrollmentYear = studentEnrollmentYear,
            SourceType = sourceType,
            Status = status,
            Payload = payload,
            Error = error,
            ApprovedCareerPlanId = approvedCareerPlanId,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
            ParsedAt = parsedAt,
            ApprovedAt = approvedAt,
            RejectionReason = rejectionReason,
            RejectedAt = rejectedAt,
        };
}
