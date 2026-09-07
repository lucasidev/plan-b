using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Application.Features.SignIn;
using Planb.IntegrationTests.Identity;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Host;

/// <summary>
/// GET /metrics: formato Prometheus con las señales de oro HTTP (prometheus-net
/// <c>UseHttpMetrics</c>) y los contadores de dominio detrás de <c>IDomainMetrics</c>.
///
/// <para>
/// Los colectores viven en el registry default de prometheus-net, que es un singleton por proceso
/// de test: otras clases de esta suite también generan tráfico contra el mismo registry mientras
/// corren en paralelo. Por eso las afirmaciones son "la serie aparece" y "el valor es mayor a cero",
/// nunca un delta exacto.
/// </para>
/// </summary>
public class MetricsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly HttpClient _client;

    public MetricsEndpointTests(RegisterApiFixture fixture)
    {
        _client = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task Metrics_exposes_http_signals_and_dependency_state_after_a_health_check()
    {
        // Dispara los IHealthCheck (Postgres, Redis) para que dependency_up tenga un valor.
        var health = await _client.GetAsync("/health");
        health.StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await _client.GetAsync("/metrics");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.ShouldBe("text/plain");

        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("http_request_duration_seconds");
        body.ShouldContain("""dependency_up{dependency="postgres"} 1""");
    }

    [Fact]
    public async Task Metrics_counts_sign_in_attempts_by_result()
    {
        // Failure: contraseña incorrecta contra una persona sembrada.
        await _client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.LuciaEmail, "definitely-wrong-password"));

        // Success: la misma persona, con su contraseña real.
        await _client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.LuciaEmail, TestPersonas.LuciaPassword));

        var body = await _client.GetOkStringAsync("/metrics");

        CounterValue(body, "planb_sign_in_attempts_total{result=\"failure\"}").ShouldBeGreaterThan(0);
        CounterValue(body, "planb_sign_in_attempts_total{result=\"success\"}").ShouldBeGreaterThan(0);
    }

    /// <summary>
    /// El valor de una línea <c>metric{labels} value</c> de la exposición Prometheus. Falla el test
    /// (no devuelve 0) si la serie ni siquiera aparece, que es la falla real cuando el conteo no
    /// corrió: una serie con labels no existe en el output hasta el primer <c>WithLabels(...)</c>.
    /// </summary>
    private static double CounterValue(string metricsBody, string labeledMetric)
    {
        var line = metricsBody
            .Split('\n')
            .SingleOrDefault(l => l.StartsWith(labeledMetric, StringComparison.Ordinal));

        line.ShouldNotBeNull($"'{labeledMetric}' no aparece en /metrics:\n{metricsBody}");
        return double.Parse(line![labeledMetric.Length..].Trim(), CultureInfo.InvariantCulture);
    }
}
