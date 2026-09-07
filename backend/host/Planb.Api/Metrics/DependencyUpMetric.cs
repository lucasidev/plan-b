using Prometheus;

namespace Planb.Api.Metrics;

/// <summary>
/// Gauge de infraestructura, no de negocio: por eso vive afuera de <c>IDomainMetrics</c> y los
/// health checks (<c>Health/*.cs</c>) la llaman directo, sin pasar por la abstracción de dominio.
/// 1/0 según la última corrida de cada <c>IHealthCheck</c> propio: es lo que hace visible en
/// Prometheus una dependencia caída sin tener que ir a leer <c>/health</c> a mano.
/// </summary>
internal static class DependencyUpMetric
{
    private static readonly Gauge Gauge = Prometheus.Metrics.CreateGauge(
        "dependency_up",
        "1 si la última corrida del health check de esa dependencia fue exitosa, 0 si no.",
        ["dependency"]);

    public static void Set(string dependency, bool up) =>
        Gauge.WithLabels(dependency).Set(up ? 1 : 0);
}
