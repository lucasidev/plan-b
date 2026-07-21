using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Application.Features.EvaluateSimulation;

namespace Planb.Planning.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read para US-016 (lado "evaluate"). Dos queries independientes sobre schemas ajenos,
/// sin referenciar el Domain de Reviews ni Enrollments (ADR-0017): mismo criterio que
/// <c>DapperSimulatorAvailabilityReader</c> y <c>DapperSubjectInsightsQueryService</c> (Reviews),
/// que también cruzan schemas a pulso vía SQL parametrizado.
/// </summary>
internal sealed class DapperSimulatorEvaluationReader : ISimulatorEvaluationReader
{
    /// <summary>
    /// Muestra mínima para mostrar <c>PassRate</c>/<c>DropoutRate</c> de la cohorte (anti
    /// re-identificación, ADR-0047: mismo umbral y mismo criterio que
    /// <c>DapperSubjectPassRateReader.MinSampleSize</c> en Enrollments).
    ///
    /// <para>
    /// Acá el riesgo es más agudo que el pass-rate público de una materia: el match es un combo
    /// EXACTO de N materias, así que las muestras van a ser casi siempre 0, 1 o 2 (la limitación
    /// de datos que documenta la US-016). Con menos de <see cref="MinSampleSize"/>, "1 alumno
    /// cursó este combo y lo abandonó" es perfectamente atribuible en una carrera chica: el que
    /// consulta sabe quiénes cursaron con él. Decisión de política de datos (dueño del proyecto),
    /// no un parámetro de performance: no la bajes para "mostrar más números".
    /// </para>
    /// </summary>
    public const int MinSampleSize = 5;

    private readonly string _connectionString;

    public DapperSimulatorEvaluationReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperSimulatorEvaluationReader.");
    }

    /// <summary>
    /// AVG(difficulty_rating) sobre todas las reseñas Published de las materias del combo. Un
    /// AVG simple sobre la unión de reseñas ya pondera por cantidad: sumar N calificaciones de
    /// una materia y M de otra y dividir por (N+M) es aritméticamente lo mismo que ponderar el
    /// promedio de cada materia por su propio N, así que no hace falta un GROUP BY por materia ni
    /// una segunda pasada en C#. AVG sobre cero filas devuelve NULL (Postgres), que mapea directo
    /// al <c>double?</c> de retorno: "sin reseñas" es null, no 0.
    /// </summary>
    public async Task<double?> GetWeightedDifficultyAsync(
        IReadOnlyCollection<Guid> subjectIds, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT AVG(r.difficulty_rating)::float8 AS WeightedDifficulty
            FROM reviews.reviews r
            JOIN enrollments.enrollment_records er ON er.id = r.enrollment_id
            WHERE er.subject_id = ANY(@SubjectIds::uuid[])
              AND r.status = 'Published';";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        return await db.QuerySingleAsync<double?>(
            new CommandDefinition(
                sql, new { SubjectIds = subjectIds.ToArray() }, cancellationToken: ct));
    }

    /// <summary>
    /// Agrupa <c>enrollment_records</c> por (student_profile_id, term_id) y arma el conjunto de
    /// subject_id de cada grupo. "Exact match" se resuelve con los operadores de contención de
    /// arrays de Postgres (<c>@&gt;</c> / <c>&lt;@</c>) en vez de ordenar ambos lados e igualar
    /// arrays: <see cref="Guid"/> en .NET no ordena igual que <c>uuid</c> en Postgres (layout
    /// mixed-endian de los primeros 8 bytes), así que dos arrays con el mismo contenido pero
    /// ordenados por cada lado con su propio criterio podrían no resultar iguales con
    /// <c>=</c>. La contención mutua compara conjuntos, no secuencias: no importa el orden ni
    /// quién ordenó qué.
    ///
    /// <para>
    /// <paramref name="subjectIds"/> se asume sin duplicados (el handler ya dedupea antes de
    /// llamar). <c>term_id IS NOT NULL</c> excluye equivalencias (sin período real, no hay
    /// "mismo período" que comparar). El propio alumno que simula queda afuera vía
    /// <paramref name="excludingStudentProfileId"/>. Las tasas salen en escala 0-100 (porcentaje),
    /// mismo criterio que <c>SubjectPassRate.PassRate</c> (Enrollments, ADR-0047) y
    /// <c>SubjectReviewInsights.RecommendPercentage</c> (Reviews).
    /// </para>
    ///
    /// <para>
    /// El gate de muestra mínima (<see cref="MinSampleSize"/>) se aplica acá, en C#, después de
    /// traer los números crudos: mismo lugar que <c>DapperSubjectPassRateReader</c>, para que el
    /// umbral viva en un solo sitio (ni en la query ni en el handler) y el handler no tenga que
    /// conocerlo.
    /// </para>
    /// </summary>
    public async Task<CombinationCohortStats> GetCombinationCohortStatsAsync(
        IReadOnlyCollection<Guid> subjectIds,
        Guid excludingStudentProfileId,
        CancellationToken ct = default)
    {
        const string sql = @"
            WITH student_terms AS (
                SELECT student_profile_id, term_id, array_agg(subject_id) AS subject_set
                FROM enrollments.enrollment_records
                WHERE term_id IS NOT NULL
                GROUP BY student_profile_id, term_id
            ),
            matching AS (
                SELECT st.student_profile_id, st.term_id
                FROM student_terms st
                WHERE st.subject_set @> @SubjectIds::uuid[]
                  AND @SubjectIds::uuid[] @> st.subject_set
                  AND st.student_profile_id <> @ExcludingStudentProfileId
            )
            SELECT
                (SELECT COUNT(*) FROM matching)::int                                                              AS SampleSize,
                (COUNT(*) FILTER (WHERE er.status = 'Aprobada'))::float8 * 100.0 / NULLIF(COUNT(*), 0)::float8    AS PassRate,
                (COUNT(*) FILTER (WHERE er.status = 'Abandonada'))::float8 * 100.0 / NULLIF(COUNT(*), 0)::float8  AS DropoutRate
            FROM matching m
            JOIN enrollments.enrollment_records er
              ON er.student_profile_id = m.student_profile_id AND er.term_id = m.term_id;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var row = await db.QuerySingleAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    SubjectIds = subjectIds.ToArray(),
                    ExcludingStudentProfileId = excludingStudentProfileId,
                },
                cancellationToken: ct));

        // ADR-0047: sampleSize siempre se devuelve (es informativo, no identifica a nadie); las
        // tasas se ocultan por debajo del piso, igual que si la muestra fuera 0.
        var gated = row.SampleSize >= MinSampleSize;
        return new CombinationCohortStats(
            row.SampleSize,
            gated ? row.PassRate : null,
            gated ? row.DropoutRate : null);
    }

    private sealed record Row(int SampleSize, double? PassRate, double? DropoutRate);
}
