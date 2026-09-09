using Planb.Academic.Domain.OfficialFacts;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.OfficialFacts;

public class OfficialFactCurrencyTests
{
    private static readonly Guid SubjectId = Guid.NewGuid();
    private static readonly Guid RelievedBy = Guid.NewGuid();

    private static OfficialFact FactRelievedOn(DateTimeOffset relievedAt, DateTimeOffset createdAt, string sourceName) =>
        OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, OfficialFactField.AdmissionRegime,
            OfficialFactStatus.Published, value: "Ingreso directo", unit: null, period: "2026",
            sourceName, "https://unsta.edu.ar/ingreso", sourceDocument: null,
            sourceRetrievedAt: relievedAt, derivationRuleId: null, note: null,
            relievedAt, RelievedBy, new FixedClock(createdAt)).Value;

    [Fact]
    public void SelectCurrent_TwoFactsSameSubjectAndField_ReturnsTheMostRecentlyRelieved()
    {
        var older = FactRelievedOn(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            "Relevamiento de enero");
        var newer = FactRelievedOn(
            new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
            "Relevamiento de septiembre");

        var current = OfficialFactCurrency.SelectCurrent(new[] { older, newer });

        current.ShouldBe(newer);
        current.SourceName.ShouldBe("Relevamiento de septiembre");
    }

    [Fact]
    public void SelectCurrent_OrderOfCandidatesDoesNotChangeTheWinner()
    {
        var older = FactRelievedOn(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            "Relevamiento de enero");
        var newer = FactRelievedOn(
            new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
            "Relevamiento de septiembre");

        var current = OfficialFactCurrency.SelectCurrent(new[] { newer, older });

        current.ShouldBe(newer);
    }

    [Fact]
    public void SelectCurrent_SameRelievedAt_TieBreaksByCreatedAt()
    {
        var sameRelievedAt = new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);
        var loadedFirst = FactRelievedOn(
            sameRelievedAt, new DateTimeOffset(2026, 9, 1, 8, 0, 0, TimeSpan.Zero), "Cargada primero");
        var loadedSecond = FactRelievedOn(
            sameRelievedAt, new DateTimeOffset(2026, 9, 1, 9, 0, 0, TimeSpan.Zero), "Cargada después");

        var current = OfficialFactCurrency.SelectCurrent(new[] { loadedFirst, loadedSecond });

        current.ShouldBe(loadedSecond);
    }

    [Fact]
    public void SelectCurrent_SingleCandidate_ReturnsIt()
    {
        var only = FactRelievedOn(
            new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
            "Única fuente");

        var current = OfficialFactCurrency.SelectCurrent(new[] { only });

        current.ShouldBe(only);
    }

    [Fact]
    public void SelectCurrent_NoCandidates_Throws()
    {
        Should.Throw<ArgumentException>(() => OfficialFactCurrency.SelectCurrent(Array.Empty<OfficialFact>()));
    }
}
