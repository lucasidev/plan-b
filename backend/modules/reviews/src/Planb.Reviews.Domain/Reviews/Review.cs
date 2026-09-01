using Planb.Reviews.Domain.Catalog;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Aggregate root de la reseña de una cursada (US-146, ADR-0082): una voz de una persona sobre una
/// materia en un período, con lo que respondió del cuestionario vigente.
///
/// <para>
/// <b>Es la unidad de todo lo que el producto publica.</b> Una cuenta, una materia y un período: por
/// eso una persona no puede pesar como muchas en el mismo dato (ADR-0082). Reseñar de nuevo la
/// misma cursada es editar esta.
/// </para>
///
/// <para>
/// <b>Nunca se muestra una reseña individual.</b> La ficha publica conteos agregados por ítem y
/// opción; esta entidad existe para alimentarlos y para que su autor pueda editarla o borrarla.
/// Lo que se guarda acá y no se publica jamás: el contexto dato por dato (cómo terminó, cuántas
/// veces la cursó) y el <see cref="FreeText"/>.
/// </para>
///
/// <para>
/// <b>Es una entidad nueva, no una versión de <c>Review</c>.</b> La reseña anterior (ratings 1 a 5,
/// texto libre publicado, docente reseñado) pertenece al producto en retiro (ADR-0063) y se poda
/// como tarea propia. Nacer aparte evita el período en que una misma clase es mitad un modelo y
/// mitad el otro.
/// </para>
/// </summary>
public sealed class Review : Entity<ReviewId>, IAggregateRoot
{
    public const int MaxFreeTextLength = 2000;

    /// <summary>Quién la escribió. Nunca se publica: es lo que permite editarla y borrarla.</summary>
    public Guid AccountId { get; private set; }

    public Guid SubjectId { get; private set; }

    /// <summary>El período en que cursó, no cuándo reseñó: es lo que ordena la serie (ADR-0082).</summary>
    public Guid TermId { get; private set; }

    /// <summary>
    /// La cátedra con la que cursó. Null cuando no la recuerda ("No sé"), que es una respuesta
    /// legítima: la reseña cuenta igual en la materia, y no cuenta en ninguna ficha de cátedra.
    /// </summary>
    public Guid? ChairId { get; private set; }

    /// <summary>
    /// La versión del cuestionario con la que respondió. Sin esto el agregado histórico miente
    /// cuando el instrumento cambia: hay que saber a cuál contestó cada uno (ADR-0082).
    /// </summary>
    public InstrumentId InstrumentId { get; private set; }

