namespace Planb.Academic.Domain.Careers;

/// <summary>
/// Con qué ofertas comparte tarjeta una oferta en Dónde estudiarla (R6, tarea 5, ADR-0090): las de
/// su misma aglomeración si <see cref="LocalityAgglomerations"/> declara una para su localidad; si
/// no, las de su misma localidad; y cuando la unidad académica de partida no tiene localidad
/// resuelta, las de su misma provincia, sin fingir una ciudad que no sabe. Vive en el dominio
/// porque agrupar por ciudad es la regla que la pantalla existe para cumplir (US-128), no un
/// detalle de lectura.
/// </summary>
public static class CanonicalCareerComparisonPolicy
{
    /// <summary>
    /// Las ofertas de <paramref name="offerings"/> que comparan con <paramref name="seedCareerId"/>:
    /// misma aglomeración declarada (decisión de producto del 2026-09-09: agrupa por aglomeración,
    /// no por localidad suelta), o mismo bucket de ciudad si ninguna aglomeración la declara
    /// (localidad resuelta, o provincia si la de partida no tiene localidad). Una localidad sin
    /// resolver nunca se junta con una localidad sí resuelta, aunque compartan provincia o
    /// aglomeración: eso sería fingir una ciudad que no se sabe.
    /// </summary>
    public static CityGroup<T> GroupBySeedCity<T>(IReadOnlyList<T> offerings, Guid seedCareerId)
        where T : ILocatedOffering
    {
        ArgumentNullException.ThrowIfNull(offerings);

        var seed = offerings.FirstOrDefault(o => o.CareerId == seedCareerId);
        if (seed is null)
        {
            throw new ArgumentException(
                "seedCareerId debe ser una de las offerings.", nameof(seedCareerId));
        }

        var agglomeration = seed.LocalityId is { } seedLocalityId
            ? LocalityAgglomerations.All.FirstOrDefault(g => g.LocalityIds.Contains(seedLocalityId))
            : null;

        if (agglomeration is not null)
        {
            var sameAgglomeration = offerings
                .Where(o => o.LocalityId is { } localityId && agglomeration.LocalityIds.Contains(localityId))
                .ToList();

            return new CityGroup<T>(agglomeration.Name, false, sameAgglomeration);
        }

        var isProvinceFallback = seed.LocalityName is null;
        var cityLabel = seed.LocalityName ?? seed.Province;

        var sameCity = offerings
            .Where(o => (o.LocalityName ?? o.Province) == cityLabel)
            .ToList();

        return new CityGroup<T>(cityLabel, isProvinceFallback, sameCity);
    }
}

/// <summary>Las ofertas que comparten ciudad con la carrera de partida, y cómo se llegó a esa ciudad.</summary>
public sealed record CityGroup<T>(string CityLabel, bool IsProvinceFallback, IReadOnlyList<T> Offerings);
