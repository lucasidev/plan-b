using System.Text.Json;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Lee la columna <c>commissions.schedules</c>, que guarda las franjas como documento embebido
/// (ADR-0053). El shape lo fija <c>CommissionConfiguration</c>: <c>[{"day","start","end"}]</c>, con el
/// día como nombre y las horas como "HH:mm".
///
/// <para>
/// Vive acá y no en cada reader porque los dos de este módulo la necesitan igual. Los readers de
/// otros módulos tienen la suya: cruzar el boundary para compartir un parser de 20 líneas sería peor
/// que duplicarlo (mismo criterio que la detección de solapes, duplicada a propósito entre academic y
/// planning).
/// </para>
/// </summary>
internal static class CommissionScheduleJson
{
    /// <summary>Franja cruda tal como sale del documento, sin mapear al DTO de cada consumidor.</summary>
    internal readonly record struct Slot(string Day, string Start, string End);

    private static readonly JsonSerializerOptions Options =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private static readonly IReadOnlyList<Slot> Empty = [];

    /// <summary>
    /// Orden de los días para presentación. Antes lo garantizaba un <c>CASE</c> en el <c>ORDER BY</c>
    /// del SQL; con el documento embebido el orden lo tiene que poner el lector, porque el array
    /// conserva el orden en que se guardó y ese es el que eligió quien cargó la comisión.
    /// </summary>
    private static readonly IReadOnlyDictionary<string, int> DayOrder = new Dictionary<string, int>
    {
        ["Monday"] = 1,
        ["Tuesday"] = 2,
        ["Wednesday"] = 3,
        ["Thursday"] = 4,
        ["Friday"] = 5,
        ["Saturday"] = 6,
        ["Sunday"] = 7,
    };

    /// <summary>
    /// Devuelve las franjas ordenadas por día y hora de inicio. Una comisión sin horario cargado es
    /// un estado válido del dominio (US-096), así que null o array vacío devuelven lista vacía, no
    /// error.
    /// </summary>
    internal static IReadOnlyList<Slot> Read(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return Empty;
        }

        var slots = JsonSerializer.Deserialize<List<Slot>>(json, Options);
        if (slots is null || slots.Count == 0)
        {
            return Empty;
        }

        return [.. slots
            .OrderBy(s => DayOrder.TryGetValue(s.Day, out var order) ? order : int.MaxValue)
            .ThenBy(s => s.Start, StringComparer.Ordinal)];
    }
}
