namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Publicar una nota del equipo sobre una carrera (ADR-0084): la síntesis de lo que se leyó en el
/// campo libre. La síntesis se publica; el texto del que salió, no.
/// </summary>
public sealed record PublishEditorialNoteCommand(Guid CareerId, string Text);

/// <summary>Retirar una nota de la ficha. No la borra: ver <c>EditorialNote.Withdraw</c>.</summary>
public sealed record WithdrawEditorialNoteCommand(Guid NoteId);
