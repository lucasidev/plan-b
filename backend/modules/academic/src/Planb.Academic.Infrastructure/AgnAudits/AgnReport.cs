namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// Un informe de la AGN, ya aplanado desde el JSON:API de Drupal (issue #506). Todo menos
/// <see cref="OrganismoIds"/> queda nullable a propósito: la mayoría de los 4816 informes no
/// audita a ninguna universidad y no hace falta que estén completos para poder filtrarlos por
/// organismo; solo importa que el informe elegido como "el más reciente" de un organismo que sí
/// nos interesa traiga lo necesario (<see cref="AgnAuditFactBuilder"/> es quien lo exige ahí).
/// </summary>
public sealed record AgnReport(
    string? Titulo,
    int? Ano,
    int? Resolucion,
    DateOnly? FechaActa,
    string? PathAlias,
    IReadOnlyList<int> OrganismoIds);
