namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Las notas del equipo que una carrera publica hoy (ADR-0084). Solo las vigentes: una retirada
/// dejó de valer, y mostrarla con una marca de retirada sería discutir la nota en vez del dato.
/// </summary>
public interface IEditorialNoteQueryService
{
    Task<IReadOnlyList<EditorialNoteRow>> ListForCareerAsync(
        Guid careerId, CancellationToken ct = default);
}

/// <summary>
/// Una nota como la lee la ficha. <b>Sin autor</b>: la firma el equipo, y publicar quién la
/// escribió invitaría a discutir la firma en vez del dato.
/// </summary>
public sealed record EditorialNoteRow(Guid Id, string Text, DateTimeOffset PublishedAt);
