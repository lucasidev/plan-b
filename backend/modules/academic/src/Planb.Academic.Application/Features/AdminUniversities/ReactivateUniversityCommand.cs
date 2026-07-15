namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>Revierte el soft delete de una universidad (US-060, admin).</summary>
public sealed record ReactivateUniversityCommand(Guid UniversityId);
