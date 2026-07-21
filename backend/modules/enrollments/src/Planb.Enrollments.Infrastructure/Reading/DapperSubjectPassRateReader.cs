using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Enrollments.Application.Features.SubjectPassRate;

namespace Planb.Enrollments.Infrastructure.Reading;

/// <summary>
/// Dapper read de la aprobación histórica (ADR-0047). Una query agregada sobre
/// <c>enrollments.enrollment_records</c> contando aprobadas (no equivalencia) y reprobadas de la
/// materia. El gate de muestra mínima (anti re-identificación + ruido estadístico) se aplica acá:
/// con menos de <see cref="MinSampleSize"/> cursadas con verdicto, <c>PassRate</c> va null y la UI
/// muestra "datos insuficientes".
///
/// Definición (ver ADR): numerador = <c>Aprobada</c> con <c>approval_method != Equivalencia</c>
/// (rindió acá); denominador = ese numerador + <c>Reprobada</c>. Cursando / Regular / Abandonada
/// quedan afuera (sin verdicto de examen). El `status`/`approval_method` se guardan como string.
/// </summary>
internal sealed class DapperSubjectPassRateReader : ISubjectPassRateReader
{
    /// <summary>Muestra mínima para mostrar el número (anti re-identificación). Ver ADR-0047.</summary>
    public const int MinSampleSize = 5;

    private readonly string _connectionString;

    public DapperSubjectPassRateReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperSubjectPassRateReader.");
    }

    public async Task<SubjectPassRate> GetForSubjectAsync(Guid subjectId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                COUNT(*) FILTER (
                    WHERE status = 'Passed' AND approval_method <> 'CreditTransfer'
                )::int AS Approved,
                COUNT(*) FILTER (WHERE status = 'Failed')::int AS Failed
            FROM enrollments.enrollment_records
            WHERE subject_id = @SubjectId;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var row = await db.QuerySingleAsync<Row>(
            new CommandDefinition(sql, new { SubjectId = subjectId }, cancellationToken: ct));

        var sampleSize = row.Approved + row.Failed;
        double? passRate = sampleSize >= MinSampleSize
            ? row.Approved * 100.0 / sampleSize
            : null;

        return new SubjectPassRate(passRate, sampleSize);
    }

    private sealed record Row(int Approved, int Failed);
}
