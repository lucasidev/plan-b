namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// Confirmación mínima del import (issue #506): cuántas afirmaciones se cargaron. El detalle por
/// institución (quién tiene informes, quién no, cuándo se consultó) lo trae el GET
/// (<see cref="GetAdminAgnAuditsEndpoint"/>), que el cliente refresca después de esto (mutación
/// pura, ADR-0046): no se duplica ese cálculo acá.
/// </summary>
public sealed record ImportAgnAuditsResponse(int AuditsLoaded);
