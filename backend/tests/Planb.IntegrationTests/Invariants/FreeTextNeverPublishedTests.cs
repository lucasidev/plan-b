using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Contracts;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// El campo libre no se publica nunca (ADR-0084): alimenta la curaduría y no sale en ningún
/// endpoint público, ni siquiera en el de una cátedra que cruzó el piso.
/// </summary>
public class FreeTextNeverPublishedTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsCareerId = Guid.Parse("00000002-0000-4000-a000-000000000003");
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public FreeTextNeverPublishedTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private async Task<AuthenticatedClient> AccountAsync(int index)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"freetext-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    private static async Task PublishAsync(AuthenticatedClient auth, int index, string? freeText)
    {
        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211,
                termId = Terms[index % Terms.Length],
                chairId = (Guid?)ChairPerez,
                answers = new[]
                {
                    new { itemCode = "COURSE_OUTCOME", optionValue = 1 },
                    // Un ítem de ChairConduct de verdad: si el campo libre se filtrara pegado al
                    // texto de algún ítem publicado, acá tiene contenido real donde aparecer. Con
                    // solo COURSE_OUTCOME (que no se publica como ítem) la ficha queda vacía y esa
                    // vía de filtración no se ejercita.
                    new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = 1 },
                },
                freeText,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
    }

    /// <summary>Cuerpo crudo, para no depender de a qué propiedad del contrato terminaría mapeando.</summary>
    private async Task<string> BodyAsync(string url)
    {
        var response = await _anonymous.GetAsync(url);
        response.StatusCode.ShouldBe(
            HttpStatusCode.OK, $"{url} -> {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return await response.Content.ReadAsStringAsync();
    }

    /// <summary>
    /// Un GUID como texto libre no se confunde con nada de lo que un ítem, un nombre o una nota
    /// editorial dirían de verdad. Si aparece en algún cuerpo público, es porque se filtró.
    /// </summary>
    [Fact]
    public async Task The_sentinel_planted_in_free_text_never_reaches_a_public_body()
    {
        var sentinel = $"SENTINEL-{Guid.NewGuid():N}";

        var author = await AccountAsync(0);
        await PublishAsync(author, 0, sentinel);
        for (var i = 1; i < 10; i++)
        {
            await PublishAsync(await AccountAsync(i), i, null);
        }

        // Control positivo: la autora se lee a sí misma y el texto sigue ahí.
        var mineResponse = await author.Client.GetAsync("/api/reviews/courses/me");
        mineResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var mineBody = await mineResponse.Content.ReadAsStringAsync();
        mineBody.ShouldContain(sentinel);

        var chairs = await _anonymous.GetFromJsonAsync<List<ChairListItem>>(
            $"/api/academic/subjects/{Subject211}/chairs");
        chairs.ShouldNotBeNull();
        var teacherId = chairs!.Single(c => c.Id == ChairPerez).LeadTeacherId;
        teacherId.ShouldNotBeNull();

        var publicUrls = new (string Label, string Url)[]
        {
            ("chair facts", $"/api/reviews/chairs/{ChairPerez}/facts"),
            ("subject facts", $"/api/reviews/subjects/{Subject211}/facts"),
            ("career facts", $"/api/reviews/careers/{TudcsCareerId}/facts"),
            ("sample chair facts", "/api/reviews/chairs/sample"),
            ("instrument", "/api/reviews/instrument"),
            ("publishing rules", "/api/reviews/publishing-rules"),
            ("search", $"/api/search?q={Uri.EscapeDataString(sentinel)}"),
            ("subject detail", $"/api/academic/subjects/{Subject211}"),
            ("subject chairs", $"/api/academic/subjects/{Subject211}/chairs"),
            ("teacher detail", $"/api/academic/teachers/{teacherId}"),
            ("teacher chairs", $"/api/academic/teachers/{teacherId}/chairs"),
        };

        foreach (var (label, url) in publicUrls)
        {
            var body = await BodyAsync(url);
            body.ShouldNotContain(sentinel, customMessage: $"{label} ({url}) filtró el campo libre");
        }
    }
}
