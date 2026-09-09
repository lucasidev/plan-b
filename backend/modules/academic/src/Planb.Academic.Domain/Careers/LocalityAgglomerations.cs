namespace Planb.Academic.Domain.Careers;

/// <summary>
/// Qué localidades de Georef son la misma aglomeración para <see cref="CanonicalCareerComparisonPolicy"/>
/// (decisión de producto del 2026-09-09): dos localidades resueltas distintas pueden ser, en la
/// vida real, la misma opción para quien elige dónde cursar. Lo decide el equipo, con el mismo
/// criterio que <c>CanonicalCareerGroupings</c> declara qué ofertas son la misma carrera (no un
/// cálculo), y vive en el dominio por la misma razón que la propia policy: agrupar por ciudad es la
/// regla que la pantalla existe para cumplir, no un detalle de lectura. Se declara por
/// <c>LocalityId</c> de Georef, no por el nombre que le puso a la localidad: ese nombre varía
/// (Yerba Buena resuelve como "Yerba Buena - Marcos Paz"), el id no.
///
/// <para>
/// Lo que quedó afuera a propósito, por dudoso (no forzado). Concepción y Aguilares son ciudades
/// del interior sin continuidad urbana con la capital y siguen comparándose solas. Las otras
/// localidades que releva <c>AcademicUnit</c> son sedes conveniadas más lejos de la capital que esas
/// dos: Capitán Cáceres (Monteros), Amaicha del Llano / Bella Vista (Leales) y Leocadio Paz
/// (Trancas); tampoco entran. Tafí Viejo es geográficamente contiguo con la capital (el propio
/// aglomerado del INDEC para la EPH se llama "Gran Tucumán - Tafí Viejo"), pero a diferencia de San
/// Miguel de Tucumán y Yerba Buena no hay una respuesta de Georef verificada contra su id real:
/// queda afuera hasta verificarlo.
/// </para>
/// </summary>
public static class LocalityAgglomerations
{
    public sealed record Group(string Name, IReadOnlyList<string> LocalityIds);

    public static IReadOnlyList<Group> All { get; } = new[]
    {
        // La Facultad de Ingeniería de UNSTA (Tecnicatura en Desarrollo y Calidad de Software)
        // resuelve a Yerba Buena; UNT y UTN-FRT resuelven a San Miguel de Tucumán (verificado
        // contra Georef el 2026-09-09). Sin esta declaración, la Tecnicatura de UNSTA queda
        // comparándose sola aunque Yerba Buena sea continuo urbano con la capital.
        new Group("Gran San Miguel de Tucumán", new[]
        {
            "90084010", // San Miguel de Tucumán (capital)
            "90119030", // Yerba Buena
        }),
    };
}
