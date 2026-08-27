using System.Text.RegularExpressions;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// Aggregate root del ítem del catálogo (US-198, ADR-0082): una pregunta con sus opciones cerradas,
/// que es la unidad de lo que se recolecta y de lo que la ficha publica como conteo (ADR-0083).
///
/// <para>
/// <b>El código es la identidad semántica, no el texto.</b> Afinar la redacción de una pregunta sin
/// cambiar lo que pregunta es un <see cref="Reword"/>: mismo código, misma serie histórica, y las
/// respuestas viejas siguen siendo comparables. Si cambia el SIGNIFICADO, no se edita: se crea un
/// ítem nuevo con código nuevo y el anterior se retira, que es lo que declara la ruptura de la serie.
/// Esa distinción es editorial y la sostiene quien cura el catálogo; el dominio la hace posible
/// separando código de texto, y no puede tomarla por él.
/// </para>
///
/// <para>
/// Las opciones se preguntan en frecuencias gruesas ("Siempre / A veces / Casi nunca"), nunca en
/// conteos finos: la memoria no distingue 3 clases perdidas de 5, y pedir esa precisión produce
/// datos que parecen duros y son ruido.
/// </para>
/// </summary>
public sealed partial class Item : Entity<ItemId>, IAggregateRoot
{
    public const int MaxCodeLength = 60;
    public const int MaxTextLength = 200;
    public const int MaxHelpLength = 500;
    public const int MinOptions = 2;

    /// <summary>
    /// La identidad semántica, estable para siempre: <c>CHAIR_ANSWERS_QUESTIONS</c>. Viaja en el CSV
    /// público y en el Método, y es la clave con la que se compara una serie a través del tiempo.
    /// </summary>
    public string Code { get; private set; } = null!;

    /// <summary>La pregunta como la lee el estudiante. Puede afinarse sin cortar la serie.</summary>
    public string Text { get; private set; } = null!;

    /// <summary>Aclaración opcional debajo de la pregunta, cuando sin ella se entiende otra cosa.</summary>
    public string? Help { get; private set; }

    public ItemLayer Layer { get; private set; }

    /// <summary>A qué ficha aterriza el dato. Metadato invisible: el que responde nunca lo ve.</summary>
    public ItemSubject Subject { get; private set; }

