using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.Curation;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de destilar una pregunta del campo libre (ADR-0084).
///
/// <para>
/// Lo que se prueba acá y no en un unit: que el alta de la frase y la versión nueva del instrumento
/// sean <b>una sola operación</b>. Una frase que no entra a una versión no existe para nadie, porque
/// el instrumento es lo que la pantalla de reseñar ofrece y lo que Método publica.
/// </para>
/// </summary>
public class DistilItemEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    public DistilItemEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"distil-{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    /// <summary>
    /// Un código nuevo para cada test. En mayúsculas porque el dominio lo normaliza así, y comparar
    /// contra el original haría fallar al test por una diferencia que es correcta.
    /// </summary>
    private static string FreshCode(string prefix) =>
        $"{prefix}_{Guid.NewGuid():N}"[..20].ToUpperInvariant();

    private static object Body(string code) => new
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

    private async Task<CurrentInstrumentView> InstrumentAsync()
    {
        var response = await _anonymous.GetAsync("/api/reviews/instrument");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var view = await response.Content.ReadFromJsonAsync<CurrentInstrumentView>();
        view.ShouldNotBeNull();
        return view!;
    }

    [Fact]
    public async Task Distilling_requires_the_admin_role()
    {
        var code = FreshCode("PROBE");

        (await _anonymous.PostAsJsonAsync("/api/reviews/curation/items", Body(code)))
            .StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"distil-member-{Guid.NewGuid():N}@planb.local");
        (await member.Client.PostAsJsonAsync("/api/reviews/curation/items", Body(code)))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    /// <summary>
    /// El corazón: la pregunta entra al instrumento como versión nueva, y la anterior se cierra.
    /// Lo que la pantalla de reseñar ofrece pasa a ser lo de antes más esta.
    /// </summary>
    [Fact]
    public async Task Distilling_publishes_a_new_version_that_offers_the_question()
    {
        var before = await InstrumentAsync();
        var code = FreshCode("DISTIL");

        var admin = await AdminAsync();
        var response = await admin.Client.PostAsJsonAsync("/api/reviews/curation/items", Body(code));
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<DistilItemResponse>();
        created!.Code.ShouldBe(code);
        created.InstrumentVersion.ShouldBe((short)(before.Version + 1));

        // Y es lo que ofrece el cuestionario vigente: lo de antes, más esta, sin perder ninguna.
        var after = await InstrumentAsync();
        after.Version.ShouldBe(created.InstrumentVersion);
        after.Items.Count.ShouldBe(before.Items.Count + 1);
        after.Items.Select(i => i.Code).ShouldContain(code);
        foreach (var previous in before.Items)
        {
            after.Items.Select(i => i.Code).ShouldContain(previous.Code);
        }
    }

    /// <summary>
    /// La marca que Método publica: la destilada dice que salió del campo libre, y las que
    /// escribimos nosotros siguen diciendo que son semilla.
    /// </summary>
    [Fact]
    public async Task The_distilled_question_is_marked_and_the_seeds_stay_seeds()
    {
        var code = FreshCode("MARKED");
        var admin = await AdminAsync();
        (await admin.Client.PostAsJsonAsync("/api/reviews/curation/items", Body(code)))
            .StatusCode.ShouldBe(HttpStatusCode.Created);

        var instrument = await InstrumentAsync();

        instrument.Items.Single(i => i.Code == code).Origin.ShouldBe("Distilled");
        instrument.Items.Single(i => i.Code == "COURSE_OUTCOME").Origin.ShouldBe("Seed");
    }

    /// <summary>
    /// Dos preguntas no pueden compartir código: el código es la serie, y dos series con el mismo
    /// nombre son un conteo que nadie puede volver a armar.
    /// </summary>
    [Fact]
    public async Task Two_questions_cannot_share_a_code()
    {
        var code = FreshCode("TWICE");
        var admin = await AdminAsync();

        (await admin.Client.PostAsJsonAsync("/api/reviews/curation/items", Body(code)))
            .StatusCode.ShouldBe(HttpStatusCode.Created);

        var again = await admin.Client.PostAsJsonAsync("/api/reviews/curation/items", Body(code));
        again.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task An_unknown_layer_is_a_validation_error_and_not_a_crash()
    {
        var admin = await AdminAsync();
        var body = new
        {
            code = FreshCode("BADLAYER"),
            text = "¿Algo?",
            help = (string?)null,
            layer = "NoExiste",
            subject = "Chair",
            options = new[]
            {
                new { value = (short)1, order = (short)1, label = "Sí", valence = "Positive" },
                new { value = (short)2, order = (short)2, label = "No", valence = "Negative" },
            },
        };

        var response = await admin.Client.PostAsJsonAsync("/api/reviews/curation/items", body);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).ShouldContain("invalid_layer");
    }
}
