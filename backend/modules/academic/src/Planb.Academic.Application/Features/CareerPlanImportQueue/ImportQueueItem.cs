namespace Planb.Academic.Application.Features.CareerPlanImportQueue;

/// <summary>
/// Una fila de la cola de imports (US-088). Record property-init: Dapper mapea por nombre de
/// columna. <see cref="SimilarCareers"/> son las carreras existentes de la misma universidad que se
/// parecen al nombre propuesto (<c>similarity()</c> de pg_trgm): el staff las ve antes de aprobar,
/// para no duplicar una carrera que ya está en el catálogo con otro nombre.
/// </summary>
public sealed record ImportQueueItem
{
    public Guid Id { get; init; }
    public Guid UploadedByUserId { get; init; }
    public Guid UniversityId { get; init; }
    public string CareerName { get; init; } = string.Empty;
    public int PlanYear { get; init; }
    public int StudentEnrollmentYear { get; init; }
    public string SourceType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? Error { get; init; }
    public string? RejectionReason { get; init; }
    public Guid? ApprovedCareerPlanId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ParsedAt { get; init; }
    public DateTime? ApprovedAt { get; init; }
    public DateTime? RejectedAt { get; init; }
    public IReadOnlyList<SimilarCareerCandidate> SimilarCareers { get; init; } = [];
}

/// <summary>
/// Candidato a duplicado: una Career existente de la misma universidad, con su score de similitud
/// (0 a 1, <c>similarity()</c> de pg_trgm) contra el nombre que propuso el alumno.
/// </summary>
public sealed record SimilarCareerCandidate
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public double Score { get; init; }
}
