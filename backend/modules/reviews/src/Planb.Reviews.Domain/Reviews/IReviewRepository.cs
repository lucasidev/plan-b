namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Write-side del aggregate <see cref="Review"/> (US-146, ADR-0082). Los conteos que la ficha
/// publica van por query service con Dapper: son agregados, y ningún read público devuelve una
/// reseña individual. Este repo es solo para crear la reseña y para que su autor la edite o la
/// borre. El SaveChanges lo hace el unit of work del módulo.
/// </summary>
public interface IReviewRepository
{
    Task AddAsync(Review review, CancellationToken ct = default);

    /// <summary>Carga el aggregate con sus respuestas para editarlo. Null si no existe.</summary>
    Task<Review?> GetByIdAsync(ReviewId id, CancellationToken ct = default);

    /// <summary>
    /// La reseña que esa cuenta ya tiene de esa cursada, si la tiene. Es lo que hace cumplible la
    /// regla de una voz por cuenta, materia y período: reseñar de nuevo es editar esta.
    /// </summary>
    Task<Review?> GetByCursadaAsync(
        Guid accountId,
        Guid subjectId,
        Guid termId,
        CancellationToken ct = default);

    void Remove(Review review);
}
