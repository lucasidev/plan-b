namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Dónde está parada una comisión dentro del catálogo: a qué materia y período pertenece, y si sigue
/// activa.
///
/// <para>
/// Contrato cross-BC. Lo consume Enrollments para validar un <c>commission_id</c> que le
/// llega del cliente: ADR-0017 saca las FK cross-schema y por eso deja esa validación en el
/// application layer, pero hasta ahora no había forma de preguntarla y nadie la hacía.
/// </para>
/// </summary>
public sealed record CommissionPlacement(
    Guid CommissionId,
    Guid SubjectId,
    Guid TermId,
    bool IsActive);
