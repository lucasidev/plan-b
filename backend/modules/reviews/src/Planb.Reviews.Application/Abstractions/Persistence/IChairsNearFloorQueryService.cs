namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Qué cátedras de las materias de una carrera están a una reseña de cruzar el piso de
/// publicación: agregado público, el conteo nomás, nada de qué cuenta escribió cuál.
///
/// <para>
/// Cruza <c>reviews.reviews</c> con <c>academic.chairs</c>/<c>subjects</c>/<c>career_plans</c> por
/// <c>career_id</c> en un solo viaje (mismo criterio de ADR-0017 que
/// <see cref="ICareerCoverageQueryService"/>: resolverlo materia por materia contra
/// <c>IAcademicQueryService</c> sería un N+1). Solo las materias del plan vigente cuentan (mismo
/// filtro que la cobertura M/N): una materia de un plan deprecado no invita a reseñar algo que la
/// carrera ya no mide.
/// </para>
/// </summary>
public interface IChairsNearFloorQueryService
{
    /// <summary>Las cátedras de la carrera con exactamente <paramref name="reviewCount"/> reseñas.</summary>
    Task<IReadOnlyList<ChairNearFloorIdentity>> ListAsync(
        Guid careerId, int reviewCount, CancellationToken ct = default);
}

/// <summary>
/// Identidad y conteo crudo, sin nombres: el caller los resuelve en lote contra el contrato de
/// academic (ADR-0087), nunca con un segundo JOIN cross-schema.
/// </summary>
public sealed record ChairNearFloorIdentity(Guid ChairId, Guid SubjectId, int ReviewCount);
