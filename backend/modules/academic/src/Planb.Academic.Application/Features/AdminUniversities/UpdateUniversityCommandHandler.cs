using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Handler del PATCH /api/academic/universities/{id} (admin). Carga el aggregate, valida que el
/// nuevo slug (si cambió) no colisione con otra universidad, aplica Update y persiste. 404 si la
/// universidad no existe.
/// </summary>
public static class UpdateUniversityCommandHandler
{
    public static async Task<Result<UpdateUniversityResponse>> Handle(
        UpdateUniversityCommand command,
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

        var normalizedSlug = command.Slug.Trim().ToLowerInvariant();
        if (await universities.ExistsBySlugAsync(normalizedSlug, university.Id, ct))
        {
            return UniversityErrors.SlugAlreadyTaken;
        }

        var result = university.Update(
            command.Name, command.Slug, command.InstitutionalEmailDomains, clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UpdateUniversityResponse(university.Id.Value);
    }
}
