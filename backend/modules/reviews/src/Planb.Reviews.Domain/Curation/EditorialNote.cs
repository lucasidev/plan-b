using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Curation;

/// <summary>
/// Una nota del equipo sobre una carrera ([ADR-0084](../../../../../../docs/decisions/0084-free-text-feeds-curation-and-is-never-published.md)).
///
/// <para>
/// Es la segunda salida del campo libre: el equipo lee lo que la gente escribió y puede publicar
/// una síntesis. La síntesis se publica; el texto del que salió, no.
/// </para>
///
/// <para>
/// <b>Cuelga de una carrera y nunca de una cátedra.</b> Esa es la regla del ADR y la razón es
/// concreta: a nivel cátedra el docente es identificable, así que una síntesis ahí sería decir algo
/// sobre una persona a partir de textos que prometimos no publicar. El nivel institución también
/// vale, pero su ficha todavía no existe: cuando exista, esto gana su alcance.
/// </para>
///
/// <para>
/// <b>Sin autor.</b> La nota la firma el equipo, no una persona: quién la escribió no es parte de
/// lo que la hace verificable, y publicarlo invitaría a discutir la firma en vez del dato.
/// </para>
///
/// <para>
/// No se borra, se retira. Una nota publicada estuvo en la ficha, y borrarla dejaría a alguien que
/// la leyó sin forma de saber que ya no vale.
/// </para>
/// </summary>
public sealed class EditorialNote : Entity<EditorialNoteId>, IAggregateRoot
{
    public const int MaxTextLength = 1000;

    private EditorialNote() { }

    /// <summary>La carrera de la que habla. Ref cross-BC: uuid sin FK (ADR-0017).</summary>
    public Guid CareerId { get; private set; }

    public string Text { get; private set; } = null!;

    public DateTimeOffset PublishedAt { get; private set; }

    /// <summary>Null mientras está publicada. Se completa al retirarla.</summary>
    public DateTimeOffset? WithdrawnAt { get; private set; }

    public bool IsPublished => WithdrawnAt is null;

    public static Result<EditorialNote> Publish(
        Guid careerId,
        string text,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (careerId == Guid.Empty)
        {
            return EditorialNoteErrors.CareerRequired;
        }

        var trimmed = text?.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            return EditorialNoteErrors.TextRequired;
        }

        if (trimmed.Length > MaxTextLength)
        {
            return EditorialNoteErrors.TextTooLong;
        }

        return new EditorialNote
        {
            Id = EditorialNoteId.New(),
            CareerId = careerId,
            Text = trimmed,
            PublishedAt = clock.UtcNow,
            WithdrawnAt = null,
        };
    }

    /// <summary>
    /// La saca de la ficha sin borrarla. Idempotente no: retirar dos veces es un error, porque la
    /// segunda vez quien lo pide cree estar haciendo algo que ya está hecho.
    /// </summary>
    public Result Withdraw(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsPublished)
        {
            return EditorialNoteErrors.AlreadyWithdrawn;
        }

        WithdrawnAt = clock.UtcNow;
        return Result.Success();
    }
}
