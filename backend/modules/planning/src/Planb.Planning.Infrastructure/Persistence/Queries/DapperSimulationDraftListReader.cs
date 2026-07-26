using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Application.Features.ListSimulationDrafts;

namespace Planb.Planning.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read para US-023 (listar mis borradores). Cruza <c>planning.simulation_drafts</c> /
/// <c>simulation_draft_items</c> con <c>academic.subjects</c> y <c>academic.commissions</c> en SQL
/// parametrizado, sin referenciar el Domain de Academic (ADR-0017): mismo criterio que
/// DapperSimulatorAvailabilityReader.
///
/// <para>
/// Dos queries (borradores, items ya resueltos a code/name/commission-name) en vez de un join único:
/// el join produciría un producto cartesiano (N items por borrador) que después habría que
/// desagrupar igual, así que separarlas y agrupar en memoria es más simple.
/// </para>
/// </summary>
internal sealed class DapperSimulationDraftListReader : ISimulationDraftListReader
{
    private readonly string _connectionString;

    public DapperSimulationDraftListReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperSimulationDraftListReader.");
    }

    public async Task<IReadOnlyList<SimulationDraftListItem>> ListByOwnerAsync(
        Guid ownerProfileId, CancellationToken ct = default)
    {
        const string draftsSql = @"
            SELECT
                id         AS Id,
                term_id    AS TermId,
                label      AS Label,
                status     AS Status,
                visibility AS Visibility,
                created_at AS CreatedAt
            FROM planning.simulation_drafts
            WHERE owner_profile_id = @OwnerProfileId
            ORDER BY created_at DESC;";

        const string itemsSql = @"
            SELECT
                sdi.draft_id      AS DraftId,
                sdi.subject_id    AS SubjectId,
                s.code            AS SubjectCode,
                s.name            AS SubjectName,
                sdi.commission_id AS CommissionId,
                c.name            AS CommissionName
            FROM planning.simulation_draft_items sdi
            JOIN planning.simulation_drafts sd ON sd.id = sdi.draft_id
            JOIN academic.subjects s ON s.id = sdi.subject_id
            LEFT JOIN academic.commissions c ON c.id = sdi.commission_id
            WHERE sd.owner_profile_id = @OwnerProfileId;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);

        var draftRows = (await db.QueryAsync<DraftRow>(
            new CommandDefinition(draftsSql, new { OwnerProfileId = ownerProfileId }, cancellationToken: ct)))
            .ToList();

        if (draftRows.Count == 0)
        {
            return [];
        }

        var itemRows = await db.QueryAsync<ItemRow>(
            new CommandDefinition(itemsSql, new { OwnerProfileId = ownerProfileId }, cancellationToken: ct));

        var itemsByDraft = itemRows
            .GroupBy(r => r.DraftId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<SimulationDraftListItemSubject>)g
                    .Select(r => new SimulationDraftListItemSubject(
                        r.SubjectId, r.SubjectCode, r.SubjectName, r.CommissionId, r.CommissionName))
                    .ToList());

        return draftRows
            .Select(d => new SimulationDraftListItem(
                d.Id,
                d.TermId,
                d.Label,
                d.Status,
                d.Visibility,
                itemsByDraft.GetValueOrDefault(d.Id, EmptyItems),
                d.CreatedAt))
            .ToList();
    }

    private static readonly IReadOnlyList<SimulationDraftListItemSubject> EmptyItems = [];

    // Record con { get; init; } (no posicional): Dapper materializa DateTimeOffset vía el setter
    // reflection-based, que sabe convertir el DateTime que devuelve Npgsql para timestamptz. El
    // constructor-matching de un record posicional exige tipos exactos y revienta con
    // "no parameterless constructor... required" apenas hay un DateTimeOffset de por medio.
    private sealed record DraftRow
    {
        public Guid Id { get; init; }
        public Guid TermId { get; init; }
        public string? Label { get; init; }
        public string Status { get; init; } = string.Empty;
        public string Visibility { get; init; } = string.Empty;
        public DateTimeOffset CreatedAt { get; init; }
    }

    private sealed record ItemRow(
        Guid DraftId, Guid SubjectId, string SubjectCode, string SubjectName,
        Guid? CommissionId, string? CommissionName);
}
