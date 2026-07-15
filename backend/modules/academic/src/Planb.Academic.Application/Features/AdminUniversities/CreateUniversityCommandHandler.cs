using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Handler del POST /api/academic/universities (admin). El slug es único en todo el catálogo
/// (no hay UNIQUE constraint intra-schema por universidad como en Career: acá la unicidad es
/// global), así que se chequea contra el repo antes de crear el aggregate.
/// </summary>
public static class CreateUniversityCommandHandler
{
    public static async Task<Result<CreateUniversityResponse>> Handle(
        CreateUniversityCommand command,
        IUniversityRepository universities,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var normalizedSlug = command.Slug.Trim().ToLowerInvariant();
        if (await universities.ExistsBySlugAsync(normalizedSlug, excludeId: null, ct))
        {
            return UniversityErrors.SlugAlreadyTaken;
        }

        var result = University.Create(
            command.Name,
            command.Slug,
            command.InstitutionalEmailDomains,
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await universities.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateUniversityResponse(result.Value.Id.Value);
    }
}
