namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>Estado activo de la universidad tras un toggle (deactivate / reactivate).</summary>
public sealed record UniversityStatusResponse(Guid Id, bool IsActive);
