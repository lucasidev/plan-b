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
            termKind: TermKind.FourMonth,
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
        subject.TermKind.ShouldBe(TermKind.FourMonth);
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
            AnyPlan, code!, "Mat", 1, 1, TermKind.FourMonth, 5, 80, null, Clock);

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
            AnyPlan, "MAT101", name!, 1, 1, TermKind.FourMonth, 5, 80, null, Clock);

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
            AnyPlan, "MAT101", "Mat", year, 1, TermKind.FourMonth, 5, 80, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.YearInPlanOutOfRange);
    }

    [Fact]
    public void Create_AnualWithTermInYear_ReturnsInconsistent()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat",
            yearInPlan: 1,
            termInYear: 1, // inconsistente con FullYear
            termKind: TermKind.FullYear,
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
            termKind: TermKind.FullYear,
            weeklyHours: 4, totalHours: 128,
            description: null, clock: Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.TermKind.ShouldBe(TermKind.FullYear);
        result.Value.TermInYear.ShouldBeNull();
    }

    [Theory]
    [InlineData(TermKind.TwoMonth)]
    [InlineData(TermKind.FourMonth)]
    [InlineData(TermKind.SixMonth)]
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
            AnyPlan, "MAT101", "Mat", 1, termInYear, TermKind.FourMonth, 5, 80, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.TermInYearOutOfRange);
    }

    [Fact]
    public void Create_WithoutWeeklyHours_ReturnsSuccess()
    {
        // Proyecto Final de la TUDCS: 0 hs semanales y 350 totales. No tiene carga semanal fija
        // porque no es una cursada con horario, y lo mismo pasa con prácticas profesionales y
        // tesis. Rechazarlo dejaba planes de estudio reales fuera del modelo.
        var result = Subject.Create(
            AnyPlan, "314", "Proyecto Final", 3, 1, TermKind.FourMonth, 0, 350, null, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.WeeklyHours.ShouldBe(0);
        result.Value.TotalHours.ShouldBe(350);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(41)]
    public void Create_WeeklyHoursOutOfRange_ReturnsError(int weeklyHours)
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, 1, TermKind.FourMonth, weeklyHours, 80, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.WeeklyHoursOutOfRange);
    }

    [Fact]
    public void Create_TotalHoursBelowWeekly_ReturnsError()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, 1, TermKind.FourMonth,
            weeklyHours: 6, totalHours: 4, // 4 < 6
            description: null, clock: Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.TotalHoursOutOfRange);
    }

    [Fact]
    public void Create_TotalHoursZero_ReturnsError()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, 1, TermKind.FourMonth,
            weeklyHours: 6, totalHours: 0,
            description: null, clock: Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.TotalHoursOutOfRange);
    }

    [Fact]
    public void Create_DescriptionWhitespace_NormalizedToNull()
    {
        var result = Subject.Create(
            AnyPlan, "MAT101", "Mat", 1, 1, TermKind.FourMonth, 5, 80,
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
            id, AnyPlan, "X", "Y", 99, 99, TermKind.TwoMonth, 99, 99, "raw desc",
            isOfficial: true, isActive: true, Clock.UtcNow, Clock.UtcNow);

        subject.Id.ShouldBe(id);
        subject.YearInPlan.ShouldBe(99);
        subject.TermInYear.ShouldBe(99);
    }
}
