using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Handler del DELETE /api/academic/universities/{id} (admin). Soft delete vía <c>Deactivate</c>.
/// 404 si no existe; 409 si ya estaba inactiva (idempotencia explícita del aggregate).
/// </summary>
public static class DeactivateUniversityCommandHandler
{
    public static async Task<Result<UniversityStatusResponse>> Handle(
        DeactivateUniversityCommand command,
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

        var result = university.Deactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UniversityStatusResponse(university.Id.Value, university.IsActive);
    }
}
