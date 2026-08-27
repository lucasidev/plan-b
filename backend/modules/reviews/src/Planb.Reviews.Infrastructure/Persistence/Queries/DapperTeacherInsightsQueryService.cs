using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.TeacherInsights;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de los crowd insights de un docente (US-003). Una query agregada sobre
/// <c>reviews.reviews</c> filtrando por <c>reviewed_teacher_id</c> (la reseña guarda el docente
/// reseñado directo, no hace falta join con enrollments). Solo cuentan las Published, mismo
/// invariante que el feed y los insights de materia.
///
/// <para>
/// Decisión de la versión anterior del producto, retirada con ADR-0063: <c>reviewed_teacher_id</c>
/// es nullable (la reseña puede nombrar un docente sin resolver). El filtro
/// <c>reviewed_teacher_id = @TeacherId</c> ya excluye esas filas de forma
/// natural (NULL nunca iguala a un Guid concreto en SQL), y es deliberado, no un efecto
/// colateral: no se sabe de quién habla una reseña sin resolver, así que no puede sumar al
/// agregado de ningún docente.
/// </para>
///
/// <para>
/// Desviación deliberada de la letra del ADR: el ADR pide que los agregados cuenten solo lo
/// respaldado (nivel de confianza de la cursada que ancla la reseña, vía
/// <c>EnrollmentRecord.Source</c>). Todavía no se filtra por eso acá: hoy toda cursada existente es
/// <c>SelfDeclared</c> (no hay forma de distinguir cuáles vinieron de un import), así que filtrar
/// por procedencia vaciaría todos los números del producto sin ganar nada. La procedencia se
/// registra y viaja en los reads; el filtrado por nivel de confianza llega cuando exista corpus
/// real de <c>TranscriptImport</c>.
/// </para>
///
/// Los promedios son <c>AVG(...)</c> que devuelve NULL sobre conjunto vacío (docente sin reseñas),
/// lo que mapea a los <c>double?</c> del DTO. El histograma usa <c>COUNT(*) FILTER</c>.
/// </summary>
internal sealed class DapperTeacherInsightsQueryService : ITeacherInsightsQueryService
{
    private readonly string _connectionString;

    public DapperTeacherInsightsQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperTeacherInsightsQueryService.");
    }

    public async Task<TeacherReviewInsights> GetForTeacherAsync(
        Guid teacherId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                COUNT(*)::int                                                       AS TotalCount,
                AVG(r.overall_rating)::float8                                        AS AverageOverallRating,
                AVG(r.difficulty_rating)::float8                                     AS AverageDifficulty,
                AVG(r.hours_per_week)::float8                                        AS AverageHoursPerWeek,
                (AVG(CASE WHEN r.would_recommend_course THEN 1.0 ELSE 0.0 END) * 100)::float8
                                                                                    AS RecommendPercentage,
                COUNT(*) FILTER (WHERE r.overall_rating = 1)::int                    AS Rating1,
                COUNT(*) FILTER (WHERE r.overall_rating = 2)::int                    AS Rating2,
                COUNT(*) FILTER (WHERE r.overall_rating = 3)::int                    AS Rating3,
                COUNT(*) FILTER (WHERE r.overall_rating = 4)::int                    AS Rating4,
                COUNT(*) FILTER (WHERE r.overall_rating = 5)::int                    AS Rating5
            FROM reviews.reviews r
            WHERE r.reviewed_teacher_id = @TeacherId
              AND r.status = 'Published';";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var row = await db.QuerySingleAsync<Row>(
            new CommandDefinition(sql, new { TeacherId = teacherId }, cancellationToken: ct));

        return new TeacherReviewInsights(
            TotalCount: row.TotalCount,
            AverageOverallRating: row.AverageOverallRating,
            AverageDifficulty: row.AverageDifficulty,
            AverageHoursPerWeek: row.AverageHoursPerWeek,
            RecommendPercentage: row.RecommendPercentage,
            RatingHistogram: [row.Rating1, row.Rating2, row.Rating3, row.Rating4, row.Rating5]);
    }

    private sealed record Row(
        int TotalCount,
        double? AverageOverallRating,
        double? AverageDifficulty,
        double? AverageHoursPerWeek,
        double? RecommendPercentage,
        int Rating1,
        int Rating2,
        int Rating3,
        int Rating4,
        int Rating5);
}
