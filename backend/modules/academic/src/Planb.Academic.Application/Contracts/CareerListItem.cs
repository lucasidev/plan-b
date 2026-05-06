namespace Planb.Academic.Application.Contracts;

/// <summary>
/// DTO para el listado público de carreras de una universidad. Expuesto como
/// GET /api/academic/careers?universityId={id} (US-037 onboarding cascada).
///
/// El UniversityId se incluye aunque el filtro lo conozca, porque en el cliente se usa para
/// invalidar dropdowns dependientes (al cambiar la uni, el career se resetea matcheando por
/// id; sin el id en el item, el cliente tiene que duplicar el filtro).
/// </summary>
public sealed record CareerListItem(
    Guid Id,
    Guid UniversityId,
    string Name,
    string Slug);
