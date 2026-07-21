using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Contracts;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de GET /api/academic/subjects/{id} (US-002): metadata de una materia por id. Público.
/// </summary>
public class GetSubjectEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    // Seed determinístico de Academic (mismas ids que los tests de Enrollments/Reviews).
    private static readonly Guid Subject101 = Guid.Parse("00000004-0000-4000-a000-000000000001");

    public GetSubjectEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Returns_200_with_metadata_for_existing_subject()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync($"/api/academic/subjects/{Subject101}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SubjectDetailItem>();
        body.ShouldNotBeNull();
        body!.Id.ShouldBe(Subject101);
        body.Code.ShouldNotBeNullOrWhiteSpace();
        body.Name.ShouldNotBeNullOrWhiteSpace();
        body.TotalHours.ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task Returns_404_for_unknown_subject()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync($"/api/academic/subjects/{Guid.NewGuid()}");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Is_public_no_auth_required()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync($"/api/academic/subjects/{Subject101}");

        response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
    }
}
