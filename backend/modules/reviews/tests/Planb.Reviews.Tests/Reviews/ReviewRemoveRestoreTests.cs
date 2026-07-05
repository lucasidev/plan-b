using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Reviews;

/// <summary>
/// Domain unit tests de <see cref="Review.Remove"/> + <see cref="Review.RestoreFromReports"/> (US-051).
/// La autorización (que un moderador tomó la decisión) vive en el consumer del evento; acá se cubren
/// las transiciones del aggregate y su idempotencia.
/// </summary>
public class ReviewRemoveRestoreTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 5, 12, 0, 0, TimeSpan.Zero);

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static Review New(ReviewStatus status)
    {
        var review = Review.Publish(
            Guid.NewGuid(),
            Guid.NewGuid(),
            DifficultyRating.Create(3).Value,
            OverallRating.Create(4).Value,
            null,
            null,
            wouldRecommendCourse: true,
            wouldRetakeTeacher: true,
            ReviewText.CreateOptional(
                "Cursada completa, material claro y el docente acompaña bien en las consultas.").Value,
            null,
            null,
            status,
            new FixedClock(T0)).Value;
        review.ClearDomainEvents();
        return review;
    }

    [Fact]
    public void Remove_hides_a_published_review()
    {
        var review = New(ReviewStatus.Published);

        var removed = review.Remove(new FixedClock(T0.AddHours(1)));

        removed.ShouldBeTrue();
        review.Status.ShouldBe(ReviewStatus.Removed);
    }

    [Fact]
    public void Remove_hides_an_under_review_review()
    {
        var review = New(ReviewStatus.UnderReview);

        review.Remove(new FixedClock(T0)).ShouldBeTrue();

        review.Status.ShouldBe(ReviewStatus.Removed);
    }

    [Fact]
    public void Remove_is_noop_on_an_already_removed_review()
    {
        var review = New(ReviewStatus.Published);
        review.Remove(new FixedClock(T0)).ShouldBeTrue();

        var second = review.Remove(new FixedClock(T0.AddHours(1)));

        second.ShouldBeFalse();
        review.Status.ShouldBe(ReviewStatus.Removed);
    }

    [Fact]
    public void RestoreFromReports_republishes_an_under_review_review()
    {
        var review = New(ReviewStatus.UnderReview);

        review.RestoreFromReports(new FixedClock(T0.AddHours(1))).ShouldBeTrue();

        review.Status.ShouldBe(ReviewStatus.Published);
    }

    [Fact]
    public void RestoreFromReports_is_noop_when_not_under_review()
    {
        var published = New(ReviewStatus.Published);

        published.RestoreFromReports(new FixedClock(T0)).ShouldBeFalse();

        published.Status.ShouldBe(ReviewStatus.Published);
    }
}
