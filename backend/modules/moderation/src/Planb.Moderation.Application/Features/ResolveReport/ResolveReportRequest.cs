namespace Planb.Moderation.Application.Features.ResolveReport;

/// <summary>Body del uphold/dismiss (US-051). La nota interna es opcional (0..1000 chars).</summary>
public sealed record ResolveReportRequest(string? ResolutionNote);
