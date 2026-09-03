using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Authorization;

/// <summary>
/// Los hallazgos de la matriz de autorización (issue #417): cada uno reproduce el request exacto
/// (verbo, ruta, rol, body) que en <see cref="WriteEndpointMatrixTests"/> dio un status que el
/// contrato no promete, y afirma el que sí promete. Ya no quedan <c>Skip</c>: los issues #426 y
/// #427 se corrigieron y estos siete tests son la regresión que lo confirma.
/// </summary>
public class WriteEndpointFindingsTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid UnstaId = Guid.Parse("00000001-0000-4000-a000-000000000001");
    private static readonly Guid TudcsCareerId = Guid.Parse("00000002-0000-4000-a000-000000000003");
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211Id = Guid.Parse("00000004-0000-4000-a000-000000000012");

    private static string LongString => new('x', 10_000);

    private readonly RegisterApiFixture _fixture;

    public WriteEndpointFindingsTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"findings-admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    [Fact]
    public async Task Create_university_rejects_an_oversized_name()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PostAsJsonAsync(
            "/api/academic/universities",
            new { name = LongString, slug = $"uni-{Guid.NewGuid():N}", institutionalEmailDomains = new[] { "prueba.edu.ar" } });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertFieldErrorAsync(response, "Name");
    }

    [Fact]
    public async Task Update_university_rejects_an_oversized_name()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/universities/{UnstaId}",
            new { name = LongString, slug = "unsta", institutionalEmailDomains = new[] { "unsta.edu.ar" } });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertFieldErrorAsync(response, "Name");
    }

    [Fact]
    public async Task Create_subject_rejects_an_oversized_name()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{TudcsPlanId}/subjects",
            new
            {
                code = $"SUB{Guid.NewGuid():N}"[..6],
                name = LongString,
                yearInPlan = 1,
                termInYear = 1,
                termKind = "FourMonth",
                weeklyHours = 3,
                totalHours = 42,
                description = (string?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertFieldErrorAsync(response, "Name");
    }

    [Fact]
    public async Task Update_subject_rejects_an_oversized_name()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/subjects/{Subject211Id}",
            new
            {
                code = "211",
                name = LongString,
                yearInPlan = 2,
                termInYear = 1,
                termKind = "FourMonth",
                weeklyHours = 4,
                totalHours = 56,
                description = (string?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertFieldErrorAsync(response, "Name");
    }

    [Fact]
    public async Task Create_career_rejects_an_oversized_name()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{UnstaId}/careers",
            new
            {
                name = LongString,
                slug = $"carrera-{Guid.NewGuid():N}",
                shortName = (string?)null,
                code = (string?)null,
                degreeType = (string?)null,
                durationYears = (int?)null,
                cadence = (string?)null,
                description = (string?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertFieldErrorAsync(response, "Name");
    }

    [Fact]
    public async Task Update_career_rejects_an_oversized_name()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/careers/{TudcsCareerId}",
            new
            {
                name = LongString,
                slug = "tecnicatura-universitaria-en-desarrollo-y-calidad-de-software",
                shortName = (string?)null,
                code = (string?)null,
                degreeType = (string?)null,
                durationYears = (int?)null,
                cadence = (string?)null,
                description = (string?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertFieldErrorAsync(response, "Name");
    }

    [Fact]
    public async Task Register_rejects_an_empty_body()
    {
        using var anonymous = _fixture.Factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync("/api/identity/register", new { });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertFieldErrorAsync(response, "Email");
    }

    /// <summary>
    /// Un 400 solo no alcanza acá: sin esto, cualquier otra causa de 400 (o un 409 que algún día
    /// cambiara a 400) dejaría el test verde aunque el tope de longitud se rompiera de nuevo. La key
    /// es el <c>PropertyName</c> de FluentValidation tal cual (PascalCase, ej. "Name"), no la versión
    /// camelCase del body: así arman el diccionario tanto <c>RegisterUserEndpoint</c> como los
    /// endpoints de academic (<c>ex.Errors.GroupBy(e =&gt; e.PropertyName)</c>).
    /// </summary>
    private static async Task AssertFieldErrorAsync(HttpResponseMessage response, string field)
    {
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("errors").GetProperty(field).GetArrayLength().ShouldBeGreaterThan(0);
    }
}
