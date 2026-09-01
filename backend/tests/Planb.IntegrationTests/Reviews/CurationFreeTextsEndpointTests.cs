using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Identity.Domain.Users;
using Planb.Reviews.Application.Features.Curation;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/curation/free-texts</c> (ADR-0084): el campo libre para
/// que el equipo lo lea.
///
/// <para>
/// Lo que se prueba acá y no en un unit: que el gate de rol sea real, y sobre todo que
/// <b>la respuesta no contenga la cuenta de quien escribió</b>. Esa es la promesa que el producto
/// le hace a quien escribe, y la única forma de verificarla es mirar lo que sale por el cable.
/// </para>
/// </summary>
public class CurationFreeTextsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid TermA = Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");

    public CurationFreeTextsEndpointTests(RegisterApiFixture fixture) => _fixture = fixture;

    private async Task<AuthenticatedClient> StudentAsync()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"curation-{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"curation-admin-{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static async Task WriteAsync(
        AuthenticatedClient auth, Guid subjectId, Guid termId, string? freeText)
    {
        var published = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId,
                termId,
                chairId = (Guid?)ChairPerez,
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = 1 } },
                freeText,
            });
        published.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Reading_the_free_text_requires_the_admin_role()
    {
        var anonymous = _fixture.Factory.CreateClient();
        (await anonymous.GetAsync("/api/reviews/curation/free-texts"))
            .StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        var student = await StudentAsync();
        (await student.Client.GetAsync("/api/reviews/curation/free-texts"))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    /// <summary>
    /// El texto llega con lo que hace falta para leerlo bien, que es de qué cursada salió. Sin ese
    /// contexto, "no se entendía nada" no dice de qué.
    /// </summary>
    [Fact]
    public async Task The_text_arrives_with_the_cursada_it_came_from()
    {
        var student = await StudentAsync();
        var written = $"Lo que escribió alguien {Guid.NewGuid():N}";
        await WriteAsync(student, Subject211, TermA, written);

        var admin = await AdminAsync();
        var response = await admin.Client.GetAsync("/api/reviews/curation/free-texts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var view = await response.Content.ReadFromJsonAsync<FreeTextsView>();
        var item = view!.Items.Single(i => i.Text == written);

        item.SubjectName.ShouldNotBeNullOrWhiteSpace();
        item.TermLabel.ShouldNotBeNullOrWhiteSpace();
        item.ChairName.ShouldNotBeNullOrWhiteSpace();
    }

    /// <summary>
    /// El test que más importa: <b>la cuenta de quien escribió no viaja</b>. Se mira el JSON crudo
    /// y no el DTO, porque un campo agregado de más aparece ahí aunque el record no lo declare.
    /// </summary>
    [Fact]
    public async Task The_account_that_wrote_it_never_travels()
    {
        var student = await StudentAsync();
        await WriteAsync(student, Subject211, TermA, $"Texto {Guid.NewGuid():N}");

        var admin = await AdminAsync();
        var response = await admin.Client.GetAsync("/api/reviews/curation/free-texts");

        // El status se chequea antes del body: sin esto, un 500 pasa el test porque su mensaje de
        // error tampoco contiene la cuenta. Pasó de verdad mientras se escribía esto.
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();

        body.ShouldNotContain("accountId", Case.Insensitive);
        body.ShouldNotContain("account_id", Case.Insensitive);
        body.ShouldNotContain(student.UserId.Value.ToString());
    }

    /// <summary>
    /// El campo es opcional al reseñar, así que la mayoría de las filas no tiene ninguno: la
    /// curaduría lee textos, no reseñas vacías.
    /// </summary>
    [Fact]
    public async Task A_review_without_free_text_is_not_something_to_read()
    {
        var admin = await AdminAsync();
        var first = await admin.Client.GetAsync("/api/reviews/curation/free-texts");
        first.StatusCode.ShouldBe(HttpStatusCode.OK);
        var before = await first.Content.ReadFromJsonAsync<FreeTextsView>();

        var student = await StudentAsync();
        await WriteAsync(student, Subject211, TermA, freeText: null);

        var second = await admin.Client.GetAsync("/api/reviews/curation/free-texts");
        second.StatusCode.ShouldBe(HttpStatusCode.OK);
        var after = await second.Content.ReadFromJsonAsync<FreeTextsView>();

        after!.Total.ShouldBe(before!.Total);
    }
}
