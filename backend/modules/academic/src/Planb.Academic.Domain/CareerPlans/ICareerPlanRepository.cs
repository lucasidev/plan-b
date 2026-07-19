using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Domain.CareerPlans;

public interface ICareerPlanRepository
{
    Task AddAsync(CareerPlan plan, CancellationToken ct = default);

    /// <summary>
    /// Busca por (career_id, year). Match exacto. Se usa en el approve del import para devolver 409
    /// si ya existe el plan, y en el CRUD admin (US-061) para validar unicidad antes de crear.
    /// </summary>
    Task<CareerPlan?> FindByCareerAndYearAsync(
        CareerId careerId, int year, CancellationToken ct = default);

    /// <summary>Carga el aggregate por id para deprecar/reactivar (US-061). Null si no existe.</summary>
    Task<CareerPlan?> FindByIdAsync(CareerPlanId id, CancellationToken ct = default);
}
