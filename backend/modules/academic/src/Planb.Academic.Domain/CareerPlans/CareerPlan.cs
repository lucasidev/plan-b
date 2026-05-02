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
    public DateTimeOffset CreatedAt { get; private set; }

    private CareerPlan() { }

    public static Result<CareerPlan> Create(
        CareerId careerId,
        int year,
        IDateTimeProvider clock)
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
            CreatedAt = clock.UtcNow,
        };
    }

    public static CareerPlan Hydrate(
        CareerPlanId id,
        CareerId careerId,
        int year,
        CareerPlanStatus status,
        DateTimeOffset createdAt) =>
        new()
        {
            Id = id,
            CareerId = careerId,
            Year = year,
            Status = status,
            CreatedAt = createdAt,
        };
}
