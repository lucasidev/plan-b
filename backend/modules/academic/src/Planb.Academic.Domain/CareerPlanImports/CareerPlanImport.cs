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
/// Lifecycle: <c>Pending</c> → <c>Parsing</c> → <c>Parsed</c> → <c>Approved</c> (terminal).
/// Cualquier punto puede transitar a <c>Failed</c> (terminal). Mismo pattern que
/// <c>HistorialImport</c>.
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

    public Result MarkParsing(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        if (Status != CareerPlanImportStatus.Pending)
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
        if (Status is CareerPlanImportStatus.Parsed or CareerPlanImportStatus.Approved)
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
        DateTimeOffset? approvedAt) =>
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
        };
}
