using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Domain.CareerPlans;

public interface ICareerPlanRepository
{
    Task AddAsync(CareerPlan plan, CancellationToken ct = default);

    /// <summary>
    /// Busca por (career_id, year). Match exacto. Se usa en el approve del import para
    /// devolver 409 si ya existe el plan, ofreciendo reusarlo.
    /// </summary>
    Task<CareerPlan?> FindByCareerAndYearAsync(
        CareerId careerId, int year, CancellationToken ct = default);
}
