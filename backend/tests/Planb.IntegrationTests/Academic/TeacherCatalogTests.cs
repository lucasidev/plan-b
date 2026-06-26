using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Application.Contracts;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests para el read-side de docentes (US-063):
///   - GET /api/academic/teachers/{id}
///   - <see cref="IAcademicQueryService.GetTeacherByIdAsync"/> vía DI.
///
/// El seed del catálogo siembra 10 docentes UNSTA con ids determinísticos
/// (00000006-0000-4000-a000-0000000000NN), así que los tests resuelven por id sin crear data.
/// Los nombres se guardan en lowercase y el read los devuelve en title case (initcap), incluso
/// con acentos.
/// </summary>
public class TeacherCatalogTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public TeacherCatalogTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    private static readonly Guid UnstaId =
        Guid.Parse("00000001-0000-4000-a000-000000000001");

    // carlos brandt, Profesor Titular
    private static readonly Guid CarlosBrandtId =
        Guid.Parse("00000006-0000-4000-a000-000000000001");

    // verónica ledesma, Profesora Titular (caso con acento, valida initcap unicode-aware)
    private static readonly Guid VeronicaLedesmaId =
        Guid.Parse("00000006-0000-4000-a000-000000000009");

    [Fact]
    public async Task GetTeacher_returns_seeded_teacher_with_title_cased_names()
    {
        var response = await _client.GetAsync($"/api/academic/teachers/{CarlosBrandtId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var teacher = await response.Content.ReadFromJsonAsync<TeacherDetailItem>();
        teacher.ShouldNotBeNull();
        teacher!.Id.ShouldBe(CarlosBrandtId);
        teacher.UniversityId.ShouldBe(UnstaId);
        teacher.FirstName.ShouldBe("Carlos");
        teacher.LastName.ShouldBe("Brandt");
        teacher.Title.ShouldBe("Profesor Titular");
        teacher.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task GetTeacher_title_cases_accented_names()
    {
        var response = await _client.GetAsync($"/api/academic/teachers/{VeronicaLedesmaId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var teacher = await response.Content.ReadFromJsonAsync<TeacherDetailItem>();
        teacher.ShouldNotBeNull();
        teacher!.FirstName.ShouldBe("Verónica");
        teacher.LastName.ShouldBe("Ledesma");
    }

    [Fact]
    public async Task GetTeacher_returns_404_for_unknown_id()
    {
        var response = await _client.GetAsync($"/api/academic/teachers/{Guid.NewGuid()}");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetTeacherByIdAsync_returns_null_for_unknown_id()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var queries = scope.ServiceProvider.GetRequiredService<IAcademicQueryService>();

        var teacher = await queries.GetTeacherByIdAsync(Guid.NewGuid());

        teacher.ShouldBeNull();
    }
}
