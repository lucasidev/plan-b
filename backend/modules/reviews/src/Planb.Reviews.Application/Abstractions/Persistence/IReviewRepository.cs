using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Abstractions.Persistence;

public interface IReviewRepository
{
    void Add(Review review);

    Task<Review?> FindByIdAsync(ReviewId id, CancellationToken ct = default);

    /// <summary>
    /// US-017: una sola Review por EnrollmentRecord (constraint UNIQUE en data-model).
    /// El handler de publish chequea esto antes de invocar el factory para responder con
    /// idempotency (devolver la review existente con 200) en lugar de 409 cuando el client
    /// reintenta.
    /// </summary>
    Task<Review?> FindByEnrollmentIdAsync(Guid enrollmentId, CancellationToken ct = default);

    /// <summary>
    /// Todas las reseñas publicadas, trackeadas, para la reconciliación de US-015: es el barrido
    /// que encuentra las reseñas que quedaron desalineadas de su cursada porque el evento de
    /// edición no llegó (consumer agotado y mandado al dead-letter).
    ///
    /// <para>
    /// Devuelve aggregates y no un DTO a propósito, aunque sea una lectura: el caller no solo lee,
    /// muta las que encuentra desalineadas. Pasar por Dapper obligaría a rehidratar cada una
    /// después, y sería el mismo trabajo con un paso más.
    /// </para>
    ///
    /// <para>
    /// Sin paginar: son las publicadas de todo el sistema. Hoy es un puñado y el barrido lo corre
    /// staff a mano; cuando el corpus crezca hasta que esto pese, hay que paginarlo o moverlo a un
    /// job, y ese es el momento de decidirlo con el número real en la mano.
    /// </para>
    /// </summary>
    Task<IReadOnlyList<Review>> ListPublishedAsync(CancellationToken ct = default);
}
