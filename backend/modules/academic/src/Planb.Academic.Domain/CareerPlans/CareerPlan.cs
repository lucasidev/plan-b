using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.CareerPlans;

/// <summary>
/// Plan de estudios de una Career para un año particular (ej. TUDCS Plan 2024). Hoy expone solo
/// metadata (Year, Status); Subjects, Prerequisites y créditos viven en aggregates paralelos.
///
/// Por qué separado de Career: la misma Career puede tener planes paralelos vigentes (caso
/// típico "Plan 2018" para alumnos viejos + "Plan 2024" para nuevos). Modelarlos como aggregate
/// distinto evita inflar Career y permite que cada plan tenga su propio lifecycle.
/// </summary>
public sealed class CareerPlan : Entity<CareerPlanId>, IAggregateRoot
{
    public CareerId CareerId { get; private set; }
    public int Year { get; private set; }
    public CareerPlanStatus Status { get; private set; }
    /// <summary>
    /// True cuando el plan lo creó el backoffice. False cuando lo creó un alumno via
    /// crowdsourcing (US-088 import PDF en onboarding). Las cascadas del frontend muestran
    /// badge "No oficial" cuando es false.
    /// </summary>
    public bool IsOfficial { get; private set; }

    /// <summary>
    /// Identificador humano del plan (US-061, ej. "plan-2023"; el alumno ve "Plan 2023"). Opcional:
    /// el crowdsourcing no lo carga. El year sigue siendo la clave de unicidad; el label es una
    /// etiqueta editorial.
    /// </summary>
    public string? Label { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    private CareerPlan() { }

    public static Result<CareerPlan> Create(
        CareerId careerId,
        int year,
        IDateTimeProvider clock,
        bool isOfficial = true,
        string? label = null)
    {
        ArgumentNullException.ThrowIfNull(clock);

        // Sin floor mínimo arbitrario: hay carreras IT en argentina con planes vigentes desde
        // los 2000s (UNT Ing.Computación Plan 2005). Sólo prevenimos años no positivos y
        // futuros (no podés tener un plan que aún no se aprobó).
        if (year <= 0 || year > clock.UtcNow.Year)
        {
            return CareerPlanErrors.YearOutOfRange;
        }

        return new CareerPlan
        {
            Id = CareerPlanId.New(),
            CareerId = careerId,
            Year = year,
            Status = CareerPlanStatus.Active,
            IsOfficial = isOfficial,
            Label = string.IsNullOrWhiteSpace(label) ? null : label.Trim(),
            CreatedAt = clock.UtcNow,
        };
    }

    /// <summary>
    /// Promueve un plan no-oficial a oficial. Idempotente. Lo invoca el flujo de backoffice
    /// cuando un admin valida un plan crowdsourced (post-MVP).
    /// </summary>
    public void MarkOfficial()
    {
        if (!IsOfficial) IsOfficial = true;
    }

    /// <summary>
    /// Archiva el plan (US-061, admin): pasa de Active a Deprecated. El plan sigue existiendo y los
    /// alumnos asociados quedan en él; solo deja de ser el vigente para nuevos ingresos.
    /// Idempotencia explícita: deprecar un plan ya deprecated devuelve error.
    /// </summary>
    public Result Deprecate()
    {
        if (Status == CareerPlanStatus.Deprecated)
        {
            return CareerPlanErrors.AlreadyDeprecated;
        }

        Status = CareerPlanStatus.Deprecated;
        return Result.Success();
    }

    /// <summary>Reactiva un plan archivado (US-061, admin): Deprecated a Active. Idempotencia explícita.</summary>
    public Result Reactivate()
    {
        if (Status == CareerPlanStatus.Active)
        {
            return CareerPlanErrors.AlreadyActive;
        }

        Status = CareerPlanStatus.Active;
        return Result.Success();
    }

    public static CareerPlan Hydrate(
        CareerPlanId id,
        CareerId careerId,
        int year,
        CareerPlanStatus status,
        bool isOfficial,
        string? label,
        DateTimeOffset createdAt) =>
        new()
        {
            Id = id,
            CareerId = careerId,
            Year = year,
            Status = status,
            IsOfficial = isOfficial,
            Label = label,
            CreatedAt = createdAt,
        };
}
