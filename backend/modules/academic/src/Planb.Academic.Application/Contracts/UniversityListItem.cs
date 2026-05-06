namespace Planb.Academic.Application.Contracts;

/// <summary>
/// DTO para el listado público de universidades expuesto como GET /api/academic/universities
/// (US-037 onboarding cascada University → Career → CareerPlan). El endpoint NO requiere auth
/// (catálogo público); cualquier visitor puede ver el set de universidades soportadas.
///
/// Se mantiene plano y mínimo: id + nombre humano + slug. Created_at queda fuera porque no es
/// relevante para el caller de UI; cuando aparezca un caller que lo necesite, se agrega.
/// </summary>
public sealed record UniversityListItem(
    Guid Id,
    string Name,
    string Slug);
