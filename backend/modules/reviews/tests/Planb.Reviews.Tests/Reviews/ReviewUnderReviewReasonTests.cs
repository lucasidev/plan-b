using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Reviews;

/// <summary>
/// Domain unit tests del invariante que reemplaza al bool <c>QuarantinedByContentFilter</c>:
/// <c>Review.Status == ReviewStatus.UnderReview</c> si y solo si
/// <c>Review.UnderReviewReason is not null</c>. Cubre las transiciones que tocan el campo
/// (<see cref="Review.Publish"/>, <see cref="Review.Edit"/>, <see cref="Review.QuarantineByReports"/>,
/// <see cref="Review.RestoreFromReports"/>, <see cref="Review.Remove"/>) y la regla nueva de
/// <see cref="Review.Edit"/>: permitido desde UnderReview salvo que la razón sea reports.
/// </summary>
public class ReviewUnderReviewReasonTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 29, 12, 0, 0, TimeSpan.Zero);

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static Review New(ReviewStatus status)
    {
        var review = Review.Publish(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Docente de Prueba",
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
    public void Publish_clean_deja_la_razon_nula()
    {
        var review = New(ReviewStatus.Published);

        review.Status.ShouldBe(ReviewStatus.Published);
        review.UnderReviewReason.ShouldBeNull();
    }

    [Fact]
    public void Publish_frenada_por_el_filtro_marca_la_razon_content_filter()
    {
        var review = New(ReviewStatus.UnderReview);

        review.Status.ShouldBe(ReviewStatus.UnderReview);
        review.UnderReviewReason.ShouldBe(UnderReviewReason.ContentFilter);
    }

    [Fact]
    public void QuarantineByReports_marca_la_razon_reports()
    {
        var review = New(ReviewStatus.Published);

        review.QuarantineByReports(new FixedClock(T0.AddHours(1))).ShouldBeTrue();

        review.Status.ShouldBe(ReviewStatus.UnderReview);
        review.UnderReviewReason.ShouldBe(UnderReviewReason.Reports);
    }

    [Fact]
    public void QuarantineByEnrollmentChange_marca_la_razon_enrollment_changed()
    {
        var review = New(ReviewStatus.Published);

        review.QuarantineByEnrollmentChange(new FixedClock(T0.AddHours(1))).ShouldBeTrue();

        review.Status.ShouldBe(ReviewStatus.UnderReview);
        // La razón importa por sus consecuencias: solo la cuarentena por reportes bloquea editar
        // (revisión 2026-07-29 de ADR-0063), así que marcarla como Reports le sacaría al autor la
        // única salida que tiene cuando nadie lo reportó.
        review.UnderReviewReason.ShouldBe(UnderReviewReason.EnrollmentChanged);
    }

    [Fact]
    public void QuarantineByEnrollmentChange_es_no_op_sobre_una_resena_ya_en_revision()
    {
        // La entrega del outbox es at-least-once: un evento duplicado no puede pisar la razón por
        // la que la reseña ya estaba en revisión.
        var review = New(ReviewStatus.Published);
        review.QuarantineByReports(new FixedClock(T0));

        review.QuarantineByEnrollmentChange(new FixedClock(T0.AddHours(1))).ShouldBeFalse();

        review.UnderReviewReason.ShouldBe(UnderReviewReason.Reports);
    }

    [Fact]
    public void RestoreFromReports_limpia_la_razon_cuando_aplica()
    {
        var review = New(ReviewStatus.Published);
        review.QuarantineByReports(new FixedClock(T0));

        review.RestoreFromReports(new FixedClock(T0.AddHours(1))).ShouldBeTrue();

        review.Status.ShouldBe(ReviewStatus.Published);
        review.UnderReviewReason.ShouldBeNull();
    }

    [Fact]
    public void RestoreFromReports_deja_intacta_la_razon_content_filter_cuando_no_aplica()
    {
        var review = New(ReviewStatus.UnderReview);

        review.RestoreFromReports(new FixedClock(T0.AddHours(1))).ShouldBeFalse();

        review.Status.ShouldBe(ReviewStatus.UnderReview);
        review.UnderReviewReason.ShouldBe(UnderReviewReason.ContentFilter);
    }

    [Fact]
    public void Remove_limpia_la_razon_al_salir_de_under_review()
    {
        var review = New(ReviewStatus.Published);
        review.QuarantineByReports(new FixedClock(T0));

        review.Remove(new FixedClock(T0.AddHours(1))).ShouldBeTrue();

        review.Status.ShouldBe(ReviewStatus.Removed);
        review.UnderReviewReason.ShouldBeNull();
    }

    [Fact]
    public void Remove_desde_published_deja_la_razon_nula()
    {
        var review = New(ReviewStatus.Published);

        review.Remove(new FixedClock(T0.AddHours(1))).ShouldBeTrue();

        review.Status.ShouldBe(ReviewStatus.Removed);
        review.UnderReviewReason.ShouldBeNull();
    }

    /// <summary>
    /// US-055 permite borrar desde <c>UnderReview</c>, no solo desde <c>Published</c>: es otra
    /// salida de <c>UnderReview</c> que tiene que limpiar la razón para no violar el invariante.
    /// </summary>
    [Fact]
    public void Delete_limpia_la_razon_al_salir_de_under_review()
    {
        var review = New(ReviewStatus.Published);
        review.QuarantineByReports(new FixedClock(T0));

        review.Delete(ReviewDeletedReason.Self, new FixedClock(T0.AddHours(1))).ShouldBeTrue();

        review.Status.ShouldBe(ReviewStatus.Deleted);
        review.UnderReviewReason.ShouldBeNull();
    }

    /// <summary>
    /// El callejón sin salida que cierra este cambio: antes, <c>Edit</c> exigía Published a secas,
    /// así que una reseña frenada por el filtro no la podía tocar ni su propio autor (quedaba
    /// shadow-banned para siempre, sin reports que la lleven a la cola de moderación). Ahora la
    /// razón decide: si el filtro la frenó, el autor puede editar y el filtro reevalúa el texto
    /// nuevo, que es la única salida de esa cuarentena.
    /// </summary>
    [Fact]
    public void Edit_esta_permitido_desde_under_review_cuando_la_razon_es_content_filter()
    {
        var review = New(ReviewStatus.UnderReview);
        review.UnderReviewReason.ShouldBe(UnderReviewReason.ContentFilter);

        var result = review.Edit(
            newDifficultyRating: null,
            newOverallRating: null,
            newHoursPerWeek: null,
            hoursPerWeekProvided: false,
            newTags: null,
            newWouldRecommendCourse: null,
            newWouldRetakeTeacher: null,
            newSubjectText: ReviewText.CreateOptional(
                "Reescribo la reseña completa para que el filtro la deje pasar esta vez, sin datos personales.").Value,
            subjectTextProvided: true,
            newTeacherText: null,
            teacherTextProvided: false,
            newFinalGrade: null,
            finalGradeProvided: false,
            statusAfter: ReviewStatus.Published,
            clock: new FixedClock(T0.AddHours(1)));

        result.IsSuccess.ShouldBeTrue();
        review.Status.ShouldBe(ReviewStatus.Published);
        review.UnderReviewReason.ShouldBeNull();
    }

    /// <summary>
    /// Lo deliberado (ADR-0063, anti edit-bombing): mientras la razón sea reports, el autor no
    /// puede editar. Si se permitiera, podría reescribir la reseña para burlar al moderador antes
    /// de que resuelva los reports abiertos.
    /// </summary>
    [Fact]
    public void Edit_sigue_bloqueado_desde_under_review_cuando_la_razon_es_reports()
    {
        var review = New(ReviewStatus.Published);
        review.QuarantineByReports(new FixedClock(T0));

        var result = review.Edit(
            newDifficultyRating: null,
            newOverallRating: null,
            newHoursPerWeek: null,
            hoursPerWeekProvided: false,
            newTags: null,
            newWouldRecommendCourse: null,
            newWouldRetakeTeacher: null,
            newSubjectText: ReviewText.CreateOptional(
                "Intento arreglar el texto mientras hay reportes abiertos sobre esta reseña.").Value,
            subjectTextProvided: true,
            newTeacherText: null,
            teacherTextProvided: false,
            newFinalGrade: null,
            finalGradeProvided: false,
            statusAfter: ReviewStatus.Published,
            clock: new FixedClock(T0.AddHours(1)));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.InvalidStatusTransition);
        review.Status.ShouldBe(ReviewStatus.UnderReview);
        review.UnderReviewReason.ShouldBe(UnderReviewReason.Reports);
    }
}
