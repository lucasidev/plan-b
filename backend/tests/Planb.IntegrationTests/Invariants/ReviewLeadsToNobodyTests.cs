using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Contracts;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// Una reseña no lleva a nadie (ADR-0082; US-148): ningún endpoint público expone el mail, el
/// nombre, el id de cuenta ni el id de una reseña de quien la escribió, aunque la cátedra cruce
/// el piso. Los contratos de ficha (<c>GetChairFactsResponse</c> y hermanos) tampoco tienen
/// campo para eso: no hay objeto por reseña, todo lo que viaja son conteos.
/// </summary>
public class ReviewLeadsToNobodyTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid UnstaId = Guid.Parse("00000001-0000-4000-a000-000000000001");
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

    public ReviewLeadsToNobodyTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private async Task<AuthenticatedClient> AccountAsync(int index, string emailPrefix = "nobody")
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"{emailPrefix}-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    private static async Task<Guid> PublishAsync(AuthenticatedClient auth, int index)
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
                    // Una frase de ChairConduct de verdad: si algo llegara a colgar un dato de la
                    // reseña del texto de una frase publicada, acá tiene contenido real donde
                    // aparecer (con solo COURSE_OUTCOME la ficha queda sin frases que mostrar).
                    new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = 1 },
                },
                freeText = (string?)null,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
        var body = await response.Content.ReadFromJsonAsync<Planb.Reviews.Application.Features.PublishReview.PublishReviewResponse>();
        body.ShouldNotBeNull();
        return body!.Id;
    }

    private async Task<string> BodyAsync(string url)
    {
        var response = await _anonymous.GetAsync(url);
        response.StatusCode.ShouldBe(
            HttpStatusCode.OK, $"{url} -> {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return await response.Content.ReadAsStringAsync();
    }

    [Fact]
    public async Task No_public_body_exposes_the_mail_the_name_the_account_id_or_the_review_id()
    {
        var sentinelEmail = $"leads-nowhere-{Guid.NewGuid():N}@planb.local";
        var sentinelName = $"CENTINELA-{Guid.NewGuid():N}";

        var author = await AuthenticatedClient.CreateAsync(_fixture, sentinelEmail);
        (await author.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();
        (await author.Client.PatchAsJsonAsync(
            "/api/me/student-profile",
            new
            {
                displayName = sentinelName,
                yearOfStudy = (int?)null,
                legajo = (string?)null,
                regularStudent = (bool?)null,
            }))
            .EnsureSuccessStatusCode();

        // Control positivo: el propio perfil trae el nombre que acabamos de guardar.
        var profileResponse = await author.Client.GetAsync("/api/me/student-profile");
        profileResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var profileBody = await profileResponse.Content.ReadAsStringAsync();
        profileBody.ShouldContain(sentinelName);

        var reviewId = await PublishAsync(author, 0);
        for (var i = 1; i < 10; i++)
        {
            await PublishAsync(await AccountAsync(i), i);
        }

        // Control positivo: con el piso de 10 cruzado, la ficha ya publica. Si el piso cambia,
        // esto cae explicando por qué en vez de que el barrido de abajo falle sin dar pistas.
        var chairFacts = await _anonymous.GetFromJsonAsync<GetChairFactsResponse>(
            $"/api/reviews/chairs/{ChairPerez}/facts");
        chairFacts.ShouldNotBeNull();
        chairFacts!.IsPublished.ShouldBeTrue();

        var accountId = author.UserId.Value.ToString();
        var reviewIdText = reviewId.ToString();

        // Control positivo: mis reseñas trae el id de la reseña (lo necesita para editar/borrar).
        var mineResponse = await author.Client.GetAsync("/api/reviews/courses/me");
        mineResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var mineBody = await mineResponse.Content.ReadAsStringAsync();
        mineBody.ShouldContain(reviewIdText);

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
            ("search", $"/api/search?q={Uri.EscapeDataString(sentinelName)}"),
            ("subject detail", $"/api/academic/subjects/{Subject211}"),
            ("subject chairs", $"/api/academic/subjects/{Subject211}/chairs"),
            ("teacher detail", $"/api/academic/teachers/{teacherId}"),
            ("teacher chairs", $"/api/academic/teachers/{teacherId}/chairs"),
            ("universities", "/api/academic/universities"),
            ("careers", $"/api/academic/careers?universityId={UnstaId}"),
            ("career plans", $"/api/academic/career-plans?careerId={TudcsCareerId}"),
            ("career plan by id", $"/api/academic/career-plans/{TudcsPlanId}"),
            ("academic terms", $"/api/academic/academic-terms?universityId={UnstaId}"),
            ("subjects", $"/api/academic/subjects?careerPlanId={TudcsPlanId}"),
            ("prerequisites", $"/api/academic/prerequisites?careerPlanId={TudcsPlanId}"),
        };

        var probes = new[] { sentinelEmail, sentinelName, accountId, reviewIdText };

        foreach (var (label, url) in publicUrls)
        {
            var body = await BodyAsync(url);
            foreach (var probe in probes)
            {
                body.ShouldNotContain(probe, customMessage: $"{label} ({url}) filtró {probe}");
            }
        }
    }
}
