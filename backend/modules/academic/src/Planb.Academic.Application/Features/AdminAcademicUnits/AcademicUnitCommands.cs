using Planb.Academic.Application.Abstractions.Georef;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminAcademicUnits;

public sealed record CreateAcademicUnitCommand(
    Guid UniversityId,
    string Name,
    string Slug,
    string Address,
    string Province,
    string Locality);

public sealed record UpdateAcademicUnitCommand(
    Guid AcademicUnitId,
    Guid UniversityId,
    string Name,
    string Slug,
    string Address,
    string Province,
    string Locality);

public sealed record AcademicUnitResponse(Guid Id);

public static class CreateAcademicUnitCommandHandler
{
    public static async Task<Result<AcademicUnitResponse>> Handle(
        CreateAcademicUnitCommand command,
        IUniversityRepository universities,
        IAcademicUnitRepository units,
        IGeorefLocalityResolver georef,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        if (command.UniversityId == Guid.Empty)
        {
            return AcademicUnitErrors.UniversityNotFound;
        }

        var universityId = new UniversityId(command.UniversityId);
        if (await universities.FindByIdAsync(universityId, ct) is null)
        {
            return AcademicUnitErrors.UniversityNotFound;
        }

        var slug = command.Slug.Trim().ToLowerInvariant();
        if (await units.ExistsBySlugAsync(universityId, slug, null, ct))
        {
            return AcademicUnitErrors.SlugAlreadyTaken;
        }

        var locality = await georef.ResolveAsync(command.Locality, command.Province, ct);
        if (locality is null)
        {
            return AcademicUnitErrors.LocalityRequired;
        }

        var result = AcademicUnit.Create(universityId, command.Name, slug, command.Address, clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        var unit = result.Value;
        var localityResult = unit.ResolveLocality(locality.Id, locality.Name, clock);
        if (localityResult.IsFailure)
        {
            return localityResult.Error;
        }

        unit.SetProvince(command.Province, clock);
        await units.AddAsync(unit, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return new AcademicUnitResponse(unit.Id.Value);
    }
}

public static class UpdateAcademicUnitCommandHandler
{
    public static async Task<Result<AcademicUnitResponse>> Handle(
        UpdateAcademicUnitCommand command,
        IAcademicUnitRepository units,
        IGeorefLocalityResolver georef,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        if (command.AcademicUnitId == Guid.Empty || command.UniversityId == Guid.Empty)
        {
            return AcademicUnitErrors.NotFound;
        }

        var unit = await units.FindByIdAsync(new AcademicUnitId(command.AcademicUnitId), ct);
        if (unit is null || unit.UniversityId.Value != command.UniversityId)
        {
            return AcademicUnitErrors.NotFound;
        }

        var slug = command.Slug.Trim().ToLowerInvariant();
        if (await units.ExistsBySlugAsync(unit.UniversityId, slug, unit.Id, ct))
        {
            return AcademicUnitErrors.SlugAlreadyTaken;
        }

        var locality = await georef.ResolveAsync(command.Locality, command.Province, ct);
        if (locality is null)
        {
            return AcademicUnitErrors.LocalityRequired;
        }

        var updateResult = unit.Update(command.Name, slug, command.Address, clock);
        if (updateResult.IsFailure)
        {
            return updateResult.Error;
        }

        var localityResult = unit.ResolveLocality(locality.Id, locality.Name, clock);
        if (localityResult.IsFailure)
        {
            return localityResult.Error;
        }

        unit.SetProvince(command.Province, clock);
        await unitOfWork.SaveChangesAsync(ct);
        return new AcademicUnitResponse(unit.Id.Value);
    }
}
