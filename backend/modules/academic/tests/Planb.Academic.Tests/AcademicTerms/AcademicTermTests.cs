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

    // ------------------------------------------------------------------
    // ComputeLabel (US-064, admin): un formato por cadencia.
    // ------------------------------------------------------------------

    [Theory]
    [InlineData(TermKind.Anual, 1, "2026")]
    [InlineData(TermKind.Cuatrimestral, 1, "2026-C1")]
    [InlineData(TermKind.Cuatrimestral, 2, "2026-C2")]
    [InlineData(TermKind.Semestral, 1, "2026-S1")]
    [InlineData(TermKind.Bimestral, 3, "2026-B3")]
    public void ComputeLabel_PerKind_ReturnsExpectedFormat(TermKind kind, int number, string expected)
    {
        var label = AcademicTerm.ComputeLabel(2026, number, kind);

        label.ShouldBe(expected);
    }

    // ------------------------------------------------------------------
    // Update (US-064, admin): mismas reglas que Create, re-normaliza label.
    // ------------------------------------------------------------------

    [Fact]
    public void Update_HappyPath_ReplacesFieldsAndKeepsIdentity()
    {
        var term = AcademicTerm.Create(
            AnyUni, 2026, 1, TermKind.Cuatrimestral,
            DefaultStart, DefaultEnd, DefaultOpen, DefaultClose, "2026-C1", Clock).Value;
        var originalId = term.Id;

        var newStart = new DateOnly(2026, 8, 3);
        var newEnd = new DateOnly(2026, 11, 28);
        var newOpen = new DateTimeOffset(2026, 7, 10, 0, 0, 0, TimeSpan.Zero);
        var newClose = new DateTimeOffset(2026, 7, 25, 23, 59, 0, TimeSpan.Zero);

        var result = term.Update(
            2026, 2, TermKind.Cuatrimestral, newStart, newEnd, newOpen, newClose, "2026-C2", Clock);

        result.IsSuccess.ShouldBeTrue();
        term.Id.ShouldBe(originalId);
        term.UniversityId.ShouldBe(AnyUni); // Update no cambia de universidad
        term.Number.ShouldBe(2);
        term.Label.ShouldBe("2026-C2");
        term.StartDate.ShouldBe(newStart);
        term.EndDate.ShouldBe(newEnd);
        term.EnrollmentOpens.ShouldBe(newOpen);
        term.EnrollmentCloses.ShouldBe(newClose);
    }

    [Fact]
    public void Update_EndDateBeforeStart_ReturnsErrorAndLeavesTermUnchanged()
    {
        var term = AcademicTerm.Create(
            AnyUni, 2026, 1, TermKind.Cuatrimestral,
            DefaultStart, DefaultEnd, DefaultOpen, DefaultClose, "2026-C1", Clock).Value;

        var result = term.Update(
            2026, 1, TermKind.Cuatrimestral,
            startDate: new DateOnly(2026, 7, 1),
            endDate: new DateOnly(2026, 3, 1), // invertida
            DefaultOpen, DefaultClose, "2026-C1", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.DatesInverted);
        term.StartDate.ShouldBe(DefaultStart); // no se tocó el aggregate
    }

    [Fact]
    public void Update_AnualWithNumberOtherThan1_ReturnsError()
    {
        var term = AcademicTerm.Create(
            AnyUni, 2026, 1, TermKind.Cuatrimestral,
            DefaultStart, DefaultEnd, DefaultOpen, DefaultClose, "2026-C1", Clock).Value;

        var result = term.Update(
            2026, 2, TermKind.Anual,
            new DateOnly(2026, 3, 1), new DateOnly(2026, 12, 1),
            DefaultOpen, DefaultClose, "2026", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicTermErrors.NumberInconsistentWithKind);
    }
}
