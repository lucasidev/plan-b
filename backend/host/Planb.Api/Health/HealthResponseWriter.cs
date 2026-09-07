using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Planb.Api.Health;

/// <summary>
/// El body de <c>GET /health</c>: <c>status</c> en camelCase (<c>"ok"</c>/<c>"fail"</c>) y un
/// <c>checks</c> por cada <see cref="IHealthCheck"/> registrado, con su latencia. El status HTTP
/// (200/503) lo decide <c>HealthCheckOptions.ResultStatusCodes</c> en Program.cs, no este writer.
/// </summary>
internal static class HealthResponseWriter
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static Task WriteAsync(HttpContext context, HealthReport report)
    {
        var version = context.RequestServices.GetRequiredService<IConfiguration>()["PLANB_VERSION"];

        var body = new ResponseBody(
            Status: report.Status == HealthStatus.Healthy ? "ok" : "fail",
            Service: "planb-api",
            Version: string.IsNullOrEmpty(version) ? "dev" : version,
            Checks: report.Entries
                .Select(entry => ToCheck(entry.Key, entry.Value))
                .ToArray());

        context.Response.ContentType = "application/json; charset=utf-8";
        return context.Response.WriteAsync(JsonSerializer.Serialize(body, SerializerOptions));
    }

    /// <summary>
    /// <c>latencyMs</c> sale del <c>data["latencyMs"]</c> que ponen los checks propios
    /// (<see cref="PostgresHealthCheck"/>, <see cref="RedisHealthCheck"/>); un check ajeno que no lo
    /// puso (p. ej. uno de test) cae a la duración que ya mide el framework por entry.
    /// </summary>
    private static CheckEntry ToCheck(string name, HealthReportEntry entry)
    {
        var latencyMs = entry.Data.TryGetValue("latencyMs", out var raw) && raw is IConvertible convertible
            ? Convert.ToDouble(convertible)
            : entry.Duration.TotalMilliseconds;

        return new CheckEntry(
            Name: name,
            Status: entry.Status == HealthStatus.Healthy ? "ok" : "fail",
            LatencyMs: latencyMs,
            Error: entry.Status == HealthStatus.Healthy
                ? null
                : entry.Exception?.Message ?? entry.Description);
    }

    private sealed record ResponseBody(
        string Status, string Service, string Version, IReadOnlyList<CheckEntry> Checks);

    private sealed record CheckEntry(string Name, string Status, double LatencyMs, string? Error);
}
