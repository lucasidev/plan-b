using Planb.Academic.Domain;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Subjects;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Subjects;

public class SubjectTests
{
    private static readonly CareerPlanId AnyPlan = CareerPlanId.New();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    [Fact]
    public void Create_HappyPath_ReturnsSubjectWithTrimmedFields()
    {
        var result = Subject.Create(
            AnyPlan,
            code: "  MAT101  ",
            name: "  Análisis Matemático I  ",
            yearInPlan: 1,
            termInYear: 1,
            termKind: TermKind.Cuatrimestral,
            weeklyHours: 6,
            totalHours: 96,
            description: null,
            clock: Clock);

        result.IsSuccess.ShouldBeTrue();
        var subject = result.Value;
        subject.Code.ShouldBe("MAT101");
        subject.Name.ShouldBe("Análisis Matemático I");
        subject.YearInPlan.ShouldBe(1);
        subject.TermInYear.ShouldBe(1);
        subject.TermKind.ShouldBe(TermKind.Cuatrimestral);
        subject.WeeklyHours.ShouldBe(6);
        subject.TotalHours.ShouldBe(96);
        subject.Description.ShouldBeNull();
        subject.CreatedAt.ShouldBe(Clock.UtcNow);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null)]
    public void Create_BlankCode_ReturnsCodeRequired(string? code)
    {
        var result = Subject.Create(
            AnyPlan, code!, "Mat", 1, 1, TermKind.Cuatrimestral, 5, 80, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.CodeRequired);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null)]
    public void Create_BlankName_ReturnsNameRequired(string? name)
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", name!, 1, 1, TermKind.Cuatrimestral, 5, 80, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.NameRequired);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(11)]
    [InlineData(99)]
    public void Create_YearInPlanOutOfBounds_ReturnsError(int year)
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", year, 1, TermKind.Cuatrimestral, 5, 80, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.YearInPlanOutOfRange);
    }

    [Fact]
    public void Create_AnualWithTermInYear_ReturnsInconsistent()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat",
            yearInPlan: 1,
            termInYear: 1, // inconsistente con Anual
            termKind: TermKind.Anual,
            weeklyHours: 4, totalHours: 128,
            description: null, clock: Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.TermInYearInconsistentWithKind);
    }

    [Fact]
    public void Create_AnualWithNullTermInYear_ReturnsSuccess()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat",
            yearInPlan: 1,
            termInYear: null,
            termKind: TermKind.Anual,
            weeklyHours: 4, totalHours: 128,
            description: null, clock: Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.TermKind.ShouldBe(TermKind.Anual);
        result.Value.TermInYear.ShouldBeNull();
    }

    [Theory]
    [InlineData(TermKind.Bimestral)]
    [InlineData(TermKind.Cuatrimestral)]
    [InlineData(TermKind.Semestral)]
    public void Create_NonAnualWithoutTermInYear_ReturnsInconsistent(TermKind kind)
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat",
            yearInPlan: 1,
            termInYear: null,
            termKind: kind,
            weeklyHours: 4, totalHours: 64,
            description: null, clock: Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.TermInYearInconsistentWithKind);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(7)]
    public void Create_TermInYearOutOfRange_ReturnsError(int termInYear)
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, termInYear, TermKind.Cuatrimestral, 5, 80, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.TermInYearOutOfRange);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(41)]
    public void Create_WeeklyHoursOutOfRange_ReturnsError(int weeklyHours)
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, 1, TermKind.Cuatrimestral, weeklyHours, 80, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.WeeklyHoursOutOfRange);
    }

    [Fact]
    public void Create_TotalHoursBelowWeekly_ReturnsError()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, 1, TermKind.Cuatrimestral,
            weeklyHours: 6, totalHours: 4, // 4 < 6
            description: null, clock: Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.TotalHoursOutOfRange);
    }

    [Fact]
    public void Create_TotalHoursZero_ReturnsError()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, 1, TermKind.Cuatrimestral,
            weeklyHours: 6, totalHours: 0,
            description: null, clock: Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.TotalHoursOutOfRange);
    }

    [Fact]
    public void Create_DescriptionWhitespace_NormalizedToNull()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, 1, TermKind.Cuatrimestral, 5, 80,
            description: "   ",
            clock: Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Description.ShouldBeNull();
    }

    [Fact]
    public void Hydrate_RestoresFieldsWithoutValidation()
    {
        var id = SubjectId.New();
        // Datos que Create rechazaría (yearInPlan=99) pero Hydrate acepta porque asume caller
        // confiable (seeder o EF rehydration).
        var subject = Subject.Hydrate(
            id, AnyPlan, "X", "Y", 99, 99, TermKind.Bimestral, 99, 99, "raw desc",
            Clock.UtcNow);

        subject.Id.ShouldBe(id);
        subject.YearInPlan.ShouldBe(99);
        subject.TermInYear.ShouldBe(99);
    }
}
