using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/chairs/sample</c> (US-221): la muestra que la entrada
/// pone a la vista de quien llega sin saber qué es esto.
///
/// <para>
/// Lo que importa acá es qué entra al sorteo. Una cátedra que todavía no cruzó el piso no puede
/// salir sorteada, porque no tendría nada que mostrar y la entrada quedaría demostrando que el
/// producto no mide nada. Y cuando ninguna publica, la respuesta es 404 y no una ficha vacía: la
/// pantalla tiene que poder decir "todavía no hay nada" en vez de inventar un ejemplo.
/// </para>
///
/// <para>
/// Los tres tests van en uno solo y en orden: comparten la base (IClassFixture) y xUnit no
/// garantiza el orden entre métodos, así que el "todavía no publica nadie" tiene que correr antes
/// de que este archivo publique su primera reseña.
/// </para>
/// </summary>
public class GetSampleChairFactsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairGonzalez =
        Guid.Parse("00000008-0000-4000-a000-000000000002");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public GetSampleChairFactsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task The_sample_only_draws_among_chairs_that_already_publish()
    {
        // 1) Sin una sola reseña, no hay muestra honesta que dar.
        var empty = await _anonymous.GetAsync("/api/reviews/chairs/sample");
        empty.StatusCode.ShouldBe(HttpStatusCode.NotFound);

        // 2) Nueve reseñas es una cátedra que existe pero todavía no publica: sigue sin entrar al
        // sorteo. Es la diferencia entre "no hay datos" y "hay datos que todavía no se pueden
        // mostrar", y la entrada no puede confundirlas.
        await PublishAsync(ChairGonzalez, from: 0, count: 9);

        var belowFloor = await _anonymous.GetAsync("/api/reviews/chairs/sample");
        belowFloor.StatusCode.ShouldBe(HttpStatusCode.NotFound);

        // 3) La décima la hace publicar, y como es la única que publica, el sorteo la devuelve a
        // ella. La muestra es la ficha entera, la misma que sirve /chairs/{id}/facts.
        await PublishAsync(ChairGonzalez, from: 9, count: 1);

        var response = await _anonymous.GetAsync("/api/reviews/chairs/sample");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var sample = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        sample.ShouldNotBeNull();
        sample!.ChairId.ShouldBe(ChairGonzalez);
        sample.ChairName.ShouldBe("González");
        sample.SubjectName.ShouldBe("Fundamentos de Control de Calidad");

        // Sale publicando de verdad: una muestra que dijera "junta 3, con 7 más se publica" no
        // mostraría el instrumento funcionando, que es la única razón por la que existe.
        sample.IsPublished.ShouldBeTrue();
        sample.ReviewCount.ShouldBe(10);
        sample.ChairConduct.ShouldNotBeEmpty();
        sample.Completion.ShouldNotBeNull();
    }

    private async Task PublishAsync(Guid chairId, int from, int count)
    {
        for (var i = from; i < from + count; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                _fixture, $"sample-{i}.{Guid.NewGuid():N}@planb.local");

            var profile = await auth.Client.PostAsJsonAsync(
                "/api/me/student-profiles",
                new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
            profile.EnsureSuccessStatusCode();

            var published = await auth.Client.PostAsJsonAsync(
                "/api/reviews/cursadas",
                new
                {
                    subjectId = Subject211,
                    termId = Terms[i % Terms.Length],
                    chairId = (Guid?)chairId,
                    answers = new[]
                    {
                        new { itemCode = "COURSE_OUTCOME", optionValue = i < 7 ? 1 : 3 },
                        new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = i < 8 ? 3 : 1 },
                    },
                    freeText = (string?)null,
                });
            published.StatusCode.ShouldBe(HttpStatusCode.Created);
        }
    }
}
