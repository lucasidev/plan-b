using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del admin CRUD de períodos lectivos (US-064). Cubren el wiring HTTP +
/// persistencia + el gating por rol Admin (RequireRole contra el claim del JWT), mismo patrón que
/// <see cref="AdminCareersEndpointTests"/>.
///
/// <para>
/// Los períodos cuelgan de una University real (parent-existence, sin FK cross-schema: ADR-0017).
/// Usamos la UNSTA sembrada por <c>AcademicSeeder</c> (arranca en Development, el environment de
/// <see cref="RegisterApiFixture"/>) como padre. El seed ya trae terms cuatrimestrales UNSTA para
/// 2024-2026 (<c>AcademicSeedData.AcademicTerms</c>); estos tests usan años bien alejados (2037+)
/// para no colisionar con esos ni entre sí (los tests de esta clase comparten DB vía el class
/// fixture, igual que <see cref="AdminCareersEndpointTests"/>).
/// </para>
/// </summary>
public class AdminAcademicTermsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public AdminAcademicTermsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static object NewTermBody(
        int year, int number = 1, string? kind = "Cuatrimestral",
        DateOnly? startDate = null, DateOnly? endDate = null,
        DateTimeOffset? enrollmentOpens = null, DateTimeOffset? enrollmentCloses = null) =>
        new
        {
            year,
            number,
            kind,
            startDate = startDate ?? new DateOnly(year, 3, 1),
            endDate = endDate ?? new DateOnly(year, 7, 1),
            enrollmentOpens = enrollmentOpens ?? new DateTimeOffset(year, 2, 1, 0, 0, 0, TimeSpan.Zero),
            enrollmentCloses = enrollmentCloses ?? new DateTimeOffset(year, 2, 20, 0, 0, 0, TimeSpan.Zero),
        };

    [Fact]
    public async Task Admin_creates_term_and_it_appears_in_the_admin_list_with_computed_label()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms",
            NewTermBody(year: 2040, number: 1, kind: "Cuatrimestral"));
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var list = await admin.Client.GetFromJsonAsync<ListDto>(
            $"/api/academic/universities/{Unsta}/terms");
        var row = list!.Items.SingleOrDefault(t => t.Id == created!.Id);
        row.ShouldNotBeNull();
        row.Year.ShouldBe(2040);
        row.Number.ShouldBe(1);
        row.Kind.ShouldBe("Cuatrimestral");
        row.Label.ShouldBe("2040-C1");

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/academic-terms/{created!.Id}");
        detail!.UniversityId.ShouldBe(Unsta);
        detail.Year.ShouldBe(2040);
        detail.Number.ShouldBe(1);
        detail.Kind.ShouldBe("Cuatrimestral");
        detail.Label.ShouldBe("2040-C1");
    }

    [Fact]
    public async Task Create_computes_label_for_anual_kind()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms",
            NewTermBody(year: 2041, number: 1, kind: "Anual"));
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/academic-terms/{created!.Id}");
        detail!.Label.ShouldBe("2041");
    }

    [Fact]
    public async Task Create_accepts_enrollment_window_with_non_utc_offset()
    {
        // El datetime-local del form admin llega sin offset y System.Text.Json le pega el huso local
        // del proceso (ej. -03:00 en Argentina). Postgres timestamptz solo acepta offset 0: el
        // endpoint reinterpreta la hora como UTC (AsUtc) para no reventar con "Cannot write
        // DateTimeOffset with Offset=-03:00 to timestamp with time zone". Sin el fix, esto da 500.
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms",
            NewTermBody(
                year: 2043,
                enrollmentOpens: new DateTimeOffset(2043, 2, 1, 0, 0, 0, TimeSpan.FromHours(-3)),
                enrollmentCloses: new DateTimeOffset(2043, 2, 20, 0, 0, 0, TimeSpan.FromHours(-3))));

        create.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_with_duplicate_university_year_number_kind_returns_409()
    {
        var admin = await AdminAsync();

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/universities/{Unsta}/terms", NewTermBody(year: 2042)))
            .EnsureSuccessStatusCode();

        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms", NewTermBody(year: 2042));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.term.already_exists");
    }

    [Fact]
    public async Task Create_with_end_date_before_start_date_returns_400()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms",
            NewTermBody(
                year: 2043,
                startDate: new DateOnly(2043, 7, 1),
                endDate: new DateOnly(2043, 3, 1))); // invertida

        create.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.term.dates_inverted");
    }

    [Fact]
    public async Task Create_with_invalid_kind_returns_400()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms",
            NewTermBody(year: 2044, kind: "Trimestral"));

        create.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.term.invalid_kind");
    }

    [Fact]
    public async Task Create_with_year_out_of_range_returns_400()
    {
        var admin = await AdminAsync();
        var farFutureYear = DateTimeOffset.UtcNow.Year + 21; // > current + 20: el dominio lo rechaza

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms", NewTermBody(year: farFutureYear));

        create.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.term.year_out_of_range");
    }

    [Fact]
    public async Task Create_with_unknown_university_returns_404()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Guid.NewGuid()}/terms", NewTermBody(year: 2045));

        create.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.term.university_not_found");
    }

    [Fact]
    public async Task Admin_updates_term_and_recomputes_label()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms",
            NewTermBody(year: 2046, number: 1, kind: "Cuatrimestral"));
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/academic-terms/{created!.Id}",
            NewTermBody(year: 2046, number: 2, kind: "Cuatrimestral"));
        update.StatusCode.ShouldBe(HttpStatusCode.OK);

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/academic-terms/{created.Id}");
        detail!.Number.ShouldBe(2);
        detail.Label.ShouldBe("2046-C2");
    }

    [Fact]
    public async Task Update_with_year_number_kind_of_another_term_returns_409()
    {
        var admin = await AdminAsync();

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/universities/{Unsta}/terms",
                NewTermBody(year: 2039, number: 1, kind: "Cuatrimestral")))
            .EnsureSuccessStatusCode();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms",
            NewTermBody(year: 2039, number: 2, kind: "Cuatrimestral"));
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/academic-terms/{created!.Id}",
            NewTermBody(year: 2039, number: 1, kind: "Cuatrimestral"));

        update.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await update.Content.ReadAsStringAsync())
            .ShouldContain("academic.term.already_exists");
    }

    [Fact]
    public async Task Member_cannot_create_term_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var create = await member.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms", NewTermBody(year: 2038));

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_create_term_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var create = await anon.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/terms", NewTermBody(year: 2037));

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record CreatedDto(Guid Id);
    private sealed record ListDto(IReadOnlyList<AdminTermRow> Items);
    private sealed record AdminTermRow(
        Guid Id, int Year, int Number, string Kind, string Label,
        DateOnly StartDate, DateOnly EndDate);
    private sealed record DetailDto(
        Guid Id, Guid UniversityId, int Year, int Number, string Kind,
        DateOnly StartDate, DateOnly EndDate,
        DateTimeOffset EnrollmentOpens, DateTimeOffset EnrollmentCloses,
        string Label, DateTimeOffset CreatedAt);
}
