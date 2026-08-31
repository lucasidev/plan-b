using Dapper;
using Planb.Academic.Application.Features.AdminChairs;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper read de las cátedras de una materia para el backoffice (US-196), con su equipo.
///
/// <para>
/// Dos consultas y no un JOIN plano: una cátedra con seis integrantes traería seis filas con su
/// nombre repetido, y armar el árbol en memoria a partir de eso es donde se cuelan los bugs de
/// agrupación. Con <c>QueryMultiple</c> viajan igual en un solo viaje.
/// </para>
/// </summary>
internal sealed class DapperAdminChairReader : IAdminChairReader
{
    private readonly IDbConnectionFactory _connections;

    public DapperAdminChairReader(IDbConnectionFactory connections) => _connections = connections;

    public async Task<IReadOnlyList<AdminChairListItem>> ListBySubjectAsync(
        Guid subjectId, CancellationToken ct = default)
    {
        // Las archivadas entran: quien carga tiene que ver lo que archivó para poder corregirse.
        // El orden pone las activas primero y después alfabético, que es el que no opina.
        const string sql = @"
            SELECT
                c.id        AS Id,
                c.name      AS Name,
                c.is_active AS IsActive
            FROM academic.chairs c
            WHERE c.subject_id = @SubjectId
            ORDER BY c.is_active DESC, c.name;

            SELECT
                cm.chair_id     AS ChairId,
                cm.teacher_id   AS TeacherId,
                t.first_name    AS FirstName,
                t.last_name     AS LastName,
                cm.role         AS Role,
                since.label     AS SinceTermLabel,
                until.label     AS UntilTermLabel
            FROM academic.chair_members cm
            JOIN academic.chairs c        ON c.id = cm.chair_id
            JOIN academic.teachers t      ON t.id = cm.teacher_id
            JOIN academic.academic_terms since ON since.id = cm.since_term_id
            LEFT JOIN academic.academic_terms until ON until.id = cm.until_term_id
            WHERE c.subject_id = @SubjectId
            ORDER BY cm.until_term_id NULLS FIRST, since.label DESC;";

        using var db = _connections.Create();
        using var grid = await db.QueryMultipleAsync(
            new CommandDefinition(sql, new { SubjectId = subjectId }, cancellationToken: ct));

        var chairs = (await grid.ReadAsync<ChairRow>()).AsList();
        var membersByChair = (await grid.ReadAsync<MemberRow>())
            .GroupBy(m => m.ChairId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<AdminChairMemberItem>)g
                    .Select(m => new AdminChairMemberItem(
                        m.TeacherId, m.FirstName, m.LastName,
                        m.Role, m.SinceTermLabel, m.UntilTermLabel))
                    .ToList());

        return chairs
            .Select(c => new AdminChairListItem(
                c.Id,
                c.Name,
                c.IsActive,
                membersByChair.TryGetValue(c.Id, out var members) ? members : []))
            .ToList();
    }

    private sealed record ChairRow(Guid Id, string Name, bool IsActive);

    private sealed record MemberRow(
        Guid ChairId,
        Guid TeacherId,
        string FirstName,
        string LastName,
        string Role,
        string SinceTermLabel,
        string? UntilTermLabel);
}
