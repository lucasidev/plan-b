using System.Text.Json;
using Dapper;
using Planb.Academic.Application.Features.CareerPlanImportQueue;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation de la cola de imports de plan de estudios (US-088). Trae la página + el
/// total (<c>count(*) OVER()</c>) en la misma query, y por cada import calcula sus candidatos a
/// duplicado (careers existentes de la misma universidad con <c>similarity()</c> de pg_trgm sobre el
/// nombre) con un LATERAL JOIN que arma el array via <c>json_agg</c>: una sola roundtrip para la
/// página completa. La comparación pasa por <c>academic.immutable_unaccent</c> (la misma función que
/// usa <c>DapperCatalogSearchReader</c>), así que un import acentuado sigue rankeando alto contra una
/// Career sin tildes.
/// </summary>
internal sealed class DapperImportQueueReader : IImportQueueReader
{
    private const double SimilarityThreshold = 0.3;
    private const int MaxCandidates = 5;

    private static readonly JsonSerializerOptions CandidatesJsonOptions =
        new() { PropertyNameCaseInsensitive = true };

    private readonly IDbConnectionFactory _connections;

    public DapperImportQueueReader(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<ImportQueueReadResult> ReadAsync(
        ImportQueueFilter filter, CancellationToken ct = default)
    {
        var offset = (filter.Page - 1) * filter.PageSize;

        const string sql = @"
            WITH page AS (
                SELECT
                    i.id, i.uploaded_by_user_id, i.university_id, i.career_name, i.plan_year,
                    i.student_enrollment_year, i.source_type, i.status, i.error,
                    i.rejection_reason, i.approved_career_plan_id, i.created_at, i.parsed_at,
                    i.approved_at, i.rejected_at,
                    count(*) OVER()::int AS total_count
                FROM academic.career_plan_imports i
                WHERE (@Status IS NULL OR i.status = @Status)
                ORDER BY i.created_at ASC
                OFFSET @Offset LIMIT @Limit
            )
            SELECT
                page.id                      AS Id,
                page.uploaded_by_user_id     AS UploadedByUserId,
                page.university_id           AS UniversityId,
                page.career_name             AS CareerName,
                page.plan_year               AS PlanYear,
                page.student_enrollment_year AS StudentEnrollmentYear,
                page.source_type             AS SourceType,
                page.status                  AS Status,
                page.error                   AS Error,
                page.rejection_reason        AS RejectionReason,
                page.approved_career_plan_id AS ApprovedCareerPlanId,
                page.created_at              AS CreatedAt,
                page.parsed_at               AS ParsedAt,
                page.approved_at             AS ApprovedAt,
                page.rejected_at             AS RejectedAt,
                page.total_count             AS TotalCount,
                COALESCE(cand.candidates_json, '[]') AS CandidatesJson
            FROM page
            LEFT JOIN LATERAL (
                SELECT json_agg(c)::text AS candidates_json
                FROM (
                    SELECT
                        car.id   AS id,
                        car.name AS name,
                        car.slug AS slug,
                        similarity(
                            academic.immutable_unaccent(lower(car.name)),
                            academic.immutable_unaccent(lower(page.career_name))) AS score
                    FROM academic.careers car
                    WHERE car.university_id = page.university_id
                      AND similarity(
                            academic.immutable_unaccent(lower(car.name)),
                            academic.immutable_unaccent(lower(page.career_name))) > @SimilarityThreshold
                    ORDER BY score DESC
                    LIMIT @MaxCandidates
                ) c
            ) cand ON true
            ORDER BY page.created_at ASC;";

        var parameters = new
        {
            Status = filter.Status?.ToString(),
            Offset = offset,
            Limit = filter.PageSize,
            SimilarityThreshold,
            MaxCandidates,
        };

        using var db = _connections.Create();
        var rows = (await db.QueryAsync<Row>(
            new CommandDefinition(sql, parameters, cancellationToken: ct))).ToList();

        var total = rows.Count > 0 ? rows[0].TotalCount : 0;
        var items = rows.Select(ToItem).ToList();
        return new ImportQueueReadResult(items, total);
    }

    private static ImportQueueItem ToItem(Row row) => new()
    {
        Id = row.Id,
        UploadedByUserId = row.UploadedByUserId,
        UniversityId = row.UniversityId,
        CareerName = row.CareerName,
        PlanYear = row.PlanYear,
        StudentEnrollmentYear = row.StudentEnrollmentYear,
        SourceType = row.SourceType,
        Status = row.Status,
        Error = row.Error,
        RejectionReason = row.RejectionReason,
        ApprovedCareerPlanId = row.ApprovedCareerPlanId,
        CreatedAt = row.CreatedAt,
        ParsedAt = row.ParsedAt,
        ApprovedAt = row.ApprovedAt,
        RejectedAt = row.RejectedAt,
        SimilarCareers = string.IsNullOrEmpty(row.CandidatesJson)
            ? []
            : JsonSerializer.Deserialize<List<SimilarCareerCandidate>>(
                row.CandidatesJson, CandidatesJsonOptions) ?? [],
    };

    /// <summary>Fila cruda: los campos del import + el total de la ventana + candidatos en JSON.</summary>
    private sealed record Row
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
        public int TotalCount { get; init; }
        public string? CandidatesJson { get; init; }
    }
}
