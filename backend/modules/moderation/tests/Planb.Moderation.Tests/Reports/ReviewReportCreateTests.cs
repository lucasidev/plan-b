using Planb.Moderation.Domain.Reports;
using Shouldly;
using Xunit;

namespace Planb.Moderation.Tests.Reports;

/// <summary>
/// Domain unit tests de <see cref="ReviewReport.Create"/> (US-019): el trim de <c>details</c> y el
/// invariante <see cref="ReviewReport.MaxDetailsLength"/>. Las validaciones cross-BC (reseña existe,
/// reporter != author, duplicado) las hace el handler antes de llamar acá; ver
/// <see cref="ReviewReportResolveTests"/> para las transiciones de Uphold/Dismiss.
/// </summary>
public class ReviewReportCreateTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 13, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Create_trims_surrounding_whitespace_from_details()
    {
        var result = ReviewReport.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            ReviewReportReason.Spam,
            "  copia textual de otra reseña  ",
            new FixedClock(T0));

        result.IsSuccess.ShouldBeTrue();
        result.Value.Details.ShouldBe("copia textual de otra reseña");
    }

    [Fact]
    public void Create_treats_whitespace_only_details_as_null()
    {
        var result = ReviewReport.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            ReviewReportReason.Spam,
            "   ",
            new FixedClock(T0));

        result.IsSuccess.ShouldBeTrue();
        result.Value.Details.ShouldBeNull();
    }

    [Fact]
    public void Create_rejects_details_over_the_max_length()
    {
        var tooLong = new string('x', ReviewReport.MaxDetailsLength + 1);

        var result = ReviewReport.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            ReviewReportReason.Spam,
            tooLong,
            new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewReportErrors.DetailsTooLong);
    }

    [Fact]
    public void Create_trims_before_checking_the_length_invariant_so_padding_does_not_count()
    {
        var atLimitAfterTrim = new string('x', ReviewReport.MaxDetailsLength);
        var padded = "  " + atLimitAfterTrim + "  ";

        var result = ReviewReport.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            ReviewReportReason.Spam,
            padded,
            new FixedClock(T0));

        result.IsSuccess.ShouldBeTrue();
        result.Value.Details.ShouldBe(atLimitAfterTrim);
    }
}
