using System.Text.RegularExpressions;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// Aggregate root del instrumento (ADR-0082): una versión del cuestionario, o sea qué ítems se
/// ofrecen y en qué orden. Cada reseña queda atada a la versión con la que se respondió, y sin eso
/// el agregado histórico miente: si el cuestionario cambió, hay que saber a cuál contestó cada uno.
///
/// <para>
/// La vigencia es un tramo: <see cref="ValidUntil"/> en null significa que es la versión que se
/// ofrece hoy. Publicar una versión nueva cierra la anterior, y que no queden dos abiertas del
/// mismo <see cref="Code"/> lo valida el application service, que es el único que ve las dos.
/// </para>
///
/// <para>
/// <b>Ningún ítem es obligatorio</b> (ADR-0082): saltear siempre vale y no cuenta en el denominador.
/// Por eso el instrumento no tiene una marca de requerido: no habría dónde ponerla en verdad. Los
/// ítems condicionales (mostrar uno según lo que se respondió en otro) tampoco existen todavía: el
/// catálogo vigente no los necesita, y se agregan el día que un ítem real lo pida.
/// </para>
/// </summary>
public sealed partial class Instrument : Entity<InstrumentId>, IAggregateRoot
{
    public const int MaxCodeLength = 40;

    /// <summary>Qué cuestionario es: <c>STUDENT_COURSE</c> (la cursada), <c>STUDENT_INSTITUTION</c>.</summary>
    public string Code { get; private set; } = null!;

    public short Version { get; private set; }

    public DateTimeOffset ValidFrom { get; private set; }

    /// <summary>Null mientras es la versión vigente. Se cierra al publicar la siguiente.</summary>
    public DateTimeOffset? ValidUntil { get; private set; }

    /// <summary>Es el cuestionario que se ofrece hoy.</summary>
    public bool IsCurrent => ValidUntil is null;

    private readonly List<InstrumentItem> _items = [];

    /// <summary>Los ítems que ofrece, en el orden en que se preguntan.</summary>
    public IReadOnlyList<InstrumentItem> Items => _items;

    private Instrument() { }

    /// <summary>
    /// Publica una versión del cuestionario, vigente desde ya. Los ítems se validan enteros antes:
    /// sin repetidos, sin órdenes repetidos, y al menos uno.
    /// </summary>
    public static Result<Instrument> Publish(
        string code,
        short version,
        IEnumerable<(ItemId ItemId, short Order)> items,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentNullException.ThrowIfNull(clock);

        var codeResult = ValidateCode(code);
        if (codeResult.IsFailure)
        {
            return codeResult.Error;
        }

        if (version <= 0)
        {
            return InstrumentErrors.VersionNotPositive;
        }

        var built = BuildItemSet(items);
        if (built.IsFailure)
        {
            return built.Error;
        }

        var instrument = new Instrument
        {
            Id = InstrumentId.New(),
            Code = code.Trim().ToUpperInvariant(),
            Version = version,
            ValidFrom = clock.UtcNow,
            ValidUntil = null,
        };
        instrument._items.AddRange(built.Value);
        return instrument;
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado, para el seeder y la carga inicial. Valida los ítems y
    /// tira si vienen incoherentes, por la misma razón que los demás Hydrate del proyecto.
    /// </summary>
    /// <exception cref="ArgumentException">Si los ítems violan los invariantes del aggregate.</exception>
    public static Instrument Hydrate(
        InstrumentId id,
        string code,
        short version,
        IEnumerable<(ItemId ItemId, short Order)> items,
        DateTimeOffset validFrom,
        DateTimeOffset? validUntil)
    {
        var built = BuildItemSet(items);
        if (built.IsFailure)
        {
            throw new ArgumentException(
                $"Instrument '{code}' v{version} ({id.Value}) has invalid items: {built.Error.Code}.",
                nameof(items));
        }

        var instrument = new Instrument
        {
            Id = id,
            Code = code,
            Version = version,
            ValidFrom = validFrom,
            ValidUntil = validUntil,
        };
        instrument._items.AddRange(built.Value);
        return instrument;
    }

    /// <summary>
    /// Cierra la vigencia de esta versión. Lo llama la publicación de la siguiente: las reseñas que
    /// la referencian no se tocan, siguen atadas a ella para siempre.
    /// </summary>
    public Result Close(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsCurrent)
        {
            return InstrumentErrors.AlreadyClosed;
        }

        ValidUntil = clock.UtcNow;
        return Result.Success();
    }

    private static Result<List<InstrumentItem>> BuildItemSet(
        IEnumerable<(ItemId ItemId, short Order)> items)
    {
        var result = new List<InstrumentItem>();
        foreach (var (itemId, order) in items)
        {
            if (result.Any(i => i.ItemId == itemId))
            {
                return InstrumentErrors.DuplicateItem;
            }
            if (result.Any(i => i.Order == order))
            {
                return InstrumentErrors.DuplicateOrder;
            }
            result.Add(new InstrumentItem(itemId, order));
        }

        if (result.Count == 0)
        {
            return InstrumentErrors.NoItems;
        }

        return result.OrderBy(i => i.Order).ToList();
    }

    private static Result ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return InstrumentErrors.CodeRequired;
        }
        var trimmed = code.Trim();
        if (trimmed.Length > MaxCodeLength)
        {
            return InstrumentErrors.CodeTooLong;
        }
        if (!CodePattern().IsMatch(trimmed.ToUpperInvariant()))
        {
            return InstrumentErrors.CodeInvalidFormat;
        }
        return Result.Success();
    }

    [GeneratedRegex(@"^[A-Z0-9_]+$")]
    private static partial Regex CodePattern();
}
