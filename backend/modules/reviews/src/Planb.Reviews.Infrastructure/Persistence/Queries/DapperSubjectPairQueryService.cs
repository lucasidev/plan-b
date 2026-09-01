using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de con qué otras materias se llevó una (US-143). Self-join sobre
/// <c>reviews</c>: no hace falta ninguna tabla ni migración nueva, porque cada reseña ya
/// trae cuenta, materia y período.
///
/// <para>
/// No sale del schema <c>reviews</c>: devuelve el id de la otra materia, y el nombre lo compone
/// quien arma la ficha pidiéndoselo al contrato de academic (ADR-0087).
/// </para>
/// </summary>
internal sealed class DapperSubjectPairQueryService : ISubjectPairQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperSubjectPairQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<SubjectPairTally>> ListForSubjectAsync(
        Guid subjectId, CancellationToken ct = default)
    {
        // `outcomes` resuelve el desenlace de cada reseña una sola vez; sin eso habría que joinear
        // dos veces contra answers e items por cada fila del par.
        //
        // El `<>` del join es lo que evita que la materia se empareje consigo misma, y el grano de
        // `pairs` es una fila por cuenta, par y período: por eso el conteo de afuera es `count(*)`
        // y no `count(DISTINCT account_id)`.
        const string sql = @"
            WITH outcomes AS (
                SELECT a.review_id AS review_id, a.option_value
                FROM reviews.review_answers a
                JOIN reviews.items i ON i.id = a.item_id
                WHERE i.code = @OutcomeCode
            ),
            mine AS (
                SELECT id, account_id, term_id
                FROM reviews.reviews
                WHERE subject_id = @SubjectId
            ),
            pairs AS (
                SELECT
                    other.subject_id AS other_subject_id,
                    other.term_id    AS term_id,
                    mine.id          AS mine_review_id,
                    other.id         AS other_review_id
                FROM mine
                JOIN reviews.reviews other
                  ON other.account_id = mine.account_id
                 AND other.term_id    = mine.term_id
                 AND other.subject_id <> @SubjectId
            )
            SELECT
                p.other_subject_id AS OtherSubjectId,
                p.term_id          AS TermId,
                count(*)::int      AS TogetherCount,
                count(*) FILTER (
                    WHERE (om.option_value IS NOT NULL
                           AND NOT (om.option_value = ANY(@ReachedValues)))
                       OR (oo.option_value IS NOT NULL
                           AND NOT (oo.option_value = ANY(@ReachedValues)))
                )::int             AS DroppedCount
            FROM pairs p
            LEFT JOIN outcomes om ON om.review_id = p.mine_review_id
            LEFT JOIN outcomes oo ON oo.review_id = p.other_review_id
            GROUP BY p.other_subject_id, p.term_id;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<SubjectPairTally>(new CommandDefinition(
            sql,
            new
            {
                SubjectId = subjectId,
                OutcomeCode = PublishingRules.OutcomeItemCode,
                ReachedValues = PublishingRules.OutcomeValuesReachingTheEnd.ToArray(),
            },
            cancellationToken: ct));

        return rows.ToList();
    }
}
