using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.Curation;
using Planb.Reviews.Application.Seeding;
using Planb.Reviews.Infrastructure.Persistence;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Dos publicaciones del instrumento a la vez (#433) nunca dejan dos versiones vigentes, y
/// ninguna termina en 500. La que pierde la carrera recibe 409.
///
/// <para>
/// Por qué doce (<see cref="ConcurrentPublications"/>) y no dos: la sección crítica son dos round
/// trips, y hacen falta doce publicaciones a la vez para que se solapen siempre.
/// </para>
/// </summary>
public class InstrumentConcurrentPublishTests : IClassFixture<RegisterApiFixture>
{
    /// <summary>
    /// Con dos publicaciones concurrentes la sección crítica (leer la vigente, publicar la
    /// siguiente) son dos round trips que casi nunca se solapan. Con doce, la carrera se dio
    /// siempre en las diez corridas que se midieron.
    /// </summary>
    private const int ConcurrentPublications = 12;

    private readonly RegisterApiFixture _fixture;
    private readonly ITestOutputHelper _output;
    private readonly HttpClient _anonymous;

    public InstrumentConcurrentPublishTests(RegisterApiFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
        _anonymous = fixture.Factory.CreateClient();
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"race-{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    /// <summary>
    /// Un código nuevo por publicación. En mayúsculas porque el dominio lo normaliza así, y
    /// comparar contra el original haría fallar al test por una diferencia que es correcta.
    /// </summary>
    private static string FreshCode(string prefix) =>
        $"{prefix}_{Guid.NewGuid():N}"[..20].ToUpperInvariant();

    private static object DistilBody(string code) => new
    {
        code,
        text = "¿Sabías con qué se rendía el final?",
        help = (string?)null,
        layer = "ChairConduct",
        subject = "Chair",
        options = new[]
        {
            new { value = (short)1, order = (short)1, label = "Sí", valence = "Positive" },
            new { value = (short)2, order = (short)2, label = "No", valence = "Negative" },
        },
    };

    private static object SupersedeBody(string code) => new
    {
        code,
        text = "¿Con cuánta anticipación avisaba un cambio de fecha?",
        help = (string?)null,
        layer = "ChairConduct",
        options = new[]
        {
            new { value = (short)1, order = (short)1, label = "Sí", valence = "Positive" },
            new { value = (short)2, order = (short)2, label = "No", valence = "Negative" },
        },
    };

    private async Task<CurrentInstrumentView> InstrumentAsync()
    {
        var response = await _anonymous.GetAsync("/api/reviews/instrument");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var view = await response.Content.ReadFromJsonAsync<CurrentInstrumentView>();
        view.ShouldNotBeNull();
        return view!;
    }

    /// <summary>
    /// Cuenta directo contra la tabla, no contra la respuesta de un endpoint: es la fuente de la
    /// que <see cref="InstrumentAsync"/> depende, y acá lo que importa es que nunca haya dos filas
    /// abiertas a la vez para el mismo cuestionario.
    /// </summary>
    private async Task<int> CurrentInstrumentRowCountAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ReviewsDbContext>();
        return await db.Instruments.CountAsync(
            i => i.Code == CatalogSeedData.StudentCourseCode && i.ValidUntil == null);
    }

    /// <summary>
    /// La invariante bajo prueba, sobre lo que devolvieron las publicaciones concurrentes: cada
    /// respuesta es 201 o 409, al menos una es 201, la vigente queda en antes + cantidad de 201, y
    /// cada 409 trae el ProblemDetails del handler que traduce la violación de UNIQUE.
    /// </summary>
    private async Task AssertRaceInvariantAsync(HttpResponseMessage[] responses, short versionBefore)
    {
        foreach (var response in responses)
        {
            if (response.StatusCode is not (HttpStatusCode.Created or HttpStatusCode.Conflict))
            {
                var body = await response.Content.ReadAsStringAsync();
                response.StatusCode.ShouldBe(
                    HttpStatusCode.Created, $"Unexpected status {response.StatusCode}: {body}");
            }
        }

        var createdCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses.Length - createdCount;
        _output.WriteLine($"201={createdCount} 409={conflictCount}");
        createdCount.ShouldBeGreaterThan(0);

        var after = await InstrumentAsync();
        after.Version.ShouldBe((short)(versionBefore + createdCount));

        (await CurrentInstrumentRowCountAsync()).ShouldBe(1);

        foreach (var response in responses.Where(r => r.StatusCode == HttpStatusCode.Conflict))
        {
            var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
            problem.ShouldNotBeNull();
            problem!.Title.ShouldBe("conflict.duplicate");
        }
    }

    [Fact]
    public async Task Twelve_concurrent_distils_end_in_201_or_409_and_leave_one_current_version()
    {
        var before = await InstrumentAsync();
        var admin = await AdminAsync();

        var tasks = new List<Task<HttpResponseMessage>>();
        for (var i = 0; i < ConcurrentPublications; i++)
        {
            tasks.Add(admin.Client.PostAsJsonAsync(
                "/api/reviews/curation/items", DistilBody(FreshCode("RACE"))));
        }

        var responses = await Task.WhenAll(tasks);

        await AssertRaceInvariantAsync(responses, before.Version);
    }

    [Fact]
    public async Task Distils_and_supersedes_at_the_same_time_leave_one_current_version()
    {
        var admin = await AdminAsync();
        var half = ConcurrentPublications / 2;

        // Cada supersede corta una frase propia, sembrada antes y sin carrera: si las seis
        // compartieran una sola frase para reemplazar, una supersede que pierde la carrera del
        // instrumento pero lee después de que otra ya la retiró fallaría por CannotSupersedeRetired
        // en vez de por el 409 que esta prueba busca.
        var seedItemIds = new List<Guid>();
        for (var i = 0; i < half; i++)
        {
            var seedResponse = await admin.Client.PostAsJsonAsync(
                "/api/reviews/curation/items", DistilBody(FreshCode("SEED")));
            seedResponse.StatusCode.ShouldBe(HttpStatusCode.Created);
            var seeded = await seedResponse.Content.ReadFromJsonAsync<DistilItemResponse>();
            seeded.ShouldNotBeNull();
            seedItemIds.Add(seeded!.ItemId);
        }

        var before = await InstrumentAsync();

        var tasks = new List<Task<HttpResponseMessage>>();
        for (var i = 0; i < half; i++)
        {
            tasks.Add(admin.Client.PostAsJsonAsync(
                "/api/reviews/curation/items", DistilBody(FreshCode("RACED"))));
        }
        foreach (var itemId in seedItemIds)
        {
            tasks.Add(admin.Client.PostAsJsonAsync(
                $"/api/reviews/curation/items/{itemId}/supersede",
                SupersedeBody(FreshCode("RACES"))));
        }

        var responses = await Task.WhenAll(tasks);

        await AssertRaceInvariantAsync(responses, before.Version);
    }
}
