using Microsoft.Extensions.Logging;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Votes;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.Seeding;

/// <summary>
/// Materializa el corpus de prueba de reseñas + votos. Construye las reseñas con los mismos VOs y
/// factory que el handler de publish (no SQL crudo), todas <see cref="ReviewStatus.Published"/>
/// (el texto de prueba es limpio, no pasa por el content filter), con <c>CreatedAt</c> backdated
/// por reseña vía un clock fijo, así el feed muestra fechas históricas escalonadas en vez de "hoy".
///
/// Después seedea los votos entre autores (helpful counts no-cero en el corpus de prueba). Los
/// votantes son siempre autores distintos del autor de la reseña (el manifiesto lo garantiza); las
/// personas de login (Lucía, Mateo) NO votan acá, así arrancan sin voto y pueden votar en vivo.
/// </summary>
public sealed class ReviewsSeeder
{
    private readonly IReviewRepository _reviews;
    private readonly IReviewVoteRepository _votes;
    private readonly IReviewsUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<ReviewsSeeder> _log;

    public ReviewsSeeder(
        IReviewRepository reviews,
        IReviewVoteRepository votes,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        ILogger<ReviewsSeeder> log)
    {
        _reviews = reviews;
        _votes = votes;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _log = log;
    }

    public async Task SeedAsync(
        IReadOnlyList<ReviewSpec> reviewSpecs,
        IReadOnlyList<VoteSpec> voteSpecs,
        CancellationToken ct = default)
    {
        var reviewIds = new Dictionary<string, ReviewId>(StringComparer.Ordinal);
        var createdReviews = 0;

        foreach (var spec in reviewSpecs)
        {
            var difficulty = DifficultyRating.Create(spec.DifficultyRating);
            var overall = OverallRating.Create(spec.OverallRating);
            var subjectText = ReviewText.CreateOptional(spec.SubjectText);
            if (difficulty.IsFailure || overall.IsFailure || subjectText.IsFailure)
            {
                _log.LogWarning("Seed review {Key} has invalid value objects; skipping.", spec.Key);
                continue;
            }

            FinalGrade? finalGrade = null;
            if (spec.FinalGrade is not null)
            {
                var gradeResult = FinalGrade.Create(spec.FinalGrade.Value);
                if (gradeResult.IsFailure)
                {
                    _log.LogWarning("Seed review {Key} has invalid final grade; skipping.", spec.Key);
                    continue;
                }
                finalGrade = gradeResult.Value;
            }

            // Backdating: cada reseña se publica con un reloj fijo en el pasado, así el feed
            // muestra "hace 3 meses", "hace 1 año", etc. en vez de que todo el corpus diga "hoy".
            var reviewClock = new FixedClock(_clock.UtcNow.AddDays(-spec.CreatedAtDaysAgo));

            var reviewResult = Review.Publish(
                spec.EnrollmentId,
                spec.DocenteResenadoId,
                difficulty.Value,
                overall.Value,
                spec.HoursPerWeek,
                spec.Tags,
                spec.WouldRecommendCourse,
                spec.WouldRetakeTeacher,
                subjectText.Value,
                teacherText: null,
                finalGrade,
                ReviewStatus.Published,
                reviewClock);

            if (reviewResult.IsFailure)
            {
                _log.LogWarning("Seed review {Key} publish failed: {Error}", spec.Key, reviewResult.Error.Code);
                continue;
            }

            var review = reviewResult.Value;
            _reviews.Add(review);
            reviewIds[spec.Key] = review.Id;
            createdReviews++;
        }

        var createdVotes = 0;
        foreach (var vote in voteSpecs)
        {
            if (!reviewIds.TryGetValue(vote.ReviewKey, out var reviewId))
            {
                continue;
            }

            _votes.Add(ReviewVote.Cast(reviewId, vote.VoterUserId, vote.IsHelpful, _clock));
            createdVotes++;
        }

        if (createdReviews > 0 || createdVotes > 0)
        {
            await _unitOfWork.SaveChangesAsync(ct);
            _log.LogInformation("Seeded {Reviews} reviews and {Votes} votes.", createdReviews, createdVotes);
        }
    }

    /// <summary>Reloj de un instante fijo, para backdatear el <c>CreatedAt</c> de cada reseña.</summary>
    private sealed class FixedClock : IDateTimeProvider
    {
        public FixedClock(DateTimeOffset now) => UtcNow = now;

        public DateTimeOffset UtcNow { get; }
    }
}

/// <summary>Spec plano de una reseña de prueba. <c>EnrollmentId</c> ya resuelto por el seeder de cursadas.</summary>
public sealed record ReviewSpec(
    string Key,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    int DifficultyRating,
    int OverallRating,
    int? HoursPerWeek,
    IReadOnlyList<string> Tags,
    bool WouldRecommendCourse,
    bool WouldRetakeTeacher,
    string SubjectText,
    decimal? FinalGrade,
    int CreatedAtDaysAgo);

/// <summary>Spec plano de un voto de prueba. <c>VoterUserId</c> es el userId de otro autor de prueba.</summary>
public sealed record VoteSpec(Guid VoterUserId, string ReviewKey, bool IsHelpful);
