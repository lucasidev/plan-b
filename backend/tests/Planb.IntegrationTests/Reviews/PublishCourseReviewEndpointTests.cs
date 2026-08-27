using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.PublishCourseReview;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>POST /api/reviews/cursadas</c> (US-146, ADR-0082): reseñar una cursada
/// del modelo vigente, contra la base real.
///
/// <para>
/// Lo que cubre y el E2E no puede: los rechazos. El browser solo recorre el camino feliz porque la
/// pantalla no ofrece materias inexistentes ni cátedras de otra materia; acá se prueban esos casos
/// pegándole al endpoint directo, que es la única defensa real (el guard del frontend es UX).
/// </para>
///
/// <para>
/// El corpus lo siembra <c>CatalogSeedHostedService</c> al arrancar la app, con ids determinísticos
/// (prefijo 00000010 para ítems, 00000011 para instrumentos, ADR-0058). Los tests resuelven por
/// código de ítem, que es la identidad semántica y no cambia mientras el ítem signifique lo mismo.
/// </para>
/// </summary>
public class PublishCourseReviewEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    // Seed determinístico compartido con los tests de Academic.
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // 211 Fundamentos de Control de Calidad: la materia que tiene cátedras sembradas.
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");

    // 101, sin cátedras: sirve para probar que una cátedra de OTRA materia no pasa.
    private static readonly Guid Subject101 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");

    private static readonly Guid Term2025_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000003");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");

    public PublishCourseReviewEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private async Task<AuthenticatedClient> SetupStudentAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"course-review-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary>Id de una cátedra real de 211, resuelta del catálogo público.</summary>
    private async Task<Guid> FirstChairOfSubject211Async(HttpClient client)
    {
        var response = await client.GetAsync($"/api/academic/subjects/{Subject211}/chairs");
        response.EnsureSuccessStatusCode();
        var chairs = await response.Content.ReadFromJsonAsync<List<ChairIdDto>>();
        chairs.ShouldNotBeNull();
        chairs!.ShouldNotBeEmpty();
        return chairs[0].Id;
    }

    private static object BodyWith(
        Guid subjectId,
        Guid termId,
        Guid? chairId,
        params (string Code, short Value)[] answers) =>
        new
        {
            subjectId,
            termId,
            chairId,
            answers = answers.Select(a => new { itemCode = a.Code, optionValue = a.Value }),
            freeText = (string?)null,
        };

    [Fact]
    public async Task Publish_with_three_of_fourteen_items_answered_creates_the_review()
    {
        var auth = await SetupStudentAsync("happy");
        var chairId = await FirstChairOfSubject211Async(auth.Client);

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(
                Subject211,
                Term2025_1c,
                chairId,
                ("COURSE_OUTCOME", 2),
                ("CHAIR_CLASSES_HELD", 3),
                ("CHAIR_ANSWERS_IN_CLASS", 3)));

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<PublishCourseReviewResponse>();
        body.ShouldNotBeNull();
        body!.Id.ShouldNotBe(Guid.Empty);

        // Saltear no deja fila: los once ítems no contestados no entran en ningún denominador.
        body.AnsweredItems.ShouldBe(3);
    }

    [Fact]
    public async Task Publish_without_a_chair_is_valid_because_not_remembering_is_an_answer()
    {
        var auth = await SetupStudentAsync("nochair");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject211, Term2025_1c, null, ("COURSE_OUTCOME", 1)));

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Publish_twice_for_the_same_cursada_conflicts()
    {
        var auth = await SetupStudentAsync("twice");
        var chairId = await FirstChairOfSubject211Async(auth.Client);

        var first = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject211, Term2026_1c, chairId, ("COURSE_OUTCOME", 1)));
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        // Una voz por cuenta, materia y período: cambiar la cátedra no la hace otra cursada.
        var second = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject211, Term2026_1c, null, ("COURSE_OUTCOME", 3)));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Publish_with_a_chair_from_another_subject_is_rejected()
    {
        var auth = await SetupStudentAsync("wrongchair");
        var chairOf211 = await FirstChairOfSubject211Async(auth.Client);

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject101, Term2025_1c, chairOf211, ("COURSE_OUTCOME", 1)));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Publish_for_an_unknown_subject_is_not_found()
    {
        var auth = await SetupStudentAsync("nosubject");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Guid.NewGuid(), Term2025_1c, null, ("COURSE_OUTCOME", 1)));

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Publish_for_an_unknown_term_is_not_found()
    {
        var auth = await SetupStudentAsync("noterm");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject211, Guid.NewGuid(), null, ("COURSE_OUTCOME", 1)));

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Publish_with_an_item_outside_the_instrument_is_rejected()
    {
        var auth = await SetupStudentAsync("noitem");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject211, Term2025_1c, null, ("NOT_AN_ITEM", 1)));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Publish_with_an_option_that_does_not_belong_to_the_item_is_rejected()
    {
        var auth = await SetupStudentAsync("nooption");

        // COURSE_OUTCOME tiene cuatro opciones (1..4). La 9 no existe.
        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject211, Term2025_1c, null, ("COURSE_OUTCOME", 9)));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Publish_without_answering_anything_is_rejected()
    {
        var auth = await SetupStudentAsync("empty");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject211, Term2025_1c, null));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Publish_without_a_session_is_unauthorized()
    {
        var anonymous = _fixture.Factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync(
            "/api/reviews/cursadas",
            BodyWith(Subject211, Term2025_1c, null, ("COURSE_OUTCOME", 1)));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record ChairIdDto(Guid Id, string Name);
}
