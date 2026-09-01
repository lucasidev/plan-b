namespace Planb.Reviews.Domain.Curation;

/// <summary>
/// Las notas del equipo. Escritura: la lectura de la ficha va por Dapper, como todo lo que se
/// publica (ADR-0018).
/// </summary>
public interface IEditorialNoteRepository
{
    Task AddAsync(EditorialNote note, CancellationToken ct = default);

    Task<EditorialNote?> GetByIdAsync(EditorialNoteId id, CancellationToken ct = default);
}
