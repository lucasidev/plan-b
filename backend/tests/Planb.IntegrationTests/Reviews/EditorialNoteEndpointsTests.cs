using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.CareerFacts;
using Planb.Reviews.Application.Features.Curation;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de las notas del equipo (ADR-0084): la segunda salida del campo libre.
///
/// <para>
/// Lo que se prueba acá y no en un unit: que la nota llegue a la ficha de su carrera, que es su
/// única razón de existir. Una nota que se guarda y no se lee no contextualiza nada.
/// </para>
/// </summary>
public class EditorialNoteEndpointsTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    // TUDCS en UNSTA, la carrera del seed.
    private static readonly Guid TudcsCareerId = Guid.Parse("00000002-0000-4000-a000-000000000003");

    public EditorialNoteEndpointsTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"notes-{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private async Task<GetCareerFactsResponse> FactsAsync()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/careers/{TudcsCareerId}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var facts = await response.Content.ReadFromJsonAsync<GetCareerFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    private async Task<PublishEditorialNoteResponse> PublishAsync(
        AuthenticatedClient admin, string text)
    {
        var response = await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/careers/{TudcsCareerId}/notes", new { text });
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<PublishEditorialNoteResponse>();
        created.ShouldNotBeNull();
        return created!;
    }

    [Fact]
    public async Task Publishing_a_note_requires_the_admin_role()
    {
        var body = new { text = "Una síntesis." };

        (await _anonymous.PostAsJsonAsync(
            $"/api/reviews/curation/careers/{TudcsCareerId}/notes", body))
            .StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"notes-member-{Guid.NewGuid():N}@planb.local");
        (await member.Client.PostAsJsonAsync(
            $"/api/reviews/curation/careers/{TudcsCareerId}/notes", body))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    /// <summary>
    /// La nota llega a la ficha de su carrera, que se lee sin cuenta: la síntesis se publica, y el
    /// texto del que salió no.
    /// </summary>
    [Fact]
    public async Task The_note_reaches_the_career_ficha_and_is_read_without_an_account()
    {
        var text = $"Varias cursadas mencionan que no se sabe con qué se rinde {Guid.NewGuid():N}";
        var admin = await AdminAsync();
        var created = await PublishAsync(admin, text);

        var facts = await FactsAsync();
        var note = facts.EditorialNotes.Single(n => n.Id == created.Id);

        note.Text.ShouldBe(text);
        note.PublishedAt.ShouldBe(created.PublishedAt, TimeSpan.FromSeconds(1));
    }

    /// <summary>
    /// La nota no dice quién la escribió: la firma el equipo, y publicar el autor invitaría a
    /// discutir la firma en vez del dato. Se mira el JSON crudo, no el DTO.
    /// </summary>
    [Fact]
    public async Task The_note_carries_no_author()
    {
        var admin = await AdminAsync();
        await PublishAsync(admin, $"Sin firma {Guid.NewGuid():N}");

        var response = await _anonymous.GetAsync($"/api/reviews/careers/{TudcsCareerId}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();

        body.ShouldNotContain("author", Case.Insensitive);
        body.ShouldNotContain(admin.UserId.Value.ToString());
    }

    /// <summary>
    /// Retirarla la saca de la ficha sin borrarla, y retirarla dos veces es un error: la segunda
    /// vez quien lo pide cree estar haciendo algo que ya está hecho.
    /// </summary>
    [Fact]
    public async Task Withdrawing_takes_it_off_the_ficha_and_cannot_be_done_twice()
    {
        var admin = await AdminAsync();
        var created = await PublishAsync(admin, $"Se retira {Guid.NewGuid():N}");

        (await FactsAsync()).EditorialNotes.ShouldContain(n => n.Id == created.Id);

        var withdrawn = await admin.Client.PostAsync(
            $"/api/reviews/curation/notes/{created.Id}/withdraw", content: null);
        withdrawn.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        (await FactsAsync()).EditorialNotes.ShouldNotContain(n => n.Id == created.Id);

        var again = await admin.Client.PostAsync(
            $"/api/reviews/curation/notes/{created.Id}/withdraw", content: null);
        again.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    /// <summary>
    /// No hay FK cross-schema (ADR-0017), así que una nota colgada de una carrera inventada se
    /// guardaría sin ruido y no aparecería en ninguna ficha. Lo ataja el application layer.
    /// </summary>
    [Fact]
    public async Task A_note_on_a_career_that_does_not_exist_is_not_found()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/careers/{Guid.NewGuid()}/notes",
            new { text = "Sobre una carrera que no existe." });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
