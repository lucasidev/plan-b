using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Application.Features.ListPublicSimulations;

namespace Planb.Planning.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read para US-027 (feed público). Cruza <c>planning.simulation_drafts</c> /
/// <c>simulation_draft_items</c> con <c>identity.student_profiles</c>, <c>academic.subjects</c>,
/// <c>academic.commissions</c>, <c>enrollments.enrollment_records</c> y <c>reviews.reviews</c> en
/// SQL parametrizado, sin referenciar el Domain de esos módulos (ADR-0017): mismo criterio que
/// <c>DapperSimulationDraftListReader</c> y <c>DapperSimulatorEvaluationReader</c>.
///
/// <para>
/// Tres queries planas (drafts de la página, items+metadata, dificultad promedio agrupada por
/// draft) en vez de un join único: igual que en <c>DapperSimulationDraftListReader</c>, un join
/// de drafts×items×reviews produciría un producto cartesiano que hay que desagrupar de todos
/// modos, así que separarlas y agrupar en memoria es más simple y evita contar mal la carga
/// horaria (que se computa sobre items, no sobre reviews).
/// </para>
/// </summary>
internal sealed class DapperPublicSimulationsReader : IPublicSimulationsReader
{
    private readonly string _connectionString;

    public DapperPublicSimulationsReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperPublicSimulationsReader.");
    }

    public async Task<IReadOnlyList<PublicSimulationDraftRow>> ListSharedAsync(
        Guid careerPlanId,
        Guid termId,
        DateTimeOffset? cursorSharedAt,
        Guid? cursorId,
        int limit,
        CancellationToken ct = default)
    {
        // El plan sale del owner (identity.student_profiles.career_plan_id), no del draft: el
        // draft solo guarda owner_profile_id (ADR-0017, sin FK). Cruzar acá, cross-schema, es la
        // única forma de filtrar "shared del mismo plan" sin traer el owner al caller.
        //
        // Keyset pagination sobre (shared_at, id) ambos DESC: sin cursor (los dos parámetros
        // null) trae desde el principio; con cursor sigue estrictamente después de la última fila
        // que ya vio el caller. El empate por id desambigua dos shares con el mismo shared_at.
        const string draftsSql = @"
            SELECT
                sd.id        AS Id,
                sd.label     AS Label,
                sd.shared_at AS SharedAt
            FROM planning.simulation_drafts sd
            JOIN identity.student_profiles sp ON sp.id = sd.owner_profile_id
            WHERE sd.visibility = 'Shared'
              AND sd.term_id = @TermId
              AND sp.career_plan_id = @CareerPlanId
              AND (
                    @CursorSharedAt IS NULL
                    OR sd.shared_at < @CursorSharedAt
                    OR (sd.shared_at = @CursorSharedAt AND sd.id < @CursorId)
                  )
            ORDER BY sd.shared_at DESC, sd.id DESC
            LIMIT @Limit;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);

        var draftRows = (await db.QueryAsync<DraftRow>(
            new CommandDefinition(
                draftsSql,
                new
                {
                    CareerPlanId = careerPlanId,
                    TermId = termId,
                    CursorSharedAt = cursorSharedAt,
                    CursorId = cursorId,
                    Limit = limit,
                },
                cancellationToken: ct)))
            .ToList();

        if (draftRows.Count == 0)
        {
            return [];
        }

        var draftIds = draftRows.Select(d => d.Id).ToArray();

        const string itemsSql = @"
            SELECT
                sdi.draft_id      AS DraftId,
                sdi.subject_id    AS SubjectId,
                s.code            AS SubjectCode,
                s.name            AS SubjectName,
                s.weekly_hours    AS WeeklyHours,
                sdi.commission_id AS CommissionId,
                c.name            AS CommissionName
            FROM planning.simulation_draft_items sdi
            JOIN academic.subjects s ON s.id = sdi.subject_id
            LEFT JOIN academic.commissions c ON c.id = sdi.commission_id
            WHERE sdi.draft_id = ANY(@DraftIds::uuid[]);";

        // AVG(difficulty_rating) de las reseñas Published de cualquier materia del draft, agrupado
        // por draft_id: mismo cómputo que ISimulatorEvaluationReader.GetWeightedDifficultyAsync
        // (un AVG simple ya pondera por cantidad de reseñas de cada materia), generalizado a N
        // drafts en una sola pasada en vez de N llamadas al reader del simulador. Un draft sin
        // ninguna reseña en sus materias no aparece en el resultado (GROUP BY no produce fila para
        // un grupo vacío): "sin reseñas" queda null más abajo, no 0.
        const string difficultySql = @"
            SELECT
                sdi.draft_id                     AS DraftId,
                AVG(r.difficulty_rating)::float8 AS AverageDifficulty
            FROM planning.simulation_draft_items sdi
            JOIN enrollments.enrollment_records er ON er.subject_id = sdi.subject_id
            JOIN reviews.reviews r ON r.enrollment_id = er.id AND r.status = 'Published'
            WHERE sdi.draft_id = ANY(@DraftIds::uuid[])
            GROUP BY sdi.draft_id;";

        var itemRows = await db.QueryAsync<ItemRow>(
            new CommandDefinition(itemsSql, new { DraftIds = draftIds }, cancellationToken: ct));

        var difficultyRows = await db.QueryAsync<DifficultyRow>(
            new CommandDefinition(difficultySql, new { DraftIds = draftIds }, cancellationToken: ct));

        var itemsByDraft = itemRows
            .GroupBy(r => r.DraftId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var difficultyByDraft = difficultyRows.ToDictionary(r => r.DraftId, r => r.AverageDifficulty);

        return draftRows
            .Select(d =>
            {
                var items = itemsByDraft.GetValueOrDefault(d.Id, []);
                var subjects = items
                    .Select(i => new PublicSimulationSubjectItem(
                        i.SubjectId, i.SubjectCode, i.SubjectName, i.CommissionId, i.CommissionName))
                    .ToList();

                return new PublicSimulationDraftRow(
                    d.Id,
                    d.Label,
                    subjects,
                    items.Sum(i => i.WeeklyHours),
                    difficultyByDraft.GetValueOrDefault(d.Id),
                    // Constraint del data-model: visibility='Shared' implica shared_at no nulo. Si
                    // la fila llegó hasta acá es porque draftsSql ya filtró visibility='Shared'.
                    d.SharedAt!.Value);
            })
            .ToList();
    }

    // Record con { get; init; } (no posicional): mismo motivo que en DapperSimulationDraftListReader
    // (Dapper necesita el setter reflection-based para materializar DateTimeOffset).
    private sealed record DraftRow
    {
        public Guid Id { get; init; }
        public string? Label { get; init; }
        public DateTimeOffset? SharedAt { get; init; }
    }

    private sealed record ItemRow(
        Guid DraftId, Guid SubjectId, string SubjectCode, string SubjectName,
        int WeeklyHours, Guid? CommissionId, string? CommissionName);

    private sealed record DifficultyRow(Guid DraftId, double? AverageDifficulty);
}
