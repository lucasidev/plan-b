using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Reviews;

/// <summary>
/// Domain unit tests de <see cref="Review.Respond"/> (US-040). La autorización cross-BC (que quien
/// responde sea el docente verificado) vive en el handler; acá se cubren las reglas del aggregate:
/// solo se responde una reseña Published, una sola respuesta, y el que responde es el docente reseñado.
/// </summary>
public class ReviewRespondTests
{
    private static readonly DateTimeOffset T0 = new(2026, 6, 27, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid Teacher = Guid.NewGuid();

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static Review Published(Guid teacherId, ReviewStatus status = ReviewStatus.Published)
    {
        var review = Review.Publish(
            Guid.NewGuid(),
            teacherId,
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

    private static ReviewText Text() =>
        ReviewText.Create(
            "Gracias por la devolución. Ajusté el cronograma de prácticos para este cuatrimestre.").Value;

    [Fact]
    public void Respond_creates_the_response_for_the_reviewed_teacher()
    {
        var review = Published(Teacher);
        var respondAt = T0.AddDays(1);

        var result = review.Respond(Teacher, Text(), new FixedClock(respondAt));

        result.IsSuccess.ShouldBeTrue();
        review.Response.ShouldNotBeNull();
        review.Response!.TeacherId.ShouldBe(Teacher);
        review.Response.Status.ShouldBe(TeacherResponseStatus.Published);
        review.Response.CreatedAt.ShouldBe(respondAt);
    }

    [Fact]
    public void Respond_rejects_a_second_response()
    {
        var review = Published(Teacher);
        review.Respond(Teacher, Text(), new FixedClock(T0)).IsSuccess.ShouldBeTrue();

        var second = review.Respond(Teacher, Text(), new FixedClock(T0.AddHours(1)));

        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(ReviewErrors.ResponseAlreadyExists);
    }

    [Fact]
    public void Respond_rejects_a_teacher_who_is_not_the_reviewed_one()
    {
        var review = Published(Teacher);

        var result = review.Respond(Guid.NewGuid(), Text(), new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.NotVerifiedTeacherForReview);
        review.Response.ShouldBeNull();
    }

    [Fact]
    public void Respond_rejects_a_non_published_review()
    {
        var review = Published(Teacher, ReviewStatus.UnderReview);

        var result = review.Respond(Teacher, Text(), new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.CannotRespondToNonPublished);
    }
}
