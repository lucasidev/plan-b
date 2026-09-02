using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.Curation;
using Planb.Reviews.Domain.Reviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de curar el catálogo de frases (US-198).
///
/// <para>
/// Lo que se prueba acá y no en un unit: que los dos caminos tengan efectos distintos sobre el
/// cuestionario vigente. Editar NO publica una versión nueva (la pregunta sigue siendo la misma) y
/// abrir un código nuevo SÍ, poniendo al sucesor en el lugar del que reemplaza y retirando al
/// viejo, todo en una sola operación. Ese contraste solo se ve con la base y el instrumento reales.
/// </para>
/// </summary>
public class ItemCatalogEndpointsTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    public ItemCatalogEndpointsTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    /// <summary>
    /// Quien cura, con su mail a mano: US-198 pide que el cambio quede atribuido, y el mail es lo
    /// único con lo que el test puede verificar que el autor guardado es esta cuenta y no otra.
    /// </summary>
    private sealed record Curator(AuthenticatedClient Session, string Email)
    {
        public HttpClient Client => Session.Client;
    }

    private async Task<Curator> AdminAsync()
    {
        var email = $"items-{Guid.NewGuid():N}@planb.local";
        var session = await AuthenticatedClient.CreateAsync(_fixture, email, role: UserRole.Admin);
        return new Curator(session, email);
    }

    /// <summary>
    /// Un código nuevo para cada test. En mayúsculas porque el dominio lo normaliza así, y comparar
    /// contra el original haría fallar al test por una diferencia que es correcta.
    /// </summary>
    private static string FreshCode(string prefix) =>
        $"{prefix}_{Guid.NewGuid():N}"[..20].ToUpperInvariant();

    private static object NewItemBody(string code) => new
    {
        code,
        text = "¿Avisaba con tiempo cuando cambiaba una fecha?",
        help = (string?)null,
        layer = "ChairConduct",
        subject = "Chair",
        options = new[]
        {
            new { value = (short)1, order = (short)1, label = "Sí", valence = "Positive" },
            new { value = (short)2, order = (short)2, label = "No", valence = "Negative" },
        },
    };

    /// <summary>Siembra una frase propia del test, para no curar las del catálogo compartido.</summary>
    private static async Task<CatalogItemResponse> SeedItemAsync(Curator admin)
    {
        var code = FreshCode("CURATE");
        var created = await admin.Client.PostAsJsonAsync(
            "/api/reviews/curation/items", NewItemBody(code));
        created.StatusCode.ShouldBe(HttpStatusCode.Created);

        var catalog = await CatalogAsync(admin);
        return catalog.Single(i => i.Code == code);
    }

    private static async Task<IReadOnlyList<CatalogItemResponse>> CatalogAsync(Curator admin)
    {
        var response = await admin.Client.GetAsync("/api/reviews/curation/items");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<GetItemsResponse>();
        body.ShouldNotBeNull();
        return body!.Items;
    }

    private async Task<CurrentInstrumentView> InstrumentAsync()
    {
        var response = await _anonymous.GetAsync("/api/reviews/instrument");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var view = await response.Content.ReadFromJsonAsync<CurrentInstrumentView>();
        view.ShouldNotBeNull();
        return view!;
    }

    private static object EditBody(string text) => new
    {
        text,
        help = (string?)null,
        layer = "ChairConduct",
        options = new[]
        {
            new { value = (short)1, order = (short)1, label = "Sí", valence = "Positive" },
            new { value = (short)2, order = (short)2, label = "No", valence = "Negative" },
        },
    };

    private static object SupersedeBody(string code, string text) => new
    {
        code,
        text,
        help = (string?)null,
        layer = "ChairConduct",
        options = new[]
        {
            new { value = (short)1, order = (short)1, label = "Sí", valence = "Positive" },
            new { value = (short)2, order = (short)2, label = "No", valence = "Negative" },
        },
    };

    // -------------------------------------------------------------------
    // El gate
    // -------------------------------------------------------------------

    [Fact]
    public async Task Curating_the_catalogue_requires_the_admin_role()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"items-member-{Guid.NewGuid():N}@planb.local");
        var id = Guid.NewGuid();

        (await _anonymous.GetAsync("/api/reviews/curation/items"))
            .StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await member.Client.GetAsync("/api/reviews/curation/items"))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);

        (await member.Client.PutAsJsonAsync($"/api/reviews/curation/items/{id}", EditBody("x")))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await member.Client.PostAsJsonAsync(
                $"/api/reviews/curation/items/{id}/supersede", SupersedeBody("X", "x")))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    // -------------------------------------------------------------------
    // E1: editar en un solo lugar, sin cortar la serie
    // -------------------------------------------------------------------

    /// <summary>
    /// US-198 E1: el cambio se guarda, la frase conserva su código, y queda el registro de quién y
    /// cuándo. El autor es la cuenta que mandó el request, nunca algo que venga en el body.
    /// </summary>
    [Fact]
    public async Task Editing_keeps_the_code_and_records_who_changed_it()
    {
        var admin = await AdminAsync();
        var item = await SeedItemAsync(admin);

        var response = await admin.Client.PutAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}",
            EditBody("¿Avisaba con tiempo cuando se cambiaba una fecha de parcial?"));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var edited = (await CatalogAsync(admin)).Single(i => i.Id == item.Id);
        edited.Text.ShouldBe("¿Avisaba con tiempo cuando se cambiaba una fecha de parcial?");
        edited.Code.ShouldBe(item.Code);
        edited.IsActive.ShouldBeTrue();
        edited.LastChangedBy.ShouldBe(admin.Email);
        edited.UpdatedAt.ShouldBeGreaterThan(item.UpdatedAt);
    }

    /// <summary>
    /// Y el cuestionario no se toca: la pregunta sigue siendo la misma, así que declarar una
    /// versión nueva sería declarar un corte que no pasó.
    /// </summary>
    [Fact]
    public async Task Editing_does_not_publish_a_new_instrument_version()
    {
        var admin = await AdminAsync();
        var item = await SeedItemAsync(admin);
        var before = await InstrumentAsync();

        await admin.Client.PutAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}", EditBody("Otra redacción de lo mismo"));

        (await InstrumentAsync()).Version.ShouldBe(before.Version);
    }

    /// <summary>US-198 E1: la capa se edita en el mismo lugar que el texto y las opciones.</summary>
    [Fact]
    public async Task Editing_can_move_the_item_to_another_layer()
    {
        var admin = await AdminAsync();
        var item = await SeedItemAsync(admin);

        var response = await admin.Client.PutAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}",
            new
            {
                text = item.Text,
                help = (string?)null,
                layer = "StudentExperience",
                options = new[]
                {
                    new { value = (short)1, order = (short)1, label = "Sí", valence = "Positive" },
                    new { value = (short)2, order = (short)2, label = "No", valence = "Negative" },
                },
            });

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await CatalogAsync(admin)).Single(i => i.Id == item.Id).Layer.ShouldBe("StudentExperience");
    }

    [Fact]
    public async Task Editing_an_item_that_does_not_exist_is_a_404()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PutAsJsonAsync(
            $"/api/reviews/curation/items/{Guid.NewGuid()}", EditBody("x"));

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    // -------------------------------------------------------------------
    // E2: abrir un código nuevo corta la serie
    // -------------------------------------------------------------------

    /// <summary>
    /// US-198 E2: al confirmar, el viejo deja de ofrecerse, el nuevo arranca su propia serie, y el
    /// cuestionario publica una versión nueva. Todo junto, en una sola operación.
    /// </summary>
    [Fact]
    public async Task Superseding_retires_the_old_code_and_starts_a_new_series()
    {
        var admin = await AdminAsync();
        var item = await SeedItemAsync(admin);
        var before = await InstrumentAsync();
        var newCode = FreshCode("CUT");

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}/supersede",
            SupersedeBody(newCode, "¿Con cuánta anticipación avisaba un cambio de fecha?"));

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var cut = await response.Content.ReadFromJsonAsync<SupersedeItemResponse>();
        cut!.Code.ShouldBe(newCode);
        cut.SupersededCode.ShouldBe(item.Code);
        cut.InstrumentVersion.ShouldBe((short)(before.Version + 1));

        var catalog = await CatalogAsync(admin);
        var retired = catalog.Single(i => i.Id == item.Id);
        var successor = catalog.Single(i => i.Code == newCode);

        retired.IsActive.ShouldBeFalse();
        retired.RetiredAt.ShouldNotBeNull();
        retired.SupersededByCode.ShouldBe(newCode);

        successor.IsActive.ShouldBeTrue();
        successor.SupersedesCode.ShouldBe(item.Code);
        successor.AnswerCount.ShouldBe(0); // arranca su serie desde cero
    }

    /// <summary>
    /// El sucesor entra en el LUGAR del viejo, no al final. El orden del cuestionario es el orden en
    /// que se pregunta, y mandarlo al fondo cambiaría el recorrido de quien reseña por una razón
    /// que no tiene nada que ver con él.
    /// </summary>
    [Fact]
    public async Task The_successor_takes_the_place_of_the_item_it_replaces()
    {
        var admin = await AdminAsync();
        var item = await SeedItemAsync(admin);
        var before = await InstrumentAsync();
        var position = before.Items.Select(i => i.Code).ToList().IndexOf(item.Code);
        position.ShouldBeGreaterThanOrEqualTo(0);

        var newCode = FreshCode("PLACE");
        await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}/supersede",
            SupersedeBody(newCode, "La misma pregunta, hecha de otra manera"));

        var after = await InstrumentAsync();
        after.Items.Count.ShouldBe(before.Items.Count);
        after.Items.Select(i => i.Code).ToList().IndexOf(newCode).ShouldBe(position);
        after.Items.Select(i => i.Code).ShouldNotContain(item.Code);
    }

    /// <summary>
    /// US-198 E2 y edge de la frase nueva sin voces: la frase retirada conserva lo suyo. Acá no había
    /// nada respondido, así que no hay serie que cortar, pero el código igual se abre y el viejo
    /// igual se retira: el corte es del catálogo, no de los datos de una cátedra.
    /// </summary>
    [Fact]
    public async Task Superseding_an_item_with_no_answers_still_opens_the_new_code()
    {
        var admin = await AdminAsync();
        var item = await SeedItemAsync(admin);
        item.AnswerCount.ShouldBe(0);

        var newCode = FreshCode("EMPTY");
        var response = await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}/supersede",
            SupersedeBody(newCode, "Sin nada que cortar, igual se abre"));

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var catalog = await CatalogAsync(admin);
        catalog.Single(i => i.Id == item.Id).AnswerCount.ShouldBe(0);
        catalog.Single(i => i.Code == newCode).SupersedesCode.ShouldBe(item.Code);
    }

    /// <summary>
    /// Un retirado no se edita: su texto es el enunciado bajo el que se respondió, y la ficha lo
    /// muestra al lado de esos conteos.
    /// </summary>
    [Fact]
    public async Task A_retired_item_cannot_be_edited_nor_superseded_again()
    {
        var admin = await AdminAsync();
        var item = await SeedItemAsync(admin);
        await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}/supersede",
            SupersedeBody(FreshCode("FIRST"), "El primer reemplazo"));

        (await admin.Client.PutAsJsonAsync(
                $"/api/reviews/curation/items/{item.Id}", EditBody("No debería entrar")))
            .StatusCode.ShouldBe(HttpStatusCode.Conflict);

        (await admin.Client.PostAsJsonAsync(
                $"/api/reviews/curation/items/{item.Id}/supersede",
                SupersedeBody(FreshCode("SECOND"), "Ni este")))
            .StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Superseding_with_a_code_that_already_exists_is_a_conflict()
    {
        var admin = await AdminAsync();
        var item = await SeedItemAsync(admin);
        var other = await SeedItemAsync(admin);

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/items/{item.Id}/supersede",
            SupersedeBody(other.Code, "Un código que ya está tomado"));

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    /// <summary>
    /// La tasa de finalización busca su frase por código, que es una constante del dominio. Abrirle
    /// uno nuevo dejaría a todas las fichas sin esa tasa, en silencio y sin que nada falle.
    /// </summary>
    [Fact]
    public async Task The_outcome_item_cannot_be_superseded()
    {
        var admin = await AdminAsync();
        var outcome = (await CatalogAsync(admin))
            .Single(i => i.Code == PublishingRules.OutcomeItemCode);

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/reviews/curation/items/{outcome.Id}/supersede",
            SupersedeBody(FreshCode("OUTCOME"), "Otra forma de preguntar cómo terminó"));

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await CatalogAsync(admin))
            .Single(i => i.Code == PublishingRules.OutcomeItemCode).IsActive.ShouldBeTrue();
    }

    // -------------------------------------------------------------------
    // E4: Método publica exactamente el catálogo
    // -------------------------------------------------------------------

    /// <summary>
    /// US-198 E4: lo que el cuestionario público ofrece son exactamente las frases activas del
    /// catálogo, sin ninguno de más ni de menos. Es la garantía de que curar acá cambia lo que se
    /// pregunta allá, y de que no hay una segunda lista en ningún lado.
    /// </summary>
    [Fact]
    public async Task The_public_instrument_offers_exactly_the_active_items_of_the_catalogue()
    {
        var admin = await AdminAsync();

        var active = (await CatalogAsync(admin))
            .Where(i => i.IsActive)
            .Select(i => i.Code)
            .OrderBy(c => c, StringComparer.Ordinal)
            .ToList();

        var offered = (await InstrumentAsync()).Items
            .Select(i => i.Code)
            .OrderBy(c => c, StringComparer.Ordinal)
            .ToList();

        offered.ShouldBe(active);
    }
}
