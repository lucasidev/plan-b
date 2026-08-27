using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Contracts;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests para el read-side de cátedras (US-196):
///   - GET /api/academic/subjects/{subjectId}/chairs
///
/// El seed siembra tres cátedras con ids determinísticos (00000008-0000-4000-a000-0000000000NN)
/// sobre Fundamentos de Control de Calidad (211, TUDCS UNSTA), cada una con su titular. Los tests
/// resuelven por id sin crear data. Verifican el orden por nombre, el titular vigente y el
/// title-casing (initcap) de nombres acentuados.
/// </summary>
public class ChairCatalogTests : IClassFixture<RegisterApiFixture>
{
    private readonly HttpClient _client;

    public ChairCatalogTests(RegisterApiFixture fixture)
    {
        _client = fixture.Factory.CreateClient();
    }

    // Fundamentos de Control de Calidad (211): tiene 3 cátedras sembradas (Pérez, González, Ruiz).
    private static readonly Guid Subject211Id =
        Guid.Parse("00000004-0000-4000-a000-000000000012");

    [Fact]
    public async Task ListChairs_returns_seeded_chairs_ordered_by_name_with_lead_teacher()
    {
        var response = await _client.GetAsync($"/api/academic/subjects/{Subject211Id}/chairs");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var chairs = await response.Content.ReadFromJsonAsync<List<ChairListItem>>();
        chairs.ShouldNotBeNull();
        chairs!.Count.ShouldBe(3);

        // Orden por nombre: González, Pérez, Ruiz (primera letra distinta, sin ambigüedad de
        // collation posible, a diferencia de PublicCatalogEndpointsTests.ListUniversities).
        chairs[0].Name.ShouldBe("González");
        chairs[0].LeadTeacherId.ShouldNotBeNull();
        chairs[0].LeadFirstName.ShouldBe("Patricia");
        chairs[0].LeadLastName.ShouldBe("González");

        chairs[1].Name.ShouldBe("Pérez");
        chairs[1].LeadFirstName.ShouldBe("Martín");
        chairs[1].LeadLastName.ShouldBe("Pérez");

        chairs[2].Name.ShouldBe("Ruiz");
        chairs[2].LeadFirstName.ShouldBe("Sergio");
        chairs[2].LeadLastName.ShouldBe("Ruiz");
    }

    [Fact]
    public async Task ListChairs_returns_empty_for_unknown_subject()
    {
        var response = await _client.GetAsync($"/api/academic/subjects/{Guid.NewGuid()}/chairs");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var chairs = await response.Content.ReadFromJsonAsync<List<ChairListItem>>();
        chairs.ShouldBeEmpty();
    }
}
