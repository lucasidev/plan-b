using Planb.Reviews.Domain.Catalog;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Catalog;

/// <summary>
/// Domain unit tests de <see cref="Item"/> (US-198, ADR-0082, ADR-0083): la pregunta con sus
/// opciones cerradas. Cubre <see cref="Item.Create"/> y la validación entera del juego de
/// opciones, <see cref="Item.Reword"/> (que no corta la serie porque no toca el código),
/// <see cref="Item.ReplaceOptions"/> (que no deja huérfana una respuesta vieja),
/// <see cref="Item.Retire"/> / <see cref="Item.Restore"/> y <see cref="Item.Hydrate"/>.
/// </summary>
public class ItemTests
{
    private static readonly DateTimeOffset T0 = new(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static List<(short Value, short Order, string Label, OptionValence Valence)> DefaultOptions() =>
    [
        (1, 1, "Siempre", OptionValence.Positive),
        (2, 2, "Casi nunca", OptionValence.Negative),
    ];

    private static Result<Item> Create(
        string code = "CHAIR_ANSWERS_QUESTIONS",
        string text = "¿El profesor responde las consultas?",
        string? help = null,
        ItemLayer layer = ItemLayer.ChairConduct,
        ItemSubject subject = ItemSubject.Chair,
        IEnumerable<(short Value, short Order, string Label, OptionValence Valence)>? options = null,
        IDateTimeProvider? clock = null) =>
        Item.Create(code, text, help, layer, subject, options ?? DefaultOptions(), clock ?? new FixedClock(T0));

    [Fact]
    public void Create_NormalizesCodeToUppercase_AndTrimsText()
    {
        var result = Create(code: "  chair_answers_questions  ", text: "  ¿Responde las consultas?  ");

        result.IsSuccess.ShouldBeTrue();
        result.Value.Code.ShouldBe("CHAIR_ANSWERS_QUESTIONS");
        result.Value.Text.ShouldBe("¿Responde las consultas?");
    }

    [Fact]
    public void Create_StartsActive()
    {
        var result = Create();

        result.IsSuccess.ShouldBeTrue();
        result.Value.IsActive.ShouldBeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_CodeBlank_ReturnsCodeRequired(string code)
    {
        var result = Create(code: code);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.CodeRequired);
    }

    [Fact]
    public void Create_CodeTooLong_ReturnsError()
    {
        var code = new string('A', Item.MaxCodeLength + 1);

        var result = Create(code: code);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.CodeTooLong);
    }

