using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Planb.Academic.Application.Abstractions.Georef;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

public class UniversityProfileEndpointTests : IClassFixture<RegisterApiFixture>
{
    private const string FirstPng =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    private const string SecondPng =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==";

    private readonly RegisterApiFixture _fixture;

    public UniversityProfileEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    // US-234 E1: el administrador completa identidad, ubicación y logo; la lectura pública no requiere cuenta.
    [Fact]
    public async Task Admin_updates_profile_and_logo_and_anonymous_reader_gets_the_same_data()
    {
        var admin = await AdminAsync();
        var universityId = await CreateUniversityAsync(admin.Client);
        using var configured = CreateGeorefFactory();
        using var client = ClientWithCookies(configured, admin);

        (await client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/profile",
            new
            {
                websiteUrl = "https://universidad.example.edu.ar",
                address = "Av. Universidad 123",
                province = "Tucumán",
                localityText = "San Miguel de Tucumán",
            })).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/logo",
            new { pngBase64 = FirstPng })).StatusCode.ShouldBe(HttpStatusCode.OK);

        using var anonymous = _fixture.Factory.CreateClient();
        var profile = await anonymous.GetFromJsonAsync<ProfileDto>(
            $"/api/academic/universities/{universityId}/profile");
        profile!.WebsiteUrl.ShouldBe("https://universidad.example.edu.ar");
        profile.Address.ShouldBe("Av. Universidad 123");
        profile.Province.ShouldBe("Tucumán");
        profile.LocalityId.ShouldBe("locality-1");
        profile.LocalityName.ShouldBe("San Miguel de Tucumán");
        profile.LogoVersion.ShouldNotBeNull();

        var logo = await anonymous.GetAsync($"/api/academic/universities/{universityId}/logo");
        logo.StatusCode.ShouldBe(HttpStatusCode.OK);
        logo.Content.Headers.ContentType!.MediaType.ShouldBe("image/png");
        logo.Headers.GetValues("X-Content-Type-Options").Single().ShouldBe("nosniff");
        (await logo.Content.ReadAsByteArrayAsync()).ShouldBe(Convert.FromBase64String(FirstPng));
    }

    [Fact]
    public async Task Missing_profile_fields_do_not_clear_data_but_explicit_nulls_do()
    {
        var admin = await AdminAsync();
        var id = await CreateUniversityAsync(admin.Client);
        var path = $"/api/academic/universities/{id}/profile";
        (await admin.Client.PutAsJsonAsync(path, new
        {
            websiteUrl = "https://example.edu.ar",
            address = "Av. Central 100",
            province = (string?)null,
            localityText = (string?)null,
        })).StatusCode.ShouldBe(HttpStatusCode.OK);

        (await admin.Client.PutAsJsonAsync(path, new { })).StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await admin.Client.PutAsJsonAsync(path, new { websiteUrl = (string?)null }))
            .StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var unchanged = (await admin.Client.GetFromJsonAsync<ProfileDto>(path))!;
        unchanged.WebsiteUrl.ShouldBe("https://example.edu.ar");
        unchanged.Address.ShouldBe("Av. Central 100");

        (await admin.Client.PutAsJsonAsync(path, new
        {
            websiteUrl = (string?)null,
            address = (string?)null,
            province = (string?)null,
            localityText = (string?)null,
        })).StatusCode.ShouldBe(HttpStatusCode.OK);
        var cleared = (await admin.Client.GetFromJsonAsync<ProfileDto>(path))!;
        cleared.WebsiteUrl.ShouldBeNull();
        cleared.Address.ShouldBeNull();
    }

    // US-234 E2: los conteos reflejan unidades, carreras y planes sin multiplicar filas.
    [Fact]
    public async Task Public_profile_returns_exact_catalog_counts()
    {
        var admin = await AdminAsync();
        var universityId = await CreateUniversityAsync(admin.Client);
        using var configured = CreateGeorefFactory();
        using var client = ClientWithCookies(configured, admin);

        var unitResponse = await client.PostAsJsonAsync(
            $"/api/academic/universities/{universityId}/units",
            new
            {
                name = "Facultad de Ingeniería",
                slug = "ingenieria",
                address = "Av. Universidad 123",
                province = "Tucumán",
                localityText = "San Miguel de Tucumán",
            });
        unitResponse.StatusCode.ShouldBe(HttpStatusCode.Created);
        var unitId = (await unitResponse.Content.ReadFromJsonAsync<IdDto>())!.Id;

        var careerResponse = await client.PostAsJsonAsync(
            $"/api/academic/universities/{universityId}/careers",
            NewCareer());
        careerResponse.StatusCode.ShouldBe(HttpStatusCode.Created);
        var careerId = (await careerResponse.Content.ReadFromJsonAsync<IdDto>())!.Id;
        (await client.PutAsJsonAsync(
            $"/api/academic/careers/{careerId}/academic-unit",
            new { academicUnitId = unitId })).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await client.PostAsJsonAsync(
            $"/api/academic/careers/{careerId}/plans",
            new { year = 2026 })).StatusCode.ShouldBe(HttpStatusCode.Created);

        using var anonymous = _fixture.Factory.CreateClient();
        var profile = await anonymous.GetFromJsonAsync<ProfileDto>(
            $"/api/academic/universities/{universityId}/profile");
        profile!.AcademicUnitCount.ShouldBe(1);
        profile.CareerCount.ShouldBe(1);
        profile.PlanCount.ShouldBe(1);
        profile.Units.Single().CareerCount.ShouldBe(1);
    }

    // US-234 X1: los cambios de slug y logo conservan la identidad estable y versionan el recurso.
    [Fact]
    public async Task Updating_slug_and_logo_keeps_the_university_id_and_increments_logo_version()
    {
        var admin = await AdminAsync();
        var universityId = await CreateUniversityAsync(admin.Client);

        (await admin.Client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/logo",
            new { pngBase64 = FirstPng })).StatusCode.ShouldBe(HttpStatusCode.OK);
        using var anonymous = _fixture.Factory.CreateClient();
        var firstVersion = (await anonymous.GetFromJsonAsync<ProfileDto>(
            $"/api/academic/universities/{universityId}/profile"))!.LogoVersion;
        (await admin.Client.PatchAsJsonAsync(
            $"/api/academic/universities/{universityId}",
            new
            {
                name = "Universidad Renombrada",
                slug = "universidad-renombrada",
                institutionalEmailDomains = Array.Empty<string>(),
            })).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await admin.Client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/logo",
            new { pngBase64 = SecondPng })).StatusCode.ShouldBe(HttpStatusCode.OK);

        var profile = await anonymous.GetFromJsonAsync<ProfileDto>(
            $"/api/academic/universities/{universityId}/profile");
        profile!.UniversityId.ShouldBe(universityId);
        profile.Slug.ShouldBe("universidad-renombrada");
        profile.LogoVersion.ShouldNotBeNull();
        profile.LogoVersion.ShouldNotBe(firstVersion);
        (await anonymous.GetByteArrayAsync($"/api/academic/universities/{universityId}/logo"))
            .ShouldBe(Convert.FromBase64String(SecondPng));
    }

    // US-234 N3: ninguna mutación del perfil institucional acepta una cuenta Member.
    [Fact]
    public async Task Member_cannot_mutate_any_university_profile_resource()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture,
            $"member.{Guid.NewGuid():N}@planb.local");
        var universityId = Guid.NewGuid();
        var unitId = Guid.NewGuid();
        var careerId = Guid.NewGuid();

        var responses = new[]
        {
            await member.Client.PutAsJsonAsync(
                $"/api/academic/universities/{universityId}/profile",
                new { websiteUrl = "https://example.edu.ar", address = "A", province = (string?)null, localityText = (string?)null }),
            await member.Client.PutAsJsonAsync(
                $"/api/academic/universities/{universityId}/logo",
                new { pngBase64 = FirstPng }),
            await member.Client.PostAsJsonAsync(
                $"/api/academic/universities/{universityId}/units",
                new { name = "Unidad", slug = "unidad", address = "A", province = "Tucumán", localityText = "Capital" }),
            await member.Client.PutAsJsonAsync(
                $"/api/academic/universities/{universityId}/units/{unitId}",
                new { name = "Unidad", slug = "unidad", address = "A", province = "Tucumán", localityText = "Capital" }),
            await member.Client.PutAsJsonAsync(
                $"/api/academic/careers/{careerId}/academic-unit",
                new { academicUnitId = unitId }),
        };

        responses.Select(response => response.StatusCode).ShouldAllBe(status => status == HttpStatusCode.Forbidden);
    }

    // US-234 N2: URL, localidad y PNG inválidos se rechazan sin reemplazar el último estado válido.
    [Fact]
    public async Task Invalid_profile_inputs_do_not_replace_valid_profile_or_logo()
    {
        var admin = await AdminAsync();
        var universityId = await CreateUniversityAsync(admin.Client);
        using var configured = CreateGeorefFactory();
        using var client = ClientWithCookies(configured, admin);
        var validProfile = new
        {
            websiteUrl = "https://valid.example.edu.ar",
            address = "Domicilio válido",
            province = "Tucumán",
            localityText = "San Miguel de Tucumán",
        };
        (await client.PutAsJsonAsync($"/api/academic/universities/{universityId}/profile", validProfile))
            .EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/logo",
            new { pngBase64 = FirstPng })).EnsureSuccessStatusCode();

        (await client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/profile",
            new { websiteUrl = "javascript:alert(1)", address = "Otro", province = "Tucumán", localityText = "Capital" }))
            .StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/profile",
            new { websiteUrl = "https://other.example.edu.ar", address = "Otro", province = "Tucumán", localityText = "No existe" }))
            .StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/logo",
            new { pngBase64 = Convert.ToBase64String(Convert.FromBase64String(FirstPng)[..20]) }))
            .StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await client.PutAsJsonAsync(
            $"/api/academic/universities/{universityId}/logo",
            new { pngBase64 = Convert.ToBase64String(new byte[262145]) }))
            .StatusCode.ShouldBe(HttpStatusCode.BadRequest);

        using var anonymous = _fixture.Factory.CreateClient();
        var profile = await anonymous.GetFromJsonAsync<ProfileDto>(
            $"/api/academic/universities/{universityId}/profile");
        profile!.WebsiteUrl.ShouldBe(validProfile.websiteUrl);
        profile.Address.ShouldBe(validProfile.address);
        profile.LogoVersion.ShouldNotBeNull();
        (await anonymous.GetByteArrayAsync($"/api/academic/universities/{universityId}/logo"))
            .ShouldBe(Convert.FromBase64String(FirstPng));
    }

    // US-234 N1: una carrera no puede apuntar a una unidad de otra universidad.
    [Fact]
    public async Task Career_cannot_be_assigned_to_a_unit_from_another_university()
    {
        var admin = await AdminAsync();
        var firstUniversityId = await CreateUniversityAsync(admin.Client);
        var secondUniversityId = await CreateUniversityAsync(admin.Client);
        using var configured = CreateGeorefFactory();
        using var client = ClientWithCookies(configured, admin);

        var careerResponse = await client.PostAsJsonAsync(
            $"/api/academic/universities/{firstUniversityId}/careers",
            NewCareer());
        var careerId = (await careerResponse.Content.ReadFromJsonAsync<IdDto>())!.Id;
        var unitResponse = await client.PostAsJsonAsync(
            $"/api/academic/universities/{secondUniversityId}/units",
            new
            {
                name = "Facultad ajena",
                slug = "facultad-ajena",
                address = "A",
                province = "Tucumán",
                localityText = "Capital",
            });
        var unitId = (await unitResponse.Content.ReadFromJsonAsync<IdDto>())!.Id;

        var assignment = await client.PutAsJsonAsync(
            $"/api/academic/careers/{careerId}/academic-unit",
            new { academicUnitId = unitId });
        assignment.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var career = await db.Careers.AsNoTracking().SingleAsync(row => row.Id == new CareerId(careerId));
        career.AcademicUnitId.ShouldBeNull();
    }

    // US-234 N2: identificadores vacíos se traducen a 404 y nunca escapan como una excepción.
    [Fact]
    public async Task Empty_identifiers_do_not_produce_server_errors()
    {
        var admin = await AdminAsync();
        var universityId = await CreateUniversityAsync(admin.Client);
        var careerResponse = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{universityId}/careers",
            NewCareer());
        var careerId = (await careerResponse.Content.ReadFromJsonAsync<IdDto>())!.Id;

        var responses = new[]
        {
            await admin.Client.PostAsJsonAsync(
                $"/api/academic/universities/{Guid.Empty}/units",
                new { name = "Unidad", slug = "unidad", address = "A", province = "Tucumán", localityText = "Capital" }),
            await admin.Client.PutAsJsonAsync(
                $"/api/academic/universities/{universityId}/units/{Guid.Empty}",
                new { name = "Unidad", slug = "unidad", address = "A", province = "Tucumán", localityText = "Capital" }),
            await admin.Client.PutAsJsonAsync(
                $"/api/academic/careers/{Guid.Empty}/academic-unit",
                new { academicUnitId = (Guid?)null }),
            await admin.Client.PutAsJsonAsync(
                $"/api/academic/careers/{careerId}/academic-unit",
                new { academicUnitId = Guid.Empty }),
        };

        responses.Select(response => response.StatusCode)
            .ShouldAllBe(status => status == HttpStatusCode.NotFound);
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture,
            $"admin.{Guid.NewGuid():N}@planb.local",
            role: UserRole.Admin);

    private static object NewCareer()
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        return new
        {
            name = $"Carrera {unique}",
            slug = $"carrera-{unique}",
            shortName = (string?)null,
            code = (string?)null,
            degreeType = (string?)null,
            durationYears = (int?)null,
            cadence = (string?)null,
            description = (string?)null,
        };
    }

    private static object NewUniversity()
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        return new
        {
            name = $"Universidad {unique}",
            slug = $"universidad-{unique}",
            institutionalEmailDomains = Array.Empty<string>(),
        };
    }

    private static async Task<Guid> CreateUniversityAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/academic/universities", NewUniversity());
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<IdDto>())!.Id;
    }

    private WebApplicationFactory<Program> CreateGeorefFactory() =>
        _fixture.Factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IGeorefLocalityResolver>();
                services.AddSingleton<IGeorefLocalityResolver, TestGeoref>();
            }));

    private static HttpClient ClientWithCookies(
        WebApplicationFactory<Program> factory,
        AuthenticatedClient authenticated)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });
        client.DefaultRequestHeaders.Add(
            "Cookie",
            $"planb_session={authenticated.AccessCookie}; planb_refresh={authenticated.RefreshCookie}");
        return client;
    }

    private sealed class TestGeoref : IGeorefLocalityResolver
    {
        public Task<GeorefLocality?> ResolveAsync(
            string localityText,
            string province,
            CancellationToken ct = default) =>
            Task.FromResult<GeorefLocality?>(
                localityText == "No existe"
                    ? null
                    : new GeorefLocality("locality-1", localityText));
    }

    private sealed record IdDto(Guid Id);
    private sealed record ProfileDto(
        Guid UniversityId,
        string Name,
        string Slug,
        string? WebsiteUrl,
        string? Address,
        string? Province,
        string? LocalityId,
        string? LocalityName,
        int? LogoVersion,
        int AcademicUnitCount,
        int CareerCount,
        int PlanCount,
        IReadOnlyList<UnitDto> Units);
    private sealed record UnitDto(Guid Id, int CareerCount);
}
