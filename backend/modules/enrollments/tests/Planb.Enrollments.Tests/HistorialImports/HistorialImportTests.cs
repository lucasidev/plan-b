using Planb.Enrollments.Domain.HistorialImports;
using Shouldly;
using Xunit;

namespace Planb.Enrollments.Tests.HistorialImports;

/// <summary>
/// Domain unit tests del aggregate <see cref="HistorialImport"/> (US-014). Es una máquina de
/// estados lineal (Pending → Parsing → Parsed → Confirmed, con Failed como salida desde Pending
/// o Parsing). Cubre las transiciones felices y cada guarda de rechazo.
/// </summary>
public class HistorialImportTests
{
    private static readonly Guid StudentProfileId = Guid.NewGuid();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 5, 20, 10, 0, 0, TimeSpan.Zero));

    private static HistorialImportPayload SamplePayload() => new(
        RawText: "MAT101 8 Aprobada",
        Items: [],
        Summary: new HistorialImportSummary(TotalDetected: 0, HighConfidence: 0, MediumConfidence: 0, LowConfidence: 0));

    // ── Create ───────────────────────────────────────────────────────────

    [Fact]
    public void Create_Starts_in_Pending_with_timestamps_from_clock()
    {
        var import = HistorialImport.Create(StudentProfileId, HistorialImportSourceType.Pdf, Clock);

        import.StudentProfileId.ShouldBe(StudentProfileId);
        import.SourceType.ShouldBe(HistorialImportSourceType.Pdf);
        import.Status.ShouldBe(HistorialImportStatus.Pending);
        import.Payload.ShouldBeNull();
        import.Error.ShouldBeNull();
        import.CreatedAt.ShouldBe(Clock.UtcNow);
        import.UpdatedAt.ShouldBe(Clock.UtcNow);
        import.ParsedAt.ShouldBeNull();
        import.ConfirmedAt.ShouldBeNull();
    }

    // ── MarkParsing ──────────────────────────────────────────────────────

    [Fact]
    public void MarkParsing_FromPending_Success()
    {
        var clock = new FixedClock(Clock.UtcNow);
        var import = HistorialImport.Create(StudentProfileId, HistorialImportSourceType.Text, clock);

        clock.Advance(TimeSpan.FromMinutes(1));
        var result = import.MarkParsing(clock);

        result.IsSuccess.ShouldBeTrue();
        import.Status.ShouldBe(HistorialImportStatus.Parsing);
        import.UpdatedAt.ShouldBe(clock.UtcNow);
    }

    [Theory]
    [InlineData(HistorialImportStatus.Parsing)]
    [InlineData(HistorialImportStatus.Parsed)]
    [InlineData(HistorialImportStatus.Failed)]
    [InlineData(HistorialImportStatus.Confirmed)]
    public void MarkParsing_FromNonPending_ReturnsInvalidStateTransition(HistorialImportStatus status)
    {
        var import = ImportInState(status);

        var result = import.MarkParsing(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(HistorialImportErrors.InvalidStateTransition);
    }

    // ── MarkParsed ───────────────────────────────────────────────────────

    [Fact]
    public void MarkParsed_FromParsing_Success()
    {
        var clock = new FixedClock(Clock.UtcNow);
        var import = HistorialImport.Create(StudentProfileId, HistorialImportSourceType.Text, clock);
        import.MarkParsing(clock);
        clock.Advance(TimeSpan.FromMinutes(2));

        var payload = SamplePayload();
        var result = import.MarkParsed(payload, clock);

        result.IsSuccess.ShouldBeTrue();
        import.Status.ShouldBe(HistorialImportStatus.Parsed);
        import.Payload.ShouldBe(payload);
        import.ParsedAt.ShouldBe(clock.UtcNow);
        import.UpdatedAt.ShouldBe(clock.UtcNow);
    }

    [Theory]
    [InlineData(HistorialImportStatus.Pending)]
    [InlineData(HistorialImportStatus.Parsed)]
    [InlineData(HistorialImportStatus.Failed)]
    [InlineData(HistorialImportStatus.Confirmed)]
    public void MarkParsed_FromNonParsing_ReturnsInvalidStateTransition(HistorialImportStatus status)
    {
        var import = ImportInState(status);

        var result = import.MarkParsed(SamplePayload(), Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(HistorialImportErrors.InvalidStateTransition);
    }

    // ── MarkFailed ───────────────────────────────────────────────────────

    [Theory]
    [InlineData(HistorialImportStatus.Pending)]
    [InlineData(HistorialImportStatus.Parsing)]
    [InlineData(HistorialImportStatus.Failed)]
    public void MarkFailed_FromNonTerminalStates_Success(HistorialImportStatus status)
    {
        var clock = new FixedClock(Clock.UtcNow);
        var import = ImportInState(status, clock);
        clock.Advance(TimeSpan.FromMinutes(1));

        var result = import.MarkFailed("boom", clock);

        result.IsSuccess.ShouldBeTrue();
        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error.ShouldBe("boom");
        import.UpdatedAt.ShouldBe(clock.UtcNow);
    }

    [Theory]
    [InlineData(HistorialImportStatus.Parsed)]
    [InlineData(HistorialImportStatus.Confirmed)]
    public void MarkFailed_FromParsedOrConfirmed_ReturnsInvalidStateTransition(HistorialImportStatus status)
    {
        var import = ImportInState(status);

        var result = import.MarkFailed("boom", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(HistorialImportErrors.InvalidStateTransition);
        // El estado y el error previos no se pisan.
        import.Status.ShouldBe(status);
        import.Error.ShouldBeNull();
    }

    // ── MarkConfirmed ────────────────────────────────────────────────────

    [Fact]
    public void MarkConfirmed_FromParsed_Success()
    {
        var clock = new FixedClock(Clock.UtcNow);
        var import = ImportInState(HistorialImportStatus.Parsed, clock);
        clock.Advance(TimeSpan.FromMinutes(3));

        var result = import.MarkConfirmed(clock);

        result.IsSuccess.ShouldBeTrue();
        import.Status.ShouldBe(HistorialImportStatus.Confirmed);
        import.ConfirmedAt.ShouldBe(clock.UtcNow);
        import.UpdatedAt.ShouldBe(clock.UtcNow);
    }

    [Theory]
    [InlineData(HistorialImportStatus.Pending)]
    [InlineData(HistorialImportStatus.Parsing)]
    [InlineData(HistorialImportStatus.Failed)]
    [InlineData(HistorialImportStatus.Confirmed)]
    public void MarkConfirmed_FromNonParsed_ReturnsNotReadyForConfirm(HistorialImportStatus status)
    {
        var import = ImportInState(status);

        var result = import.MarkConfirmed(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(HistorialImportErrors.NotReadyForConfirm);
    }

    // ── Hydrate ──────────────────────────────────────────────────────────

    [Fact]
    public void Hydrate_ReconstructsAllFields_WithoutValidatingTransitions()
    {
        var id = HistorialImportId.New();
        var payload = SamplePayload();

        var import = HistorialImport.Hydrate(
            id,
            StudentProfileId,
            HistorialImportSourceType.Pdf,
            HistorialImportStatus.Confirmed,
            payload,
            error: null,
            createdAt: Clock.UtcNow,
            updatedAt: Clock.UtcNow,
            parsedAt: Clock.UtcNow,
            confirmedAt: Clock.UtcNow);

        import.Id.ShouldBe(id);
        import.StudentProfileId.ShouldBe(StudentProfileId);
        import.SourceType.ShouldBe(HistorialImportSourceType.Pdf);
        import.Status.ShouldBe(HistorialImportStatus.Confirmed);
        import.Payload.ShouldBe(payload);
        import.ParsedAt.ShouldBe(Clock.UtcNow);
        import.ConfirmedAt.ShouldBe(Clock.UtcNow);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    /// <summary>
    /// Construye un import y lo empuja al estado pedido recorriendo las transiciones válidas
    /// (no usa Hydrate, para ejercitar el aggregate real en cada paso previo).
    /// </summary>
    private static HistorialImport ImportInState(HistorialImportStatus status, FixedClock? clock = null)
    {
        clock ??= new FixedClock(Clock.UtcNow);
        var import = HistorialImport.Create(StudentProfileId, HistorialImportSourceType.Text, clock);

        if (status == HistorialImportStatus.Pending)
        {
            return import;
        }

        import.MarkParsing(clock);
        if (status == HistorialImportStatus.Parsing)
        {
            return import;
        }

        if (status == HistorialImportStatus.Failed)
        {
            import.MarkFailed("boom previo", clock);
            return import;
        }

        import.MarkParsed(SamplePayload(), clock);
        if (status == HistorialImportStatus.Parsed)
        {
            return import;
        }

        import.MarkConfirmed(clock);
        return import;
    }
}
