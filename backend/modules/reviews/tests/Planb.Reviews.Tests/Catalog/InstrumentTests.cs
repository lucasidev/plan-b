using Planb.Reviews.Domain.Catalog;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Catalog;

/// <summary>
/// Domain unit tests de <see cref="Instrument"/> (ADR-0082): la versión del cuestionario, con las
/// frases que ofrece y en qué orden. Cubre <see cref="Instrument.Publish"/> y la validación entera
/// del juego de frases, <see cref="Instrument.Close"/> (que cierra la vigencia) y
/// <see cref="Instrument.Hydrate"/>.
/// </summary>
public class InstrumentTests
{
    private static readonly DateTimeOffset T0 = new(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static List<(ItemId ItemId, short Order)> DefaultItems() =>
    [
        (ItemId.New(), 1),
        (ItemId.New(), 2),
    ];

    private static Result<Instrument> Publish(
        string code = "STUDENT_COURSE",
        short version = 1,
        IEnumerable<(ItemId ItemId, short Order)>? items = null,
        IDateTimeProvider? clock = null) =>
        Instrument.Publish(code, version, items ?? DefaultItems(), clock ?? new FixedClock(T0));

    [Fact]
    public void Publish_NormalizesTheCode()
    {
        var result = Publish(code: "  student_course  ");

        result.IsSuccess.ShouldBeTrue();
        result.Value.Code.ShouldBe("STUDENT_COURSE");
    }

    [Fact]
    public void Publish_StartsCurrent()
    {
        var result = Publish();

        result.IsSuccess.ShouldBeTrue();
        result.Value.IsCurrent.ShouldBeTrue();
        result.Value.ValidUntil.ShouldBeNull();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Publish_VersionNotPositive_ReturnsError(int version)
    {
        var result = Publish(version: (short)version);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(InstrumentErrors.VersionNotPositive);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Publish_CodeBlank_ReturnsCodeRequired(string code)
    {
        var result = Publish(code: code);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(InstrumentErrors.CodeRequired);
    }

    [Fact]
    public void Publish_CodeTooLong_ReturnsError()
    {
        var code = new string('A', Instrument.MaxCodeLength + 1);

        var result = Publish(code: code);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(InstrumentErrors.CodeTooLong);
    }

    [Theory]
    [InlineData("STUDENT COURSE")]  // espacio
    [InlineData("ÍTEM_CODE")]       // tilde
    [InlineData("NIÑO_CODE")]       // eñe
    [InlineData("student-course")] // minúscula con símbolo (guion, no permitido)
    public void Publish_CodeInvalidFormat_ReturnsError(string code)
    {
        var result = Publish(code: code);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(InstrumentErrors.CodeInvalidFormat);
    }

    [Fact]
    public void Publish_NoItems_ReturnsError()
    {
        var result = Publish(items: []);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(InstrumentErrors.NoItems);
    }

    [Fact]
    public void Publish_DuplicateItem_ReturnsError()
    {
        var itemId = ItemId.New();
        List<(ItemId ItemId, short Order)> items =
        [
            (itemId, 1),
            (itemId, 2),
        ];

        var result = Publish(items: items);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(InstrumentErrors.DuplicateItem);
    }

    [Fact]
    public void Publish_DuplicateOrder_ReturnsError()
    {
        List<(ItemId ItemId, short Order)> items =
        [
            (ItemId.New(), 1),
            (ItemId.New(), 1),
        ];

        var result = Publish(items: items);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(InstrumentErrors.DuplicateOrder);
    }

    [Fact]
    public void Publish_ItemsOutOfOrder_AreStoredOrderedByOrder()
    {
        var first = ItemId.New();
        var second = ItemId.New();
        List<(ItemId ItemId, short Order)> items =
        [
            (second, 20),
            (first, 10),
        ];

        var result = Publish(items: items);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Items.Select(i => i.ItemId).ShouldBe([first, second]);
    }

    [Fact]
    public void Close_CurrentInstrument_ClosesTheValidity()
    {
        var instrument = Publish().Value;

        var result = instrument.Close(new FixedClock(T0.AddDays(1)));

        result.IsSuccess.ShouldBeTrue();
        instrument.IsCurrent.ShouldBeFalse();
        instrument.ValidUntil.ShouldBe(T0.AddDays(1));
    }

    [Fact]
    public void Close_AlreadyClosedInstrument_ReturnsError()
    {
        var instrument = Publish().Value;
        instrument.Close(new FixedClock(T0.AddDays(1)));

        var result = instrument.Close(new FixedClock(T0.AddDays(2)));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(InstrumentErrors.AlreadyClosed);
        instrument.ValidUntil.ShouldBe(T0.AddDays(1)); // el segundo intento no lo vuelve a cerrar
    }

    [Fact]
    public void Hydrate_NullValidUntil_ReconstitutesAsCurrent()
    {
        var id = InstrumentId.New();

        var instrument = Instrument.Hydrate(
            id,
            "STUDENT_COURSE",
            1,
            DefaultItems(),
            validFrom: T0,
            validUntil: null);

        instrument.Id.ShouldBe(id);
        instrument.Code.ShouldBe("STUDENT_COURSE");
        instrument.ValidFrom.ShouldBe(T0);
        instrument.IsCurrent.ShouldBeTrue();
        instrument.ValidUntil.ShouldBeNull();
    }

    [Fact]
    public void Hydrate_WithValidUntil_ReconstitutesAsClosed()
    {
        var instrument = Instrument.Hydrate(
            InstrumentId.New(),
            "STUDENT_COURSE",
            1,
            DefaultItems(),
            validFrom: T0,
            validUntil: T0.AddDays(30));

        instrument.IsCurrent.ShouldBeFalse();
        instrument.ValidUntil.ShouldBe(T0.AddDays(30));
    }

    [Fact]
    public void Hydrate_DuplicateItems_ThrowsArgumentException()
    {
        var itemId = ItemId.New();
        List<(ItemId ItemId, short Order)> items =
        [
            (itemId, 1),
            (itemId, 2),
        ];

        Should.Throw<ArgumentException>(() =>
            Instrument.Hydrate(
                InstrumentId.New(),
                "STUDENT_COURSE",
                1,
                items,
                validFrom: T0,
                validUntil: null));
    }
}
