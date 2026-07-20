namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>Estado activo de la materia tras reactivarla (US-062).</summary>
public sealed record SubjectStatusResponse(Guid Id, bool IsActive);
