namespace Planb.Academic.Domain.Careers;

/// <summary>
/// Lo mínimo para agrupar una oferta por ciudad en Dónde estudiarla (R6, tarea 5, ADR-0090): el id
/// y el nombre que Georef resolvió para la unidad académica que la dicta (ambos null si no
/// resolvió), y la provincia extraída de su domicilio como fallback. El id es lo que
/// <see cref="LocalityAgglomerations"/> declara; el nombre es lo que cada tarjeta muestra.
/// <see cref="Career"/> no lo implementa (la localidad vive en AcademicUnit, no en Career); lo
/// implementa la fila del read Dapper que ya trae el join, igual que
/// <see cref="Planb.Academic.Domain.OfficialFacts.IRelievedClaim"/> para "vigente".
/// </summary>
public interface ILocatedOffering
{
    Guid CareerId { get; }
    string? LocalityId { get; }
    string? LocalityName { get; }
    string Province { get; }
}
