using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Handler del POST /api/academic/universities/{id}/reactivate (admin). 404 si no existe; 409 si
/// ya estaba activa (idempotencia explícita del aggregate).
/// </summary>
public static class ReactivateUniversityCommandHandler
{
    public static async Task<Result<UniversityStatusResponse>> Handle(
        ReactivateUniversityCommand command,
        IUniversityRepository universities,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var university = await universities.FindByIdAsync(
            new UniversityId(command.UniversityId), ct);
        if (university is null)
        {
            return UniversityErrors.NotFound;
        }

        var result = university.Reactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UniversityStatusResponse(university.Id.Value, university.IsActive);
    }
}
