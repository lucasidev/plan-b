using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Handler del PATCH /api/academic/careers/{id} (admin). Carga el aggregate, valida que el nuevo
/// slug/code (si cambiaron) no colisionen con otra carrera de la misma universidad, aplica Update
/// y persiste. 404 si la carrera no existe.
/// </summary>
public static class UpdateCareerCommandHandler
{
    public static async Task<Result<UpdateCareerResponse>> Handle(
        UpdateCareerCommand command,
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

        var normalizedSlug = command.Slug.Trim().ToLowerInvariant();
        if (await careers.ExistsBySlugAsync(career.UniversityId, normalizedSlug, career.Id, ct))
        {
            return CareerErrors.SlugAlreadyTaken;
        }

        var trimmedCode = command.Code?.Trim();
        if (!string.IsNullOrWhiteSpace(trimmedCode)
            && await careers.ExistsByCodeAsync(career.UniversityId, trimmedCode, career.Id, ct))
        {
            return CareerErrors.CodeAlreadyTaken;
        }

        var result = career.Update(
            command.Name,
            command.Slug,
            command.ShortName,
            command.Code,
            command.DegreeType,
            command.DurationYears,
            command.Cadence,
            command.Description,
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UpdateCareerResponse(career.Id.Value);
    }
}
