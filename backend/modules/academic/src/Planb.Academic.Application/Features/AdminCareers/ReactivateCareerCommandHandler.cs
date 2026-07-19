using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Handler del POST /api/academic/careers/{id}/reactivate (admin). 404 si no existe; 409 si
/// ya estaba activa (idempotencia explícita del aggregate).
/// </summary>
public static class ReactivateCareerCommandHandler
{
    public static async Task<Result<CareerStatusResponse>> Handle(
        ReactivateCareerCommand command,
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

        var result = career.Reactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new CareerStatusResponse(career.Id.Value, career.IsActive);
    }
}
