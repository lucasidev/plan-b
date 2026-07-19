using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Handler del DELETE /api/academic/careers/{id} (admin). Soft delete vía <c>Deactivate</c>.
/// 404 si no existe; 409 si ya estaba inactiva (idempotencia explícita del aggregate).
/// </summary>
public static class DeactivateCareerCommandHandler
{
    public static async Task<Result<CareerStatusResponse>> Handle(
        DeactivateCareerCommand command,
        ICareerRepository careers,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var career = await careers.FindByIdAsync(new CareerId(command.CareerId), ct);
        if (career is null)
        {
            return CareerErrors.NotFound;
        }

        var result = career.Deactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new CareerStatusResponse(career.Id.Value, career.IsActive);
    }
}
