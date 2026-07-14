using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.Universities;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.CareerPlanImports;

public class CareerPlanImportTests
{
    private static readonly UniversityId AnyUniversity = UniversityId.New();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    private static CareerPlanImport Pending(string careerName = "TUDCS", int planYear = 2024) =>
        CareerPlanImport.Create(
            Guid.NewGuid(), AnyUniversity, careerName, planYear, 2024,
            CareerPlanImportSourceType.Text, Clock).Value;

    private static CareerPlanImport Parsing()
    {
        var import = Pending();
        import.MarkParsing(Clock);
        return import;
    }

    private static CareerPlanImportPayload EmptyPayload() =>
        new("raw", [], new CareerPlanImportSummary(0, 0, 0, 0));

    private static CareerPlanImport Parsed()
    {
        var import = Parsing();
        import.MarkParsed(EmptyPayload(), Clock);
        return import;
    }

    private static CareerPlanImport Failed()
    {
        var import = Parsing();
        import.MarkFailed("boom", Clock);
        return import;
    }

    private static CareerPlanImport Approved()
    {
        var import = Parsed();
        import.MarkApproved(Guid.NewGuid(), Clock);
        return import;
    }

    private static CareerPlanImport InState(CareerPlanImportStatus status) => status switch
    {
        CareerPlanImportStatus.Pending => Pending(),
        CareerPlanImportStatus.Parsing => Parsing(),
        CareerPlanImportStatus.Parsed => Parsed(),
        CareerPlanImportStatus.Failed => Failed(),
        CareerPlanImportStatus.Approved => Approved(),
        _ => throw new ArgumentOutOfRangeException(nameof(status)),
    };

    // ── Create ───────────────────────────────────────────────────────────

    [Fact]
    public void Create_HappyPath_ReturnsPendingImportWithTrimmedCareerName()
    {
        var result = CareerPlanImport.Create(
            Guid.NewGuid(), AnyUniversity, "  TUDCS  ", 2024, 2024,
            CareerPlanImportSourceType.Text, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.CareerName.ShouldBe("TUDCS");
        result.Value.Status.ShouldBe(CareerPlanImportStatus.Pending);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null)]
    public void Create_BlankCareerName_ReturnsCareerNameRequired(string? careerName)
    {
        var result = CareerPlanImport.Create(
            Guid.NewGuid(), AnyUniversity, careerName!, 2024, 2024,
            CareerPlanImportSourceType.Text, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanImportErrors.CareerNameRequired);
    }

    [Theory]
    [InlineData(1989)] // debajo del piso 1990
    [InlineData(2027)] // currentYear (2026) + 1, a futuro
    public void Create_PlanYearOutOfRange_ReturnsPlanYearOutOfRange(int planYear)
    {
        var result = CareerPlanImport.Create(
            Guid.NewGuid(), AnyUniversity, "TUDCS", planYear, 2024,
            CareerPlanImportSourceType.Text, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanImportErrors.PlanYearOutOfRange);
    }

    // ── MarkParsing ──────────────────────────────────────────────────────

    [Fact]
    public void MarkParsing_FromPending_TransitionsToParsing()
    {
        var import = Pending();

        var result = import.MarkParsing(Clock);

        result.IsSuccess.ShouldBeTrue();
        import.Status.ShouldBe(CareerPlanImportStatus.Parsing);
    }

    [Theory]
    [InlineData(CareerPlanImportStatus.Parsing)]
    [InlineData(CareerPlanImportStatus.Parsed)]
    [InlineData(CareerPlanImportStatus.Failed)]
    [InlineData(CareerPlanImportStatus.Approved)]
    public void MarkParsing_FromNonPending_ReturnsInvalidStateTransition(CareerPlanImportStatus from)
    {
        var import = InState(from);

        var result = import.MarkParsing(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanImportErrors.InvalidStateTransition);
    }

    // ── MarkParsed ───────────────────────────────────────────────────────

    [Fact]
    public void MarkParsed_FromParsing_SetsPayloadAndTransitionsToParsed()
    {
        var import = Parsing();
        var payload = EmptyPayload();

        var result = import.MarkParsed(payload, Clock);

        result.IsSuccess.ShouldBeTrue();
        import.Status.ShouldBe(CareerPlanImportStatus.Parsed);
        import.Payload.ShouldBe(payload);
    }

    [Theory]
    [InlineData(CareerPlanImportStatus.Pending)]
    [InlineData(CareerPlanImportStatus.Parsed)]
    [InlineData(CareerPlanImportStatus.Failed)]
    [InlineData(CareerPlanImportStatus.Approved)]
    public void MarkParsed_FromNonParsing_ReturnsInvalidStateTransition(CareerPlanImportStatus from)
    {
        var import = InState(from);

        var result = import.MarkParsed(EmptyPayload(), Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanImportErrors.InvalidStateTransition);
    }

    // ── MarkFailed ───────────────────────────────────────────────────────

    [Theory]
    [InlineData(CareerPlanImportStatus.Parsed)]
    [InlineData(CareerPlanImportStatus.Approved)]
    public void MarkFailed_FromParsedOrApproved_ReturnsInvalidStateTransition(CareerPlanImportStatus from)
    {
        var import = InState(from);

        var result = import.MarkFailed("algo salió mal", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanImportErrors.InvalidStateTransition);
    }

    // ── MarkApproved ─────────────────────────────────────────────────────

    [Fact]
    public void MarkApproved_FromParsed_SetsApprovedCareerPlanIdAndTransitionsToApproved()
    {
        var import = Parsed();
        var careerPlanId = Guid.NewGuid();

        var result = import.MarkApproved(careerPlanId, Clock);

        result.IsSuccess.ShouldBeTrue();
        import.Status.ShouldBe(CareerPlanImportStatus.Approved);
        import.ApprovedCareerPlanId.ShouldBe(careerPlanId);
    }

    [Theory]
    [InlineData(CareerPlanImportStatus.Pending)]
    [InlineData(CareerPlanImportStatus.Parsing)]
    [InlineData(CareerPlanImportStatus.Failed)]
    [InlineData(CareerPlanImportStatus.Approved)]
    public void MarkApproved_FromNonParsed_ReturnsNotReadyForApprove(CareerPlanImportStatus from)
    {
        var import = InState(from);

        var result = import.MarkApproved(Guid.NewGuid(), Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanImportErrors.NotReadyForApprove);
    }
}
