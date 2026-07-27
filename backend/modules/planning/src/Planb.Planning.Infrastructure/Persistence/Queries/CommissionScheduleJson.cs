using System.Text.Json;
using Planb.Planning.Application.Features.GetAvailableSubjects;

namespace Planb.Planning.Infrastructure.Persistence.Queries;

/// <summary>
/// Lee la columna <c>academic.commissions.schedules</c>, que guarda las franjas como documento
/// embebido (ADR-0053). El shape lo fija la configuración EF del aggregate en Academic:
/// <c>[{"day","start","end"}]</c>, con el día como nombre y las horas como "HH:mm".
///
/// <para>
/// Está duplicada respecto de la de Academic a propósito. Compartirla obligaría a que Planning
/// referencie infraestructura de otro módulo, que es justo lo que los boundaries impiden; el mismo
/// criterio con el que la detección de solapes vive duplicada en los dos dominios. Lo que sí es
/// contrato compartido es el shape del documento, y por eso está documentado en los dos lados.
/// </para>
/// </summary>
internal static class CommissionScheduleJson
{
    private sealed record Slot(string Day, string Start, string End);

    private static readonly JsonSerializerOptions Options =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private static readonly IReadOnlyList<SimulatorScheduleItem> Empty = [];

    /// <summary>
    /// Orden de días para presentación. Antes lo garantizaba un <c>CASE</c> en el <c>ORDER BY</c> del
    /// SQL; con el documento embebido lo tiene que poner el lector.
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
    /// Devuelve las franjas ordenadas por día y hora de inicio. "Sin horario cargado" es un estado
    /// válido del dominio (US-096), así que null o array vacío devuelven lista vacía, no error.
    /// </summary>
    internal static IReadOnlyList<SimulatorScheduleItem> Read(string? json)
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
            .ThenBy(s => s.Start, StringComparer.Ordinal)
            .Select(s => new SimulatorScheduleItem(s.Day, s.Start, s.End))];
    }
}
