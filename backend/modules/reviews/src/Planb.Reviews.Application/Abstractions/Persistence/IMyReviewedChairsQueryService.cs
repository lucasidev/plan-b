namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Las cátedras que una cuenta reseñó, con cuántas voces junta cada una (US-231).
///
/// <para>
/// Existe para que Inicio pueda contestar la única pregunta con la que alguien vuelve: si lo que
/// dijo ya publica o qué le falta. Resolverlo desde el frontend obligaba a pedir
/// <c>/api/reviews/chairs/{id}/facts</c> una vez por cátedra, que es un N+1 por red.
/// </para>
///
/// <para>
/// <b>No devuelve nada del catálogo.</b> Ni el nombre de la cátedra ni el de la materia: eso ya
/// viene de <see cref="IMyCourseReviewsQueryService"/> y el frontend lo compone. Con ese recorte
/// la consulta vive entera en el schema <c>reviews</c> y no cruza a <c>academic</c>.
/// </para>
/// </summary>
public interface IMyReviewedChairsQueryService
{
    Task<IReadOnlyList<MyReviewedChairView>> ListAsync(
        Guid accountId, CancellationToken ct = default);
}

/// <summary>
/// El estado de una cátedra que esta cuenta reseñó.
///
/// <para>
/// <see cref="ReviewCount"/> es el conteo de <b>toda</b> la cátedra, no de lo que aportó quien
/// pregunta: es el número que hace que publique o no, y el mismo que su ficha pública muestra.
/// Mostrarlo acá no adelanta nada, porque la ficha ya dice "junta 3 reseñas: con 7 más se publica"
/// para cualquiera que la abra.
/// </para>
/// </summary>
public sealed record MyReviewedChairView(Guid ChairId, int ReviewCount);
