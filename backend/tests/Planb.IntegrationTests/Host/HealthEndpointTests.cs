using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Host;

/// <summary>
/// GET /health: Postgres y Redis reales (nada de mocks acá, es integration), más dos escenarios
/// armados con <c>WithWebHostBuilder</c> sobre el mismo fixture: una falla inyectada para ver el
/// aggregate en 503, y un <c>PLANB_VERSION</c> inyectado para ver que el endpoint lo lee de
/// configuración.
/// </summary>
public class HealthEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public HealthEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private sealed record HealthResponse(
        string Status, string Service, string Version, IReadOnlyList<HealthCheckDto> Checks);

    private sealed record HealthCheckDto(string Name, string Status, double LatencyMs, string? Error);

    [Fact]
    public async Task Health_returns_ok_with_postgres_and_redis_checks()
    {
        using var client = _fixture.Factory.CreateClient();

        var body = await client.GetOkAsync<HealthResponse>("/health");

        body.Status.ShouldBe("ok");
        body.Service.ShouldBe("planb-api");
        body.Version.ShouldNotBeNullOrWhiteSpace();

        var postgres = body.Checks.Single(c => c.Name == "postgres");
        postgres.Status.ShouldBe("ok");
        postgres.LatencyMs.ShouldBeGreaterThanOrEqualTo(0);

        var redis = body.Checks.Single(c => c.Name == "redis");
        redis.Status.ShouldBe("ok");
        redis.LatencyMs.ShouldBeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task Health_reports_fail_and_503_when_a_check_fails()
    {
        using var factory = _fixture.Factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
                services.AddHealthChecks().AddCheck("fake", () => HealthCheckResult.Unhealthy("boom"))));
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        response.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);

        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        body.ShouldNotBeNull();
        body!.Status.ShouldBe("fail");

        var fake = body.Checks.Single(c => c.Name == "fake");
        fake.Status.ShouldBe("fail");
        fake.Error.ShouldNotBeNullOrWhiteSpace();
        fake.Error.ShouldContain("boom");

        var postgres = body.Checks.Single(c => c.Name == "postgres");
        postgres.Status.ShouldBe("ok");
    }

    [Fact]
    public async Task Health_carries_the_build_version_from_configuration()
    {
        using var factory = _fixture.Factory.WithWebHostBuilder(builder =>
            builder.UseSetting("PLANB_VERSION", "abc1234"));
        using var client = factory.CreateClient();

        var body = await client.GetOkAsync<HealthResponse>("/health");

        body.Version.ShouldBe("abc1234");
    }
}
