using Planb.Academic.Application.Abstractions.Georef;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminUniversities;

public static class UpdateUniversityProfileCommandHandler
{
    public static async Task<Result<UpdateUniversityResponse>> Handle(
        UpdateUniversityProfileCommand command,
        IUniversityRepository universities,
        IGeorefLocalityResolver georef,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var university = await universities.FindByIdAsync(new UniversityId(command.UniversityId), ct);
        if (university is null)
        {
            return UniversityErrors.NotFound;
        }

        if (string.IsNullOrWhiteSpace(command.Province))
        {
            university.UpdateProfile(command.WebsiteUrl, command.Address, null, null, null, clock);
        }
        else
        {
            var locality = await georef.ResolveAsync(command.LocalityText!, command.Province, ct);
            if (locality is null)
            {
                return UniversityErrors.LocalityNotFound;
            }

            university.UpdateProfile(
                command.WebsiteUrl,
                command.Address,
                command.Province,
                locality.Id,
                locality.Name,
                clock);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return new UpdateUniversityResponse(university.Id.Value);
    }
}
