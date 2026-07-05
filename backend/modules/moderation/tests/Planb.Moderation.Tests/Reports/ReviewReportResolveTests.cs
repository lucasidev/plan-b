using Planb.Moderation.Domain.Reports;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.Moderation.Tests.Reports;

/// <summary>
/// Domain unit tests de <see cref="ReviewReport.Uphold"/> / <see cref="ReviewReport.Dismiss"/> (US-051).
/// El cascade y la remoción/restauración de la reseña viven en el handler + el consumer cross-BC; acá
/// se cubren las transiciones del aggregate del report y su idempotencia.
/// </summary>
public class ReviewReportResolveTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 5, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid Moderator = Guid.NewGuid();

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static ReviewReport OpenReport() =>
        ReviewReport.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            ReviewReportReason.Spam,
            null,
            new FixedClock(T0)).Value;

    [Fact]
    public void Uphold_marks_the_report_upheld_with_moderator_note_and_timestamp()
    {
        var report = OpenReport();
        var resolvedAt = T0.AddHours(2);

        var result = report.Uphold(Moderator, "  viola la política  ", new FixedClock(resolvedAt));

        result.IsSuccess.ShouldBeTrue();
        report.Status.ShouldBe(ReviewReportStatus.Upheld);
        report.ModeratorUserId.ShouldBe(Moderator);
        report.ResolutionNote.ShouldBe("viola la política"); // trimmeado
        report.ResolvedAt.ShouldBe(resolvedAt);
    }

    [Fact]
    public void Dismiss_marks_the_report_dismissed_with_empty_note_as_null()
    {
        var report = OpenReport();

        report.Dismiss(Moderator, "   ", new FixedClock(T0)).IsSuccess.ShouldBeTrue();

        report.Status.ShouldBe(ReviewReportStatus.Dismissed);
        report.ResolutionNote.ShouldBeNull();
        report.ModeratorUserId.ShouldBe(Moderator);
    }

    [Fact]
    public void Resolving_an_already_resolved_report_returns_already_resolved()
    {
        var report = OpenReport();
        report.Uphold(Moderator, null, new FixedClock(T0));

        var second = report.Dismiss(Moderator, null, new FixedClock(T0.AddHours(1)));

        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(ReviewReportErrors.AlreadyResolved);
        report.Status.ShouldBe(ReviewReportStatus.Upheld); // no cambió
    }

    [Fact]
    public void Resolution_note_over_the_limit_is_rejected_and_report_stays_open()
    {
        var report = OpenReport();
        var tooLong = new string('x', ReviewReport.MaxResolutionNoteLength + 1);

        var result = report.Uphold(Moderator, tooLong, new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewReportErrors.ResolutionNoteTooLong);
        report.Status.ShouldBe(ReviewReportStatus.Open);
    }
}
