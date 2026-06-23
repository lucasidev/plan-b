using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Academic.Application.Features.Search;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper read de la búsqueda de catálogo (US-004). Ranking: code exacto > prefix (code/name) >
/// similitud trigram. El WHERE mezcla prefix + substring + <c>similarity &gt; 0.2</c> para tolerar
/// typos ("anlaisis" -> Análisis). Todo pasa por <c>unaccent()</c> para que la búsqueda sea
/// insensible a acentos ("analisis" / "anal" matchean "Análisis"), clave en un catálogo en
/// español. El índice GIN trigram (migración AddSubjectSearchTrigram) cubre el catálogo actual; a
/// escala convendría un expression index sobre <c>unaccent(name)</c> con un wrapper IMMUTABLE.
/// </summary>
internal sealed class DapperSubjectSearchReader : ISubjectSearchReader
{
    private readonly string _connectionString;

    public DapperSubjectSearchReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperSubjectSearchReader.");
    }

    public async Task<IReadOnlyList<SearchResultItem>> SearchAsync(
        string term, int limit, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT id AS Id, code AS Code, name AS Name
            FROM academic.subjects
            WHERE unaccent(lower(code)) LIKE unaccent(lower(@Term)) || '%'
               OR unaccent(name) ILIKE '%' || unaccent(@Term) || '%'
               OR similarity(unaccent(name), unaccent(@Term)) > 0.2
               OR similarity(unaccent(code), unaccent(@Term)) > 0.2
            ORDER BY
               (unaccent(lower(code)) = unaccent(lower(@Term))) DESC,
               (unaccent(lower(code)) LIKE unaccent(lower(@Term)) || '%'
                    OR unaccent(name) ILIKE unaccent(@Term) || '%') DESC,
               GREATEST(similarity(unaccent(name), unaccent(@Term)),
                        similarity(unaccent(code), unaccent(@Term))) DESC,
               name ASC
            LIMIT @Limit;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = await db.QueryAsync<SubjectSearchRow>(
            new CommandDefinition(sql, new { Term = term, Limit = limit }, cancellationToken: ct));

        return rows
            .Select(r => new SearchResultItem("subject", r.Id, r.Name, r.Code))
            .ToList();
    }

    private sealed record SubjectSearchRow(Guid Id, string Code, string Name);
}
