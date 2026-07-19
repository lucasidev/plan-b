using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Handler del POST /api/academic/universities/{universityId}/careers (admin). El slug es único
/// por universidad (UNIQUE(university_id, slug) intra-schema, a diferencia de University donde es
/// global), así que se chequea contra el repo antes de crear el aggregate. El code institucional
/// es opcional: solo se valida unicidad cuando el caller lo provee.
/// </summary>
public static class CreateCareerCommandHandler
{
    public static async Task<Result<CreateCareerResponse>> Handle(
        CreateCareerCommand command,
        ICareerRepository careers,
        IAcademicQueryService academic,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // No hay FK cross-schema (ADR-0017): el application layer valida que la University exista
        // antes de crear la carrera, igual que CreateTeacher. Sin esto quedan Careers huérfanas.
        if (!await academic.UniversityExistsAsync(command.UniversityId, ct))
        {
            return CareerErrors.UniversityNotFound;
        }

        var universityId = new UniversityId(command.UniversityId);

        var normalizedSlug = command.Slug.Trim().ToLowerInvariant();
        if (await careers.ExistsBySlugAsync(universityId, normalizedSlug, excludeId: null, ct))
        {
            return CareerErrors.SlugAlreadyTaken;
        }

        var trimmedCode = command.Code?.Trim();
        if (!string.IsNullOrWhiteSpace(trimmedCode)
            && await careers.ExistsByCodeAsync(universityId, trimmedCode, excludeId: null, ct))
        {
            return CareerErrors.CodeAlreadyTaken;
        }

        var result = Career.Create(
            universityId,
            command.Name,
            command.Slug,
            clock,
            isOfficial: true,
            command.ShortName,
            command.Code);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await careers.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateCareerResponse(result.Value.Id.Value);
    }
}
