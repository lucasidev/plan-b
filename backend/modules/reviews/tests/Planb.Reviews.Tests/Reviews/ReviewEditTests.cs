using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Reviews;

/// <summary>
/// Domain unit tests de <see cref="Review.Edit"/> (US-018). La autorización (autoría, cooldown)
/// y el re-run del content filter viven en el handler; acá se cubren las reglas del aggregate:
/// la invariante "al menos un texto" reevaluada post-patch, y la semántica de patch parcial
/// (un campo no provisto queda intacto, incluso si el caller mandó un valor para él).
/// </summary>
public class ReviewEditTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 5, 12, 0, 0, TimeSpan.Zero);

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static ReviewText SubjectText() =>
        ReviewText.CreateOptional(
            "Cursada completa, material claro y el docente acompaña bien en las consultas.").Value!.Value;

    private static ReviewText TeacherText() =>
        ReviewText.CreateOptional(
            "El profesor explica con mucha claridad y motiva a preguntar en cada clase.").Value!.Value;

    private static Review PublishedWith(ReviewText? subjectText, ReviewText? teacherText, int? hoursPerWeek = null) =>
        Review.Publish(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            DifficultyRating.Create(3).Value,
            OverallRating.Create(4).Value,
            hoursPerWeek,
            null,
            wouldRecommendCourse: true,
            wouldRetakeTeacher: true,
            subjectText,
            teacherText,
            null,
            ReviewStatus.Published,
            new FixedClock(T0)).Value;

    [Fact]
    public void Edit_fails_when_the_patch_clears_both_texts()
    {
        var review = PublishedWith(SubjectText(), TeacherText());
        review.ClearDomainEvents();

        var result = review.Edit(
            newDifficultyRating: null,
            newOverallRating: null,
            newHoursPerWeek: null,
            hoursPerWeekProvided: false,
            newTags: null,
            newWouldRecommendCourse: null,
            newWouldRetakeTeacher: null,
            newSubjectText: null,
            subjectTextProvided: true,
            newTeacherText: null,
            teacherTextProvided: true,
            newFinalGrade: null,
            finalGradeProvided: false,
            statusAfter: ReviewStatus.Published,
            clock: new FixedClock(T0.AddHours(1)));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.AtLeastOneTextRequired);

        // El aggregate no debe haber mutado: la validación corre antes de aplicar el patch.
        review.SubjectText.ShouldNotBeNull();
        review.TeacherText.ShouldNotBeNull();
        review.Status.ShouldBe(ReviewStatus.Published);
        review.UpdatedAt.ShouldBe(T0);
    }

    [Fact]
    public void Edit_partial_patch_only_touches_the_provided_field()
    {
        var review = PublishedWith(SubjectText(), teacherText: null);
        review.ClearDomainEvents();
        var originalDifficulty = review.DifficultyRating;
        var newSubjectText = ReviewText.CreateOptional(
            "Actualizo la reseña: el parcial cambió de formato este cuatrimestre.").Value!.Value;
        var editAt = T0.AddHours(2);

        var result = review.Edit(
            newDifficultyRating: null,
            newOverallRating: null,
            newHoursPerWeek: null,
            hoursPerWeekProvided: false,
            newTags: null,
            newWouldRecommendCourse: null,
            newWouldRetakeTeacher: null,
            newSubjectText: newSubjectText,
            subjectTextProvided: true,
            newTeacherText: null,
            teacherTextProvided: false,
            newFinalGrade: null,
            finalGradeProvided: false,
            statusAfter: ReviewStatus.Published,
            clock: new FixedClock(editAt));

        result.IsSuccess.ShouldBeTrue();
        review.SubjectText!.Value.Value.ShouldBe(newSubjectText.Value);
        review.TeacherText.ShouldBeNull(); // no provisto: sigue intacto (no tocado)
        review.DifficultyRating.ShouldBe(originalDifficulty); // no provisto: intacto
        review.UpdatedAt.ShouldBe(editAt);
    }

    [Fact]
    public void Edit_ignores_the_hours_per_week_value_when_not_provided()
    {
        var review = PublishedWith(SubjectText(), TeacherText(), hoursPerWeek: 5);
        review.ClearDomainEvents();

        var result = review.Edit(
            newDifficultyRating: null,
            newOverallRating: null,
            newHoursPerWeek: 99, // valor "trampa": no debe aplicarse porque el flag dice que no fue provisto
            hoursPerWeekProvided: false,
            newTags: null,
            newWouldRecommendCourse: null,
            newWouldRetakeTeacher: null,
            newSubjectText: null,
            subjectTextProvided: false,
            newTeacherText: null,
            teacherTextProvided: false,
            newFinalGrade: null,
            finalGradeProvided: false,
            statusAfter: ReviewStatus.Published,
            clock: new FixedClock(T0.AddHours(3)));

        result.IsSuccess.ShouldBeTrue();
        review.HoursPerWeek.ShouldBe(5); // el flag manda, no el valor
    }

    /// <summary>
    /// El edit vuelve a pasar el filtro y su veredicto pisa la razón anterior en los dos sentidos.
    /// Importa que la razón quede bien puesta porque es la que decide si un dismiss de moderación
    /// puede republicar la reseña: si el edit dejara de estamparla, la puerta de republicación de
    /// contenido filtrado se reabre en silencio.
    /// </summary>
    [Theory]
    [InlineData(ReviewStatus.UnderReview, UnderReviewReason.ContentFilter)]
    [InlineData(ReviewStatus.Published, null)]
    public void Edit_estampa_la_razon_segun_el_veredicto_del_filtro(
        ReviewStatus statusAfter, UnderReviewReason? expectedReason)
    {
        var review = PublishedWith(SubjectText(), TeacherText());

        var result = review.Edit(
            newDifficultyRating: null,
            newOverallRating: null,
            newHoursPerWeek: null,
            hoursPerWeekProvided: false,
            newTags: null,
            newWouldRecommendCourse: null,
            newWouldRetakeTeacher: null,
            newSubjectText: SubjectText(),
            subjectTextProvided: true,
            newTeacherText: null,
            teacherTextProvided: false,
            newFinalGrade: null,
            finalGradeProvided: false,
            statusAfter: statusAfter,
            clock: new FixedClock(T0.AddHours(1)));

        result.IsSuccess.ShouldBeTrue();
        review.UnderReviewReason.ShouldBe(expectedReason);
    }

    /// <summary>
    /// EditedAt es lo que el feed muestra como "editada". No puede derivarse de UpdatedAt porque esa
    /// marca la mueven también la respuesta del docente y las transiciones de moderación, o sea
    /// acciones de otra gente sobre la reseña.
    /// </summary>
    [Fact]
    public void Edit_estampa_EditedAt_que_arranca_nulo()
    {
        var review = PublishedWith(SubjectText(), TeacherText());
        review.EditedAt.ShouldBeNull();

        review.Edit(
            newDifficultyRating: null,
            newOverallRating: null,
            newHoursPerWeek: null,
            hoursPerWeekProvided: false,
            newTags: null,
            newWouldRecommendCourse: null,
            newWouldRetakeTeacher: null,
            newSubjectText: SubjectText(),
            subjectTextProvided: true,
            newTeacherText: null,
            teacherTextProvided: false,
            newFinalGrade: null,
            finalGradeProvided: false,
            statusAfter: ReviewStatus.Published,
            clock: new FixedClock(T0.AddHours(1))).IsSuccess.ShouldBeTrue();

        review.EditedAt.ShouldBe(T0.AddHours(1));
    }

    /// <summary>
    /// La contraparte: responder una reseña mueve UpdatedAt pero NO EditedAt. Es exactamente el caso
    /// que hacía mentir al badge "editada" cuando se derivaba de UpdatedAt.
    /// </summary>
    [Fact]
    public void Respond_no_marca_la_resena_como_editada()
    {
        var review = PublishedWith(SubjectText(), TeacherText());
        var teacherId = review.ReviewedTeacherId;

        review.Respond(
            teacherId,
            ReviewText.Create(
                "Gracias por la devolución, la tomo para el próximo cuatrimestre y la charlo en clase.").Value,
            new FixedClock(T0.AddHours(2))).IsSuccess.ShouldBeTrue();

        review.UpdatedAt.ShouldBe(T0.AddHours(2));
        review.EditedAt.ShouldBeNull();
    }
}
