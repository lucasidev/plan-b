using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.ChairFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// Que nadie sepa que fui yo (US-148, ADR-0082): la décima reseña que hace cruzar el piso publica
/// por primera vez la distribución de sus frases, y en ningún cuerpo público aparece quién la
/// escribió, ni su cuenta, ni su rol, ni cómo terminó su cursada.
/// </summary>
public class FirstPublishNeverRevealsWhoOrHowTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

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

    public FirstPublishNeverRevealsWhoOrHowTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private async Task<AuthenticatedClient> AccountAsync(string label, int index)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"{label}-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    private async Task PublishAsync(
        AuthenticatedClient auth, int index, short courseOutcome, short classesHeld)
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
                    new { itemCode = "COURSE_OUTCOME", optionValue = courseOutcome },
                    new { itemCode = "CHAIR_CLASSES_HELD", optionValue = classesHeld },
                },
                freeText = (string?)null,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
    }

    private async Task<GetChairFactsResponse> FactsAsync()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    /// <summary>US-148 E1, N1</summary>
    [Fact]
    public async Task Crossing_the_floor_publishes_the_phrase_without_a_trace_of_who_or_how()
    {
        // Nueve reseñas, todas aprobadas: la cátedra Pérez todavía no publica.
        for (var i = 0; i < 3; i++)
        {
            await PublishAsync(await AccountAsync("floor148-fill", i), i, courseOutcome: 1, classesHeld: 3);
        }
        for (var i = 3; i < 9; i++)
        {
            await PublishAsync(await AccountAsync("floor148-fill", i), i, courseOutcome: 1, classesHeld: 1);
        }

        var before = await FactsAsync();
        before.IsPublished.ShouldBeFalse();
        before.ReviewsMissingToPublish.ShouldBe(1);

        // Matías es la décima voz: recursó la cursada y respondió "Faltaron muchas". Deja un
        // nombre distintivo en su perfil, para poder buscarlo después en cualquier cuerpo público.
        var sentinelEmail = $"matias148-{Guid.NewGuid():N}@planb.local";
        var sentinelName = $"CENTINELA148-{Guid.NewGuid():N}";
        var matias = await AuthenticatedClient.CreateAsync(_fixture, sentinelEmail);
        (await matias.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();
        (await matias.Client.PatchAsJsonAsync(
            "/api/me/student-profile",
            new
            {
                displayName = sentinelName,
                yearOfStudy = (int?)null,
                legajo = (string?)null,
                regularStudent = (bool?)null,
            }))
            .EnsureSuccessStatusCode();

        await PublishAsync(matias, 9, courseOutcome: 3, classesHeld: 3);

        // Por primera vez, la ficha publica: la décima voz la hizo cruzar el piso.
        var after = await FactsAsync();
        after.IsPublished.ShouldBeTrue();
        after.ReviewCount.ShouldBe(10);

        var item = after.ChairConduct.Single(i => i.Code == "CHAIR_CLASSES_HELD");
        item.Total.ShouldBe(10);
        item.Distribution.Single(d => d.Label == "Faltaron muchas").Percent.ShouldBe(40);

        // COURSE_OUTCOME es de contexto: nunca se publica, con o sin piso.
        after.ChairConduct.ShouldNotContain(i => i.Code == "COURSE_OUTCOME");
        after.StudentExperience.ShouldNotContain(i => i.Code == "COURSE_OUTCOME");

        var afterBody = await BodyAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        var probes = new[] { sentinelEmail, sentinelName, matias.UserId.Value.ToString() };
        foreach (var probe in probes)
        {
            afterBody.ShouldNotContain(probe, customMessage: $"la ficha filtró {probe}");
        }

        // Ni su desenlace: "la recursó" no existe en ningún lado público. Solo Matías lo ve, en
        // Mis aportes (control positivo: ahí sigue el código y el valor con los que respondió).
        afterBody.ShouldNotContain("recurs", Case.Insensitive, "la ficha filtró cómo terminó Matías");

        var mine = await matias.Client.GetFromJsonAsync<List<MyReviewView>>("/api/reviews/courses/me");
        mine!.Single().Answers.ShouldContain(a => a.ItemCode == "COURSE_OUTCOME" && a.OptionValue == 3);
    }

    private async Task<string> BodyAsync(string url)
    {
        var response = await _anonymous.GetAsync(url);
        response.StatusCode.ShouldBe(
            HttpStatusCode.OK, $"{url} -> {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return await response.Content.ReadAsStringAsync();
    }
}
