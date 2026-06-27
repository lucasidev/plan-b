namespace Planb.Academic.Application.Features.Search;

/// <summary>
/// Un resultado de la búsqueda global de catálogo (US-004). <see cref="Type"/> discrimina el tipo
/// (<c>subject</c> o <c>teacher</c>). Para materia, Label = nombre y Sublabel = código; para docente,
/// Label = nombre completo (title case) y Sublabel = título (ej. "Profesora Titular"). El front
/// deriva el href del par (type, id), así el backend no conoce rutas de frontend.
/// </summary>
public sealed record SearchResultItem(string Type, Guid Id, string Label, string Sublabel);
