using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests de <c>GET /api/academic/official-facts/by-subject-type</c> (ADR-0090): las
/// afirmaciones vigentes de todos los sujetos de un tipo, agrupadas por sujeto. Usa la UNSTA y la
/// UNT sembradas por <c>AcademicSeeder</c> como sujetos Institution.
/// </summary>
public class GetOfficialFactsBySubjectTypeEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");
    private static readonly Guid Unt = Guid.Parse("00000001-0000-4000-a000-000000000003");

    private readonly RegisterApiFixture _fixture;

    public GetOfficialFactsBySubjectTypeEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static object NewFactBody(Guid subjectId, string value, string sourceName, string relievedAt) =>
        new
        {
            subjectType = "Institution",
            subjectId,
            field = "admission_regime",
            status = "Published",
            value,
            unit = (string?)null,
            period = "2026",
            sourceName,
            sourceUrl = "https://example.edu.ar",
            sourceDocument = (string?)null,
            sourceRetrievedAt = "2026-01-01T00:00:00Z",
            derivationRuleId = (string?)null,
            note = (string?)null,
            relievedAt,
        };

    [Fact]
    public async Task Two_subjects_each_bring_their_own_current_fact_per_field()
    {
        // UNT junta dos afirmaciones del mismo campo (admission_regime, que ninguna de las dos
        // instituciones tiene sembrado): dentro de SU sujeto, gana la relevada después. UNSTA no
        // se toca, así que su institution_type sembrado sigue ahí y admission_regime no aparece.
        var admin = await AdminAsync();

        var older = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts",
            NewFactBody(Unt, "Presencial", "SIPES", "2026-01-01T00:00:00Z"));
        older.EnsureSuccessStatusCode();

        var newer = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts",
            NewFactBody(Unt, "Presencial y a distancia", "Sitio UNT", "2026-09-07T00:00:00Z"));
        newer.EnsureSuccessStatusCode();

        using var anon = _fixture.Factory.CreateClient();
        var read = await anon.GetFromJsonAsync<ReadDto>(
            "/api/academic/official-facts/by-subject-type?subjectType=Institution");

        var untSubject = read!.Subjects.Single(s => s.SubjectId == Unt);
        var untAdmission = untSubject.Facts.Single(f => f.Field == "admission_regime");
        untAdmission.Value.ShouldBe("Presencial y a distancia");
        untAdmission.SourceName.ShouldBe("Sitio UNT");
        untAdmission.SubjectId.ShouldBe(Unt);

        var unstaSubject = read.Subjects.Single(s => s.SubjectId == Unsta);
        unstaSubject.Facts.ShouldContain(f => f.Field == "institution_type");
        unstaSubject.Facts.ShouldNotContain(f => f.Field == "admission_regime");
    }

    private sealed record ReadDto(IReadOnlyList<SubjectDto> Subjects);
    private sealed record SubjectDto(Guid SubjectId, IReadOnlyList<FactDto> Facts);
    private sealed record FactDto(
        Guid Id, Guid SubjectId, string Field, string? Value, string? Unit, string? Period,
        string Status, string SourceName, string SourceUrl, string? SourceDocument,
        DateTimeOffset SourceRetrievedAt, string? DerivationRuleId, string? Note,
        DateTimeOffset RelievedAt);
}
