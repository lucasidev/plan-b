using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de las reseñas de una cuenta (US-165, US-166): lo que aportó, para poder corregirlo
/// o borrarlo.
///
/// <para>
/// Filtra por <c>account_id</c> y ese parámetro sale del token, nunca del pedido: es el único read
/// del producto que devuelve reseñas de a una, así que quién puede pedirlo es la garantía entera.
/// </para>
///
/// <para>
/// Cruza a <c>academic</c> para traer los nombres. ADR-0017 saca las FK y la navegación EF
/// cross-schema, no los JOIN de lectura: pedirle cada nombre al contrato de academic sería un N+1
/// por una pantalla que ya sabe exactamente qué filas quiere, y el read de "mis reseñas" del modelo
/// anterior ya resolvía esto igual.
/// </para>
/// </summary>
internal sealed class DapperMyCourseReviewsQueryService : IMyCourseReviewsQueryService
{
    private readonly string _connectionString;

    public DapperMyCourseReviewsQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperMyCourseReviewsQueryService.");
    }

    public async Task<IReadOnlyList<MyCourseReviewView>> ListAsync(
        Guid accountId, CancellationToken ct = default)
    {
        // La cátedra entra por LEFT JOIN porque declararla es opcional: "no me acuerdo" es una
        // respuesta válida al reseñar, y esa reseña sigue siendo suya y editable.
        const string sql = @"
            SELECT
                r.id          AS Id,
                r.subject_id  AS SubjectId,
                s.name        AS SubjectName,
                s.code        AS SubjectCode,
                r.term_id     AS TermId,
                t.label       AS TermLabel,
                r.chair_id    AS ChairId,
                c.name        AS ChairName,
                r.free_text   AS FreeText,
                r.created_at  AS CreatedAt,
                r.updated_at  AS UpdatedAt
            FROM reviews.course_reviews r
            JOIN academic.subjects s ON s.id = r.subject_id
            JOIN academic.academic_terms t ON t.id = r.term_id
            LEFT JOIN academic.chairs c ON c.id = r.chair_id
            WHERE r.account_id = @AccountId
            ORDER BY r.created_at DESC;

            SELECT
                a.course_review_id AS ReviewId,
                i.code             AS ItemCode,
                a.option_value     AS OptionValue
            FROM reviews.course_review_answers a
            JOIN reviews.items i ON i.id = a.item_id
            WHERE a.course_review_id IN (
                SELECT id FROM reviews.course_reviews WHERE account_id = @AccountId)
            ORDER BY i.code;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        using var grid = await db.QueryMultipleAsync(
            new CommandDefinition(sql, new { AccountId = accountId }, cancellationToken: ct));

        var rows = (await grid.ReadAsync<MyCourseReviewRow>()).AsList();
        var answersByReview = (await grid.ReadAsync<MyAnswerRow>())
            .GroupBy(a => a.ReviewId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<MyAnswerView>)g
                    .Select(a => new MyAnswerView(a.ItemCode, a.OptionValue))
                    .ToList());

        return rows
            .Select(r =>
            {
                answersByReview.TryGetValue(r.Id, out var answers);
                answers ??= [];

                return new MyCourseReviewView(
                    r.Id,
                    r.SubjectId,
                    r.SubjectName,
                    r.SubjectCode,
                    r.TermId,
                    r.TermLabel,
                    r.ChairId,
                    r.ChairName,
                    answers.Count,
                    answers,
                    r.FreeText,
                    AsOffset(r.CreatedAt),
                    AsOffset(r.UpdatedAt));
            })
            .ToList();
    }

    /// <summary>
    /// Npgsql devuelve timestamptz como DateTime (Kind=Utc), no como DateTimeOffset: mapearlo
    /// directo al record tira InvalidCastException.
    /// </summary>
    private static DateTimeOffset AsOffset(DateTime raw) =>
        new(DateTime.SpecifyKind(raw, DateTimeKind.Utc));

    private sealed record MyCourseReviewRow(
        Guid Id,
        Guid SubjectId,
        string SubjectName,
        string SubjectCode,
        Guid TermId,
        string TermLabel,
        Guid? ChairId,
        string? ChairName,
        string? FreeText,
        DateTime CreatedAt,
        DateTime UpdatedAt);

    private sealed record MyAnswerRow(Guid ReviewId, string ItemCode, short OptionValue);
}
