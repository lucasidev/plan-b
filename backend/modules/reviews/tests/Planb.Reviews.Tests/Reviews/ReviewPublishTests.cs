using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Reviews;

/// <summary>
/// Domain unit tests de <see cref="Review.Publish"/> enfocados en una decisión de la versión
/// anterior del producto (en retiro, ADR-0063): el docente reseñado puede nombrarse sin resolver
/// (<c>ReviewedTeacherId</c> null), pero el nombre declarado (<c>ReviewedTeacherName</c>) nunca es
/// vacío, esté o no resuelto el id.
/// </summary>
public class ReviewPublishTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 30, 12, 0, 0, TimeSpan.Zero);

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static ReviewText SubjectText() =>
        ReviewText.CreateOptional(
            "Cursada completa, material claro y el docente acompaña bien en las consultas.").Value!.Value;

    private static Result<Review> Publish(Guid? reviewedTeacherId, string? reviewedTeacherName) =>
        Review.Publish(
            Guid.NewGuid(),
            Guid.NewGuid(),
            reviewedTeacherId,
            reviewedTeacherName!,
            DifficultyRating.Create(3).Value,
            OverallRating.Create(4).Value,
            hoursPerWeek: null,
            tags: null,
            wouldRecommendCourse: true,
            wouldRetakeTeacher: true,
            SubjectText(),
            teacherText: null,
            finalGrade: null,
            ReviewStatus.Published,
            new FixedClock(T0));

    [Fact]
    public void Publish_UnresolvedTeacherId_Succeeds_WhenNameIsPresent()
    {
        var result = Publish(reviewedTeacherId: null, reviewedTeacherName: "Profesor Sin Resolver");

        result.IsSuccess.ShouldBeTrue();
        result.Value.ReviewedTeacherId.ShouldBeNull();
        result.Value.ReviewedTeacherName.ShouldBe("Profesor Sin Resolver");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Publish_BlankTeacherName_ReturnsError_EvenWithAResolvedId(string? blankName)
    {
        var result = Publish(reviewedTeacherId: Guid.NewGuid(), reviewedTeacherName: blankName);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.ReviewedTeacherNameRequired);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Publish_BlankTeacherName_ReturnsError_WithoutAResolvedIdEither(string? blankName)
    {
        var result = Publish(reviewedTeacherId: null, reviewedTeacherName: blankName);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.ReviewedTeacherNameRequired);
    }

    [Fact]
    public void Publish_TrimsTheDeclaredTeacherName()
    {
        var result = Publish(reviewedTeacherId: Guid.NewGuid(), reviewedTeacherName: "  Profesora Con Espacios  ");

        result.IsSuccess.ShouldBeTrue();
        result.Value.ReviewedTeacherName.ShouldBe("Profesora Con Espacios");
    }
}
