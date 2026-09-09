namespace Planb.Academic.Application.Features.Search;

/// <summary>
/// Un resultado de la búsqueda global de catálogo (US-004, US-132). <see cref="Type"/> discrimina
/// el tipo (<c>subject</c>, <c>teacher</c>, <c>chair</c>, <c>career</c> o <c>institution</c>). Para
/// materia, Label = nombre y Sublabel = código; para docente, Label = nombre completo (title case)
/// y Sublabel = título (ej. "Profesora Titular"); para cátedra, Label = su nombre y Sublabel = la
/// materia que dicta, que es lo que distingue a dos cátedras con el mismo apellido; para carrera,
/// Label = su nombre y Sublabel = la institución que la dicta, que es lo que distingue la misma
/// carrera ofrecida en instituciones distintas; para institución, Label = su nombre y Sublabel
/// vacío. El front deriva el href del par (type, id), así el backend no conoce rutas de frontend.
/// </summary>
public sealed record SearchResultItem(string Type, Guid Id, string Label, string Sublabel);
