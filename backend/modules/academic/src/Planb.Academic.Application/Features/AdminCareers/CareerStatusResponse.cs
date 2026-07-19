namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>Estado activo de la carrera tras un toggle (deactivate / reactivate).</summary>
public sealed record CareerStatusResponse(Guid Id, bool IsActive);