    [Theory]
    [InlineData("CHAIR ANSWERS")]  // espacio
    [InlineData("ÍTEM_CODE")]      // tilde
    [InlineData("NIÑO_CODE")]      // eñe
    [InlineData("chair-answers")]  // minúscula con símbolo (guion, no permitido)
    public void Create_CodeInvalidFormat_ReturnsError(string code)
    {
        var result = Create(code: code);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.CodeInvalidFormat);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_TextBlank_ReturnsTextRequired(string text)
    {
        var result = Create(text: text);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.TextRequired);
    }

    [Fact]
    public void Create_TextTooLong_ReturnsError()
    {
        var text = new string('A', Item.MaxTextLength + 1);

        var result = Create(text: text);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.TextTooLong);
    }

    [Fact]
    public void Create_HelpTooLong_ReturnsError()
    {
        var help = new string('A', Item.MaxHelpLength + 1);

        var result = Create(help: help);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.HelpTooLong);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    public void Create_FewerThanTwoOptions_ReturnsNotEnoughOptions(int count)
    {
        var options = Enumerable.Range(1, count)
            .Select(i => ((short)i, (short)i, $"Opción {i}", OptionValence.None));

        var result = Create(options: options);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.NotEnoughOptions);
    }

    [Fact]
    public void Create_DuplicateOptionValue_ReturnsError()
    {
        List<(short Value, short Order, string Label, OptionValence Valence)> options =
        [
            (1, 1, "Siempre", OptionValence.Positive),
            (1, 2, "Nunca", OptionValence.Negative),
        ];

        var result = Create(options: options);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.DuplicateOptionValue);
    }

    [Fact]
    public void Create_DuplicateOptionOrder_ReturnsError()
    {
        List<(short Value, short Order, string Label, OptionValence Valence)> options =
        [
            (1, 1, "Siempre", OptionValence.Positive),
            (2, 1, "Nunca", OptionValence.Negative),
        ];

        var result = Create(options: options);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.DuplicateOptionOrder);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_OptionLabelBlank_ReturnsOptionLabelRequired(string label)
    {
        List<(short Value, short Order, string Label, OptionValence Valence)> options =
        [
            (1, 1, label, OptionValence.None),
            (2, 2, "Otra", OptionValence.None),
        ];

        var result = Create(options: options);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.OptionLabelRequired);
    }

    [Fact]
    public void Create_OptionLabelTooLong_ReturnsError()
    {
        var longLabel = new string('A', ItemOption.MaxLabelLength + 1);
        List<(short Value, short Order, string Label, OptionValence Valence)> options =
        [
            (1, 1, longLabel, OptionValence.None),
            (2, 2, "Otra", OptionValence.None),
        ];

        var result = Create(options: options);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.OptionLabelTooLong);
    }

    [Fact]
    public void Create_TwoNegativeOptions_ReturnsMultipleNegativeOptions()
    {
        List<(short Value, short Order, string Label, OptionValence Valence)> options =
        [
            (1, 1, "Nunca", OptionValence.Negative),
            (2, 2, "Jamás", OptionValence.Negative),
        ];

        var result = Create(options: options);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.MultipleNegativeOptions);
    }

    [Fact]
    public void Create_ContextItemWithValencedOption_ReturnsError()
    {
        List<(short Value, short Order, string Label, OptionValence Valence)> options =
        [
            (1, 1, "Diurno", OptionValence.Positive),
            (2, 2, "Nocturno", OptionValence.None),
        ];

        var result = Create(layer: ItemLayer.Context, options: options);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.ContextOptionsCannotHaveValence);
    }

    [Fact]
    public void Create_OptionsOutOfOrder_AreStoredOrderedByOrder()
    {
        List<(short Value, short Order, string Label, OptionValence Valence)> options =
        [
            (2, 20, "Segunda", OptionValence.None),
            (1, 10, "Primera", OptionValence.None),
        ];

        var result = Create(options: options);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Options.Select(o => o.Label).ShouldBe(["Primera", "Segunda"]);
    }

    [Fact]
    public void Reword_ChangesTextAndHelp_ButKeepsTheCode()
    {
        var item = Create(help: "Aclaración vieja").Value;

        var result = item.Reword("¿Responde dudas en clase?", "Aclaración nueva", new FixedClock(T0.AddDays(1)));

        result.IsSuccess.ShouldBeTrue();
        item.Text.ShouldBe("¿Responde dudas en clase?");
        item.Help.ShouldBe("Aclaración nueva");
        item.UpdatedAt.ShouldBe(T0.AddDays(1));
        item.Code.ShouldBe("CHAIR_ANSWERS_QUESTIONS"); // el punto: la serie histórica no se corta
    }

    [Fact]
    public void ReplaceOptions_ValidNewSet_ReplacesTheOptions()
    {
        var item = Create().Value;
        List<(short Value, short Order, string Label, OptionValence Valence)> newOptions =
        [
            (10, 1, "Sí", OptionValence.Positive),
            (20, 2, "No", OptionValence.Negative),
        ];

        var result = item.ReplaceOptions(newOptions, new HashSet<short>(), new FixedClock(T0.AddDays(1)));

        result.IsSuccess.ShouldBeTrue();
        item.Options.Select(o => o.Label).ShouldBe(["Sí", "No"]);
    }

    [Fact]
    public void ReplaceOptions_DropsAnAnsweredValue_ReturnsOptionValueAlreadyUsed()
    {
        var item = Create().Value; // opciones por defecto: valores 1 y 2
        var answeredValues = new HashSet<short> { 1 };
        List<(short Value, short Order, string Label, OptionValence Valence)> newOptions =
        [
            (3, 1, "Nueva A", OptionValence.Positive),
            (4, 2, "Nueva B", OptionValence.Negative),
        ];

        var result = item.ReplaceOptions(newOptions, answeredValues, new FixedClock(T0.AddDays(1)));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.OptionValueAlreadyUsed);
    }

    [Fact]
    public void ReplaceOptions_KeepsAnAnsweredValue_ButChangesItsLabel_Succeeds()
    {
        var item = Create().Value; // el valor 1 tiene la etiqueta "Siempre"
        var answeredValues = new HashSet<short> { 1 };
        List<(short Value, short Order, string Label, OptionValence Valence)> newOptions =
        [
            (1, 1, "Etiqueta nueva", OptionValence.Positive),
            (2, 2, "Casi nunca", OptionValence.Negative),
        ];

        var result = item.ReplaceOptions(newOptions, answeredValues, new FixedClock(T0.AddDays(1)));

        result.IsSuccess.ShouldBeTrue();
        item.Options.Single(o => o.Value == 1).Label.ShouldBe("Etiqueta nueva");
    }

    /// <summary>
    /// La validación del juego nuevo corre entera antes de tocar el estado: un juego inválido no
    /// puede dejar el aggregate a mitad de camino, ni con las opciones viejas borradas.
    /// </summary>
    [Fact]
    public void ReplaceOptions_InvalidNewSet_LeavesTheOldOptionsIntact()
    {
        var item = Create().Value; // opciones por defecto: "Siempre" / "Casi nunca"
        List<(short Value, short Order, string Label, OptionValence Valence)> invalidOptions =
        [
            (1, 1, "Sola", OptionValence.None), // una sola opción: NotEnoughOptions
        ];

        var result = item.ReplaceOptions(invalidOptions, new HashSet<short>(), new FixedClock(T0.AddDays(1)));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ItemErrors.NotEnoughOptions);
        item.Options.Select(o => o.Label).ShouldBe(["Siempre", "Casi nunca"]);
        item.UpdatedAt.ShouldBe(T0); // tampoco se tocó: la validación corrió antes de mutar
    }

    [Fact]
    public void Retire_ActiveItem_SetsInactive_AndMovesUpdatedAt()
    {
        var item = Create().Value;

        var result = item.Retire(new FixedClock(T0.AddDays(1)));

        result.IsSuccess.ShouldBeTrue();
        item.IsActive.ShouldBeFalse();
        item.UpdatedAt.ShouldBe(T0.AddDays(1));
    }

    [Fact]
    public void Retire_AlreadyRetiredItem_ReturnsError()
    {
        var item = Create().Value;
        item.Retire(new FixedClock(T0.AddDays(1)));

        var result = item.Retire(new FixedClock(T0.AddDays(2)));

        result.IsFailure.ShouldBeTrue();
        result.Error.Type.ShouldBe(ErrorType.Conflict);
        result.Error.Code.ShouldBe("reviews.item.already_retired");
        item.UpdatedAt.ShouldBe(T0.AddDays(1)); // el segundo intento no vuelve a mover la fecha
    }

    [Fact]
    public void Restore_RetiredItem_SetsActive_AndMovesUpdatedAt()
    {
        var item = Create().Value;
        item.Retire(new FixedClock(T0.AddDays(1)));

        var result = item.Restore(new FixedClock(T0.AddDays(2)));

        result.IsSuccess.ShouldBeTrue();
        item.IsActive.ShouldBeTrue();
        item.UpdatedAt.ShouldBe(T0.AddDays(2));
    }

    [Fact]
    public void Restore_AlreadyActiveItem_ReturnsError()
    {
        var item = Create().Value; // arranca activo

        var result = item.Restore(new FixedClock(T0.AddDays(1)));

        result.IsFailure.ShouldBeTrue();
        result.Error.Type.ShouldBe(ErrorType.Conflict);
        result.Error.Code.ShouldBe("reviews.item.already_active");
        item.UpdatedAt.ShouldBe(T0); // no se tocó
    }

    [Fact]
    public void Hydrate_ReconstitutesAllFields()
    {
        var id = ItemId.New();

        var item = Item.Hydrate(
            id,
            "CHAIR_ANSWERS_QUESTIONS",
            "¿El profesor responde las consultas?",
            "Aclaración",
            ItemLayer.ChairConduct,
            ItemSubject.Chair,
            DefaultOptions(),
            isActive: false,
            createdAt: T0,
            updatedAt: T0.AddDays(1));

        item.Id.ShouldBe(id);
        item.Code.ShouldBe("CHAIR_ANSWERS_QUESTIONS");
        item.Text.ShouldBe("¿El profesor responde las consultas?");
        item.Help.ShouldBe("Aclaración");
        item.Layer.ShouldBe(ItemLayer.ChairConduct);
        item.Subject.ShouldBe(ItemSubject.Chair);
        item.IsActive.ShouldBeFalse();
        item.CreatedAt.ShouldBe(T0);
        item.UpdatedAt.ShouldBe(T0.AddDays(1));
        item.Options.Select(o => o.Label).ShouldBe(["Siempre", "Casi nunca"]);
    }

    [Fact]
    public void Hydrate_TwoNegativeOptions_ThrowsArgumentException()
    {
        List<(short Value, short Order, string Label, OptionValence Valence)> options =
        [
            (1, 1, "Nunca", OptionValence.Negative),
            (2, 2, "Jamás", OptionValence.Negative),
        ];

        Should.Throw<ArgumentException>(() =>
            Item.Hydrate(
                ItemId.New(),
                "CHAIR_ANSWERS_QUESTIONS",
                "¿El profesor responde las consultas?",
                null,
                ItemLayer.ChairConduct,
                ItemSubject.Chair,
                options,
                isActive: true,
                createdAt: T0,
                updatedAt: T0));
    }
}
