namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>Revierte el soft delete de una carrera (US-061, admin).</summary>
public sealed record ReactivateCareerCommand(Guid CareerId);
