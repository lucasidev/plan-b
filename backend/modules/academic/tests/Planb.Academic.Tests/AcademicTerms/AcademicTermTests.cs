using Planb.Academic.Domain;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Universities;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.AcademicTerms;

public class AcademicTermTests
{
    private static readonly UniversityId AnyUni = UniversityId.New();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    private static readonly DateOnly DefaultStart = new(2026, 3, 1);
    private static readonly DateOnly DefaultEnd = new(2026, 7, 1);
    private static readonly DateTimeOffset DefaultOpen =
        new(2026, 2, 15, 0, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset DefaultClose =
        new(2026, 2, 28, 23, 59, 0, TimeSpan.Zero);

    [Fact]
    public void Create_HappyPath_ReturnsTerm()
    {
        var result = AcademicTerm.Create(
            AnyUni,
            year: 2026,
            number: 1,
            kind: TermKind.Cuatrimestral,
            startDate: DefaultStart,
            endDate: DefaultEnd,
            enrollmentOpens: DefaultOpen,
            enrollmentCloses: DefaultClose,
            label: "  2026·1c  ",
            clock: Clock);

        result.IsSuccess.ShouldBeTrue();
        var term = result.Value;
        term.UniversityId.ShouldBe(AnyUni);
        term.Year.ShouldBe(2026);
        term.Number.ShouldBe(1);
        term.Kind.ShouldBe(TermKind.Cuatrimestral);
        term.Label.ShouldBe("2026·1c");
        term.CreatedAt.ShouldBe(Clock.UtcNow);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(9999)] // > current_year + 20
    public void Create_YearOutOfRange_ReturnsError(int year)
    {
        var result = AcademicTerm.Create(
            AnyUni, year, 1, TermKind.Cuatrimestral,
            DefaultStart, DefaultEnd, DefaultOpen, DefaultClose, "label", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.YearOutOfRange);
    }

    [Fact]
    public void Create_YearOnTheBoundary_Accepted()
    {
        var futureLimit = Clock.UtcNow.Year + 20;

        var result = AcademicTerm.Create(
            AnyUni, futureLimit, 1, TermKind.Cuatrimestral,
            new DateOnly(futureLimit, 3, 1),
            new DateOnly(futureLimit, 7, 1),
            new DateTimeOffset(futureLimit, 2, 15, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(futureLimit, 2, 28, 0, 0, 0, TimeSpan.Zero),
            "label", Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(7)]
    public void Create_NumberOutOfRange_ReturnsError(int number)
    {
        var result = AcademicTerm.Create(
            AnyUni, 2026, number, TermKind.Cuatrimestral,
            DefaultStart, DefaultEnd, DefaultOpen, DefaultClose, "label", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.NumberOutOfRange);
    }

    [Fact]
    public void Create_AnualWithNumberOtherThan1_ReturnsError()
    {
        var result = AcademicTerm.Create(
            AnyUni, 2026, number: 2, kind: TermKind.Anual,
            new DateOnly(2026, 3, 1),
            new DateOnly(2026, 12, 1),
            DefaultOpen, DefaultClose, "2026", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.NumberInconsistentWithKind);
    }

    [Fact]
    public void Create_AnualWithNumber1_ReturnsSuccess()
    {
        var result = AcademicTerm.Create(
            AnyUni, 2026, number: 1, kind: TermKind.Anual,
            new DateOnly(2026, 3, 1),
            new DateOnly(2026, 12, 1),
            DefaultOpen, DefaultClose, "2026", Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Kind.ShouldBe(TermKind.Anual);
        result.Value.Number.ShouldBe(1);
    }

    [Fact]
    public void Create_EndDateBeforeStart_ReturnsError()
    {
        var result = AcademicTerm.Create(
            AnyUni, 2026, 1, TermKind.Cuatrimestral,
            startDate: new DateOnly(2026, 7, 1),
            endDate: new DateOnly(2026, 3, 1), // invertida
            enrollmentOpens: DefaultOpen,
            enrollmentCloses: DefaultClose,
            "label", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.DatesInverted);
    }

    [Fact]
    public void Create_EndDateEqualStart_ReturnsError()
    {
        var result = AcademicTerm.Create(
            AnyUni, 2026, 1, TermKind.Cuatrimestral,
            startDate: DefaultStart,
            endDate: DefaultStart, // igual
            DefaultOpen, DefaultClose, "label", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.DatesInverted);
    }

    [Fact]
    public void Create_EnrollmentWindowInverted_ReturnsError()
    {
        var result = AcademicTerm.Create(
            AnyUni, 2026, 1, TermKind.Cuatrimestral,
            DefaultStart, DefaultEnd,
            enrollmentOpens: new DateTimeOffset(2026, 3, 1, 0, 0, 0, TimeSpan.Zero),
            enrollmentCloses: new DateTimeOffset(2026, 2, 15, 0, 0, 0, TimeSpan.Zero),
            "label", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.EnrollmentWindowInverted);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null)]
    public void Create_BlankLabel_ReturnsError(string? label)
    {
        var result = AcademicTerm.Create(
            AnyUni, 2026, 1, TermKind.Cuatrimestral,
            DefaultStart, DefaultEnd, DefaultOpen, DefaultClose, label!, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.LabelRequired);
    }

    [Fact]
    public void Hydrate_RestoresWithoutValidation()
    {
        var id = AcademicTermId.New();
        var term = AcademicTerm.Hydrate(
            id, AnyUni, 1900, 9, TermKind.Bimestral,
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 1, 1), // dates iguales: Create rechazaría
            DefaultOpen, DefaultClose, "raw", Clock.UtcNow);

        term.Id.ShouldBe(id);
        term.Year.ShouldBe(1900);
        term.Number.ShouldBe(9);
    }
}
