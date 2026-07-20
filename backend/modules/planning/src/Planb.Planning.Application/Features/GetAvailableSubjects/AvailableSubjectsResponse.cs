namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>Wrapper de la respuesta de GET /api/me/simulator/available (US-016).</summary>
public sealed record AvailableSubjectsResponse(IReadOnlyList<AvailableSubjectItem> Items);
