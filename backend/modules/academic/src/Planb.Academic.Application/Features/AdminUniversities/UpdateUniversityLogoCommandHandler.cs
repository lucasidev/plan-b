using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
namespace Planb.Academic.Application.Features.AdminUniversities;

public static class UpdateUniversityLogoCommandHandler
{
    public static async Task<Result<UpdateUniversityResponse>> Handle(UpdateUniversityLogoCommand command, IUniversityRepository universities, IAcademicUnitOfWork unitOfWork, IDateTimeProvider clock, CancellationToken ct)
    {
        var university = await universities.FindByIdAsync(new UniversityId(command.UniversityId), ct);
        if (university is null) return UniversityErrors.NotFound;
        university.ReplaceLogo(command.Logo, clock);
        await unitOfWork.SaveChangesAsync(ct);
        return new UpdateUniversityResponse(university.Id.Value);
    }
}
