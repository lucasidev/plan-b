namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// Un informe de la AGN, ya aplanado desde el JSON:API de Drupal (issue #506). Cada fetch de
/// <see cref="AgnReportsApiClient"/> ya viene filtrado por un organismo puntual, así que
/// <see cref="OrganismoIds"/> siempre incluye al pedido (y puede traer otros, si el informe audita
/// a más de uno a la vez). El resto queda nullable a propósito: solo importa que el informe elegido
/// como "el más reciente" traiga lo necesario (<see cref="AgnAuditFactBuilder"/> es quien lo exige
/// ahí).
/// </summary>
public sealed record AgnReport(
    string? Titulo,
    int? Ano,
    int? Resolucion,
    DateOnly? FechaActa,
    string? PathAlias,
    IReadOnlyList<int> OrganismoIds);
