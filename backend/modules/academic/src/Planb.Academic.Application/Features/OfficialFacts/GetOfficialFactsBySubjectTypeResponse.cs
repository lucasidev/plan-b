namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>Las afirmaciones vigentes de todos los sujetos de un tipo, agrupadas por sujeto (ADR-0090).</summary>
public sealed record GetOfficialFactsBySubjectTypeResponse(IReadOnlyList<SubjectOfficialFacts> Subjects);

/// <summary>
/// Las afirmaciones vigentes de UN sujeto, dentro de la respuesta agrupada. Evita la lista plana
/// que <see cref="GetOfficialFactsForSubjectEndpoint"/> devuelve para un solo sujeto: sus
/// consumidores indexan por <c>field</c> nomás, y una lista plana con varios sujetos colapsaría
/// sus afirmaciones entre sí.
/// </summary>
public sealed record SubjectOfficialFacts(Guid SubjectId, IReadOnlyList<OfficialFactResponseItem> Facts);