    /// <summary>
    /// Si el ítem sigue ofreciéndose. Retirarlo no borra nada: las respuestas viejas siguen contando
    /// en las fichas de los períodos en que se preguntó.
    /// </summary>
    public bool IsActive { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<ItemOption> _options = [];

    /// <summary>Las opciones, en el orden en que se muestran.</summary>
    public IReadOnlyList<ItemOption> Options => _options;

    private Item() { }

    /// <summary>
    /// Crea un ítem con sus opciones. Arranca activo. Las opciones se validan enteras antes de
    /// crear nada: valores y órdenes únicos, a lo sumo una negativa, y ninguna valencia si el ítem
    /// es de contexto.
    /// </summary>
    public static Result<Item> Create(
        string code,
        string text,
        string? help,
        ItemLayer layer,
        ItemSubject subject,
        IEnumerable<(short Value, short Order, string Label, OptionValence Valence)> options,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(clock);

        var codeResult = ValidateCode(code);
        if (codeResult.IsFailure)
        {
            return codeResult.Error;
        }

        var textResult = ValidateText(text, help);
        if (textResult.IsFailure)
        {
            return textResult.Error;
        }

        var built = BuildOptionSet(options, layer);
        if (built.IsFailure)
        {
            return built.Error;
        }

        var now = clock.UtcNow;
        var item = new Item
        {
            Id = ItemId.New(),
            Code = code.Trim().ToUpperInvariant(),
            Text = text.Trim(),
            Help = TrimToNull(help),
            Layer = layer,
            Subject = subject,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
        item._options.AddRange(built.Value);
        return item;
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado, para el seeder y la carga inicial del catálogo. Valida
    /// las opciones y tira si vienen incoherentes: un ítem con dos negativas se persistiría sin
    /// ruido y rompería la ficha después, cuando ya hay respuestas colgando.
    /// </summary>
    /// <exception cref="ArgumentException">Si las opciones violan los invariantes del aggregate.</exception>
    public static Item Hydrate(
        ItemId id,
        string code,
        string text,
        string? help,
        ItemLayer layer,
        ItemSubject subject,
        IEnumerable<(short Value, short Order, string Label, OptionValence Valence)> options,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var built = BuildOptionSet(options, layer);
        if (built.IsFailure)
        {
            throw new ArgumentException(
                $"Item '{code}' ({id.Value}) has invalid options: {built.Error.Code}.",
                nameof(options));
        }

        var item = new Item
        {
            Id = id,
            Code = code,
            Text = text,
            Help = help,
            Layer = layer,
            Subject = subject,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };
        item._options.AddRange(built.Value);
        return item;
    }

    /// <summary>
    /// Afina la redacción SIN cambiar el significado: misma serie, mismas respuestas comparables.
    /// Que el significado siga siendo el mismo lo decide quien cura, no el dominio: si cambió, el
    /// camino es un ítem nuevo con código nuevo, no este método.
    /// </summary>
    public Result Reword(string text, string? help, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var result = ValidateText(text, help);
        if (result.IsFailure)
        {
            return result.Error;
        }

        Text = text.Trim();
        Help = TrimToNull(help);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Reemplaza el juego de opciones entero, validándolo antes de mutar. Los valores que ya se
    /// respondieron tienen que seguir existiendo con el mismo significado: quien llama pasa en
    /// <paramref name="answeredValues"/> los que la base ya tiene, y el aggregate rechaza el cambio
    /// si alguno desaparece. Editar la etiqueta de un valor existente sí se permite: es la misma
    /// afinación de redacción que <see cref="Reword"/>.
    /// </summary>
    public Result ReplaceOptions(
        IEnumerable<(short Value, short Order, string Label, OptionValence Valence)> options,
        IReadOnlySet<short> answeredValues,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(answeredValues);
        ArgumentNullException.ThrowIfNull(clock);

        var built = BuildOptionSet(options, Layer);
        if (built.IsFailure)
        {
            return built.Error;
        }

        var incoming = built.Value.Select(o => o.Value).ToHashSet();
        if (answeredValues.Any(v => !incoming.Contains(v)))
        {
            return ItemErrors.OptionValueAlreadyUsed;
        }

        _options.Clear();
        _options.AddRange(built.Value);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Deja de ofrecerse. Lo respondido sigue contando donde ya cuenta.</summary>
    public Result Retire(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsActive)
        {
            return ItemErrors.AlreadyRetired;
        }

        IsActive = false;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    public Result Restore(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (IsActive)
        {
            return ItemErrors.AlreadyActive;
        }

        IsActive = true;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Arma el juego de opciones validando sus invariantes, sin mutar nada.</summary>
    private static Result<List<ItemOption>> BuildOptionSet(
        IEnumerable<(short Value, short Order, string Label, OptionValence Valence)> options,
        ItemLayer layer)
    {
        var result = new List<ItemOption>();
        foreach (var (value, order, label, valence) in options)
        {
            if (string.IsNullOrWhiteSpace(label))
            {
                return ItemErrors.OptionLabelRequired;
            }
            if (label.Trim().Length > ItemOption.MaxLabelLength)
            {
                return ItemErrors.OptionLabelTooLong;
            }
            if (result.Any(o => o.Value == value))
            {
                return ItemErrors.DuplicateOptionValue;
            }
            if (result.Any(o => o.Order == order))
            {
                return ItemErrors.DuplicateOptionOrder;
            }
            if (layer == ItemLayer.Context && valence != OptionValence.None)
            {
                return ItemErrors.ContextOptionsCannotHaveValence;
            }
            if (valence == OptionValence.Negative
                && result.Any(o => o.Valence == OptionValence.Negative))
            {
                return ItemErrors.MultipleNegativeOptions;
            }
            result.Add(new ItemOption(value, order, label, valence));
        }

        if (result.Count < MinOptions)
        {
            return ItemErrors.NotEnoughOptions;
        }

        return result.OrderBy(o => o.Order).ToList();
    }

    private static Result ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return ItemErrors.CodeRequired;
        }
        var trimmed = code.Trim();
        if (trimmed.Length > MaxCodeLength)
        {
            return ItemErrors.CodeTooLong;
        }
        if (!CodePattern().IsMatch(trimmed.ToUpperInvariant()))
        {
            return ItemErrors.CodeInvalidFormat;
        }
        return Result.Success();
    }

    private static Result ValidateText(string text, string? help)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return ItemErrors.TextRequired;
        }
        if (text.Trim().Length > MaxTextLength)
        {
            return ItemErrors.TextTooLong;
        }
        if (help is not null && help.Trim().Length > MaxHelpLength)
        {
            return ItemErrors.HelpTooLong;
        }
        return Result.Success();
    }

    private static string? TrimToNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex(@"^[A-Z0-9_]+$")]
    private static partial Regex CodePattern();
}