    /// <summary>
    /// Lo que escribió al final, si escribió. <b>No se publica nunca</b> (ADR-0084): lo lee la
    /// curaduría para destilar ítems nuevos y para escribir notas sin nombres. Ningún read público
    /// lo devuelve, y no está en lo que se descarga.
    /// </summary>
    public string? FreeText { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<ItemAnswer> _answers = [];

    /// <summary>Lo respondido. Lo salteado no está: no deja fila y no cuenta en ningún denominador.</summary>
    public IReadOnlyList<ItemAnswer> Answers => _answers;

    private Review() { }

    /// <summary>
    /// Crea la reseña con lo respondido. Las respuestas se validan enteras contra el juego de pares
    /// (ítem, opción) que la versión del instrumento admite, que el application layer arma leyendo
    /// el catálogo: el aggregate no puede ver esos otros aggregates, pero sí exigir que lo que entra
    /// esté adentro de lo ofrecido.
    /// </summary>
    /// <param name="allowedOptionsByItem">
    /// Por cada ítem que el instrumento ofrece, los valores de opción válidos. Es el contrato que
    /// hace imposible guardar una respuesta a un ítem que no se preguntó, o una opción inventada.
    /// </param>
    public static Result<Review> Create(
        Guid accountId,
        Guid subjectId,
        Guid termId,
        Guid? chairId,
        InstrumentId instrumentId,
        IEnumerable<(ItemId ItemId, short OptionValue)> answers,
        string? freeText,
        IReadOnlyDictionary<ItemId, IReadOnlySet<short>> allowedOptionsByItem,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(answers);
        ArgumentNullException.ThrowIfNull(allowedOptionsByItem);
        ArgumentNullException.ThrowIfNull(clock);

        var textResult = ValidateFreeText(freeText);
        if (textResult.IsFailure)
        {
            return textResult.Error;
        }

        var built = BuildAnswerSet(answers, allowedOptionsByItem);
        if (built.IsFailure)
        {
            return built.Error;
        }

        var now = clock.UtcNow;
        var review = new Review
        {
            Id = ReviewId.New(),
            AccountId = accountId,
            SubjectId = subjectId,
            TermId = termId,
            ChairId = chairId,
            InstrumentId = instrumentId,
            FreeText = TrimToNull(freeText),
            CreatedAt = now,
            UpdatedAt = now,
        };
        review._answers.AddRange(built.Value);
        return review;
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado, para el seeder. Valida las respuestas y tira si vienen
    /// incoherentes, mismo criterio que los demás Hydrate del proyecto.
    /// </summary>
    /// <exception cref="ArgumentException">Si hay dos respuestas al mismo ítem.</exception>
    public static Review Hydrate(
        ReviewId id,
        Guid accountId,
        Guid subjectId,
        Guid termId,
        Guid? chairId,
        InstrumentId instrumentId,
        IEnumerable<(ItemId ItemId, short OptionValue)> answers,
        string? freeText,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        ArgumentNullException.ThrowIfNull(answers);

        var review = new Review
        {
            Id = id,
            AccountId = accountId,
            SubjectId = subjectId,
            TermId = termId,
            ChairId = chairId,
            InstrumentId = instrumentId,
            FreeText = freeText,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

        foreach (var (itemId, optionValue) in answers)
        {
            if (review._answers.Any(a => a.ItemId == itemId))
            {
                throw new ArgumentException(
                    $"Review {id.Value} answers item {itemId.Value} twice.",
                    nameof(answers));
            }
            review._answers.Add(new ItemAnswer(itemId, optionValue));
        }

        return review;
    }

    /// <summary>
    /// Reemplaza lo respondido y el texto, validando todo antes de mutar. Es la edición del autor:
    /// puede cambiar una respuesta, agregar una que había salteado, o dejar de responder algo (esa
    /// respuesta desaparece y su ítem vuelve a no contarla en el denominador).
    ///
    /// <para>
    /// Los conteos publicados se recalculan desde acá, así que editar mueve las fichas hacia atrás:
    /// es correcto y la ficha lo dice, porque lo que se publica es lo que hoy sostienen sus voces.
    /// </para>
    /// </summary>
    public Result Revise(
        IEnumerable<(ItemId ItemId, short OptionValue)> answers,
        string? freeText,
        IReadOnlyDictionary<ItemId, IReadOnlySet<short>> allowedOptionsByItem,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(answers);
        ArgumentNullException.ThrowIfNull(allowedOptionsByItem);
        ArgumentNullException.ThrowIfNull(clock);

        var textResult = ValidateFreeText(freeText);
        if (textResult.IsFailure)
        {
            return textResult.Error;
        }

        var built = BuildAnswerSet(answers, allowedOptionsByItem);
        if (built.IsFailure)
        {
            return built.Error;
        }

        _answers.Clear();
        _answers.AddRange(built.Value);
        FreeText = TrimToNull(freeText);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Borra solo el texto libre y deja las respuestas contando. Es lo que pide quien se arrepiente
    /// de lo que escribió pero no de lo que respondió: son dos aportes distintos y se sueltan por
    /// separado.
    /// </summary>
    public Result ClearFreeText(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        FreeText = null;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// True si la cuenta dada es la autora. Lo usan los handlers de editar y borrar: nadie toca la
    /// reseña de otro.
    /// </summary>
    public bool IsAuthoredBy(Guid accountId) => AccountId == accountId;

    /// <summary>
    /// Arma el juego de respuestas validándolo sin mutar: sin ítems repetidos, cada ítem ofrecido
    /// por el instrumento, cada opción perteneciente a su ítem, y al menos una respuesta.
    /// </summary>
    private static Result<List<ItemAnswer>> BuildAnswerSet(
        IEnumerable<(ItemId ItemId, short OptionValue)> answers,
        IReadOnlyDictionary<ItemId, IReadOnlySet<short>> allowedOptionsByItem)
    {
        var result = new List<ItemAnswer>();
        foreach (var (itemId, optionValue) in answers)
        {
            if (result.Any(a => a.ItemId == itemId))
            {
                return ReviewErrors.DuplicateAnswer;
            }
            if (!allowedOptionsByItem.TryGetValue(itemId, out var allowed))
            {
                return ReviewErrors.ItemNotInInstrument;
            }
            if (!allowed.Contains(optionValue))
            {
                return ReviewErrors.OptionNotInItem;
            }
            result.Add(new ItemAnswer(itemId, optionValue));
        }

        if (result.Count == 0)
        {
            return ReviewErrors.NoAnswers;
        }

        return result;
    }

    private static Result ValidateFreeText(string? freeText)
    {
        if (freeText is not null && freeText.Trim().Length > MaxFreeTextLength)
        {
            return ReviewErrors.FreeTextTooLong;
        }
        return Result.Success();
    }

    private static string? TrimToNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
