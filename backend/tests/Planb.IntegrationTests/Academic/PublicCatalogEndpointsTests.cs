using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Academic.Infrastructure.Seeding;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests para los 3 endpoints públicos del catálogo Academic (US-037-b):
///   - GET /api/academic/universities
///   - GET /api/academic/careers?universityId=
///   - GET /api/academic/career-plans?careerId=
///
/// Usan el seed determinístico de <see cref="AcademicSeedData"/> que ya levantó el host
/// (RegisterApiFixture aplica el seeder al startup). No necesitan auth (catálogo público).
/// </summary>
public class PublicCatalogEndpointsTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public PublicCatalogEndpointsTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task ListUniversities_returns_200_with_all_seeded_universities()
    {
        var response = await _client.GetAsync("/api/academic/universities");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var unis = await response.Content.ReadFromJsonAsync<List<UniversityListItem>>();
        unis.ShouldNotBeNull();
        unis!.Count.ShouldBe(AcademicSeedData.Universities.Count);

        // El SQL incluye ORDER BY name ASC, pero el orden exacto depende del collation de
        // Postgres (case-insensitive en default UTF-8) y no del comparador C#. No chequeamos
        // orden exacto; chequeamos set-equality contra el seed.
        var seedIds = AcademicSeedData.Universities.Select(u => u.Id.Value).ToHashSet();
        unis.Select(u => u.Id).ShouldBe(seedIds, ignoreOrder: true);
    }

    [Fact]
    public async Task ListCareers_returns_only_careers_of_requested_university()
    {
        var unstaId = AcademicSeedData.Unsta.Id.Value;

        var response = await _client.GetAsync($"/api/academic/careers?universityId={unstaId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var careers = await response.Content.ReadFromJsonAsync<List<CareerListItem>>();
        careers.ShouldNotBeNull();
        careers!.ShouldNotBeEmpty();
        careers.ShouldAllBe(c => c.UniversityId == unstaId);

        // Match con el seed: 4 carreras de UNSTA (las primeras 4 en AcademicSeedData.Careers).
        var unstaSeedIds = AcademicSeedData.Careers
            .Where(c => c.Career.UniversityId == AcademicSeedData.Unsta.Id)
            .Select(c => c.Career.Id.Value)
            .ToHashSet();
        careers.Select(c => c.Id).ShouldBe(unstaSeedIds, ignoreOrder: true);
    }

    [Fact]
    public async Task ListCareers_returns_empty_for_unknown_university()
    {
        var unknownId = Guid.NewGuid();

        var response = await _client.GetAsync($"/api/academic/careers?universityId={unknownId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var careers = await response.Content.ReadFromJsonAsync<List<CareerListItem>>();
        careers.ShouldBeEmpty();
    }

    [Fact]
    public async Task ListCareers_returns_400_when_universityId_missing()
    {
        var response = await _client.GetAsync("/api/academic/careers");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ListCareerPlans_returns_only_plans_of_requested_career()
    {
        var tudcsCareerId = AcademicSeedData.Careers[2].Career.Id.Value; // TUDCS UNSTA

        var response = await _client.GetAsync(
            $"/api/academic/career-plans?careerId={tudcsCareerId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var plans = await response.Content.ReadFromJsonAsync<List<CareerPlanListItem>>();
        plans.ShouldNotBeNull();
        plans!.ShouldNotBeEmpty();
        plans.ShouldAllBe(p => p.CareerId == tudcsCareerId);
    }

    [Fact]
    public async Task ListCareerPlans_returns_400_when_careerId_missing()
    {
        var response = await _client.GetAsync("/api/academic/career-plans");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}

/// <summary>
/// US-171 y US-204: tests que agregan universidades y carreras propias al catálogo. Clase propia
/// (con su propia base, ver ADR-0027) para no correr contra las mismas filas que
/// <see cref="PublicCatalogEndpointsTests"/> usa para contar el seed exacto: sumar una universidad
/// o una carrera nueva ahí rompería ese conteo, igual motivo que separa
/// <c>GetSampleChairFactsEndpointDrawsVariablyTests</c> de <c>GetSampleChairFactsEndpointTests</c>.
/// </summary>
public class PublicCatalogListingsIntegrityTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public PublicCatalogListingsIntegrityTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    /// <summary>
    /// US-171: las universidades salen ordenadas por nombre y sin ningún campo de destacado,
    /// patrocinio o promoción en el cuerpo. No cita E1 entera: el escenario también pide que se
    /// pueda "elegir cómo ordenarlas" entre alfabético o por voces, y ese control no existe en
    /// ninguna pantalla (Explorar no tiene selector de orden). Nombres ASCII sin acento para no
    /// depender del collation de Postgres (la propia
    /// <see cref="ListUniversities_returns_200_with_all_seeded_universities"/> ya documenta por
    /// qué esa comparación no es segura con los nombres reales del seed).
    /// </summary>
    [Fact]
    public async Task ListUniversities_is_sorted_by_name_with_no_sponsorship_field()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

        var unique = Guid.NewGuid().ToString("N")[..8];
        var names = new[] { $"Aaa Sorting {unique}", $"Mmm Sorting {unique}", $"Zzz Sorting {unique}" };
        foreach (var name in names.Reverse()) // se insertan en orden inverso: si el orden que
                                              // devuelve la API fuera el de inserción, esto lo
                                              // agarraría.
        {
            var uni = University.Create(name, $"{name.ToLowerInvariant().Replace(' ', '-')}", null, clock).Value;
            db.Universities.Add(uni);
        }
        await db.SaveChangesAsync();

        var response = await _client.GetAsync("/api/academic/universities");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();

        // Ningún campo de destacado, patrocinio o promoción en el cuerpo público.
        foreach (var word in new[] { "sponsor", "featured", "promoted", "highlighted" })
        {
            body.ShouldNotContain(word, Case.Insensitive, $"universities filtró un campo \"{word}\"");
        }

        // El orden público tiene que ser alfabético, no el de creación (se insertaron al revés).
        var unis = await response.Content.ReadFromJsonAsync<List<UniversityListItem>>();
        var mine = unis!.Where(u => u.Name.EndsWith(unique)).Select(u => u.Name).ToList();
        mine.ShouldBe(names);
    }

    /// <summary>
    /// US-171: el listado de carreras de una universidad no tiene campo de destacado, patrocinio
    /// ni promoción, pero su orden real es <c>is_official DESC, name ASC</c>
    /// (<c>DapperAcademicQueryService.ListCareersByUniversityAsync</c>): las carreras oficiales
    /// van primero, y recién ahí alfabético. Es una señal de procedencia del dato (cargada por el
    /// equipo vs. crowdsourced por un alumno vía US-088), no de conveniencia comercial, pero
    /// tampoco es "ordenada por nombre" a secas como pide la letra de E1: no se cita E1 acá.
    /// </summary>
    [Fact]
    public async Task ListCareers_has_no_sponsorship_field_but_orders_official_plans_first()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
        var unstaId = new UniversityId(AcademicSeedData.Unsta.Id.Value);

        var unique = Guid.NewGuid().ToString("N")[..8];
        // "Aaa" no oficial y "Zzz" oficial: si el orden fuera puramente alfabético, Aaa iría
        // primero. Si is_official manda, Zzz (oficial) va primero pese al nombre.
        var unofficial = Career.Create(
            unstaId, $"Aaa Unofficial {unique}", $"aaa-unofficial-{unique}", clock,
            isOfficial: false).Value;
        var official = Career.Create(
            unstaId, $"Zzz Official {unique}", $"zzz-official-{unique}", clock,
            isOfficial: true).Value;
        db.Careers.AddRange(unofficial, official);
        await db.SaveChangesAsync();

        var response = await _client.GetAsync($"/api/academic/careers?universityId={unstaId.Value}");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();

        foreach (var word in new[] { "sponsor", "featured", "promoted", "highlighted" })
        {
            body.ShouldNotContain(word, Case.Insensitive, $"careers filtró un campo \"{word}\"");
        }

        var careers = await response.Content.ReadFromJsonAsync<List<CareerListItem>>();
        var mine = careers!.Where(c => c.Name.EndsWith(unique)).ToList();
        mine.Count.ShouldBe(2);
        mine[0].Name.ShouldBe(official.Name, "is_official ordena antes que el nombre");
        mine[1].Name.ShouldBe(unofficial.Name);
    }

    /// <summary>
    /// US-204 E1: Plan 2019 (deprecado) y Plan 2024 (vigente) de la misma carrera conviven: cargar
    /// el nuevo no borra ni reemplaza al viejo, que sigue existiendo para quien ya lo cursa.
    /// </summary>
    [Fact]
    public async Task ListCareerPlans_keeps_a_deprecated_plan_alongside_the_active_one()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

        var unique = Guid.NewGuid().ToString("N")[..8];
        var career = Career.Create(
            new UniversityId(AcademicSeedData.Unsta.Id.Value),
            $"Ingeniería en Sistemas {unique}",
            $"ingenieria-en-sistemas-{unique}",
            clock,
            isOfficial: true).Value;
        db.Careers.Add(career);

        var plan2019 = CareerPlan.Create(career.Id, 2019, clock).Value;
        plan2019.Deprecate(clock).IsSuccess.ShouldBeTrue();
        var plan2024 = CareerPlan.Create(career.Id, 2024, clock).Value;
        db.CareerPlans.AddRange(plan2019, plan2024);
        await db.SaveChangesAsync();

        var response = await _client.GetAsync(
            $"/api/academic/career-plans?careerId={career.Id.Value}");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var plans = await response.Content.ReadFromJsonAsync<List<CareerPlanListItem>>();
        plans.ShouldNotBeNull();

        // Los dos planes coexisten, cada uno con su año: cargar el vigente no borra el deprecado.
        var oldPlan = plans!.Single(p => p.Year == 2019);
        oldPlan.Status.ShouldBe("Deprecated");
        var newPlan = plans.Single(p => p.Year == 2024);
        newPlan.Status.ShouldBe("Active");
    }
}
