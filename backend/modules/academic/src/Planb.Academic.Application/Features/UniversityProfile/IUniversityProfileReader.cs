namespace Planb.Academic.Application.Features.UniversityProfile;

public interface IUniversityProfileReader
{
    Task<UniversityProfileResponse?> GetAsync(Guid universityId, CancellationToken ct = default);
    Task<byte[]?> GetLogoAsync(Guid universityId, CancellationToken ct = default);
}
