using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Parseo de los enums que viajan como string en los requests de curaduría. Mismo criterio que
/// <c>ChairEnumParsing</c> en academic: el enum no se bindea directo desde JSON, así que un typo
/// tiene que salir como 400 con su mensaje y no como el 500 que produce un fallo de binding.
/// </summary>
internal static class CurationEnumParsing
{
    public static bool TryLayer(string? value, out ItemLayer layer) =>
        Enum.TryParse(value, ignoreCase: true, out layer) && Enum.IsDefined(layer);

    public static bool TrySubject(string? value, out ItemSubject subject) =>
        Enum.TryParse(value, ignoreCase: true, out subject) && Enum.IsDefined(subject);

    public static bool TryValence(string? value, out OptionValence valence) =>
        Enum.TryParse(value, ignoreCase: true, out valence) && Enum.IsDefined(valence);
}
