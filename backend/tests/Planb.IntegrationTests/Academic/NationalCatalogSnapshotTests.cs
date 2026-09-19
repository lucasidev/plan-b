using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Infrastructure.CatalogImport;
using Planb.Academic.Application.Abstractions.Georef;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Academic.Infrastructure.Spu;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace Planb.IntegrationTests.Academic;

public sealed class NationalCatalogSnapshotTests(RegisterApiFixture fixture, ITestOutputHelper output)
    : IClassFixture<RegisterApiFixture>
{
    [Fact]
    public async Task National_snapshot_is_repeatable_preserves_seed_and_compares_mendoza_over_http()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
        var previousCareers = await db.Careers.AsNoTracking().OrderBy(c => c.Id).ToListAsync();
        var previousIds = previousCareers.Select(c => c.Id).ToArray();
        var previousJson = JsonSerializer.Serialize(previousCareers);
        var previousFacts = await db.OfficialFacts.AsNoTracking().OrderBy(f => f.Id).ToListAsync();
        var previousFactIds = previousFacts.Select(f => f.Id).ToArray();
        await using var stream = File.OpenRead(Path.Combine(AppContext.BaseDirectory, "CatalogImport", "Data", "siu-national.json"));
        await ReviewedCatalogSnapshot.VerifyAsync(stream);
        stream.Position = 0;
        var snapshot = (await JsonSerializer.DeserializeAsync<SiuCatalogSnapshot>(stream,
            new JsonSerializerOptions(JsonSerializerDefaults.Web)))!;
        snapshot.Offerings.Count.ShouldBe(19239);
        snapshot.Coverage.Count.ShouldBe(48);
        // Las cuatro correspondencias canónicas se contrastan con la captura real, no con otra fixture inventada.
        foreach (var id in NationalCanonicalCareerGroupings.LawCareerIds)
            snapshot.Offerings.Count(o => SiuCatalogImporter.GetDeterministicCareerId(o) == id.Value).ShouldBe(1);

        var importer = new SiuCatalogImporter(db, new RecordedLocalities(), clock, NullLogger<SiuCatalogImporter>.Instance);
        var first = await importer.ImportAsync(snapshot);
        output.WriteLine($"SIU: {first.UniversitiesCreated} institutions, {first.AcademicUnitsCreated} units, {first.CareersCreated} offerings, {first.OfficialFactsCreated} facts, {first.Pending.Count} pending.");
        first.UniversitiesCreated.ShouldBe(129);
        // 354 filas tucumanas preservadas, 52 sin institución y cuatro títulos mayores al límite del catálogo.
        first.CareersCreated.ShouldBe(snapshot.Offerings.Count - 354 - 52 - 4);
        first.Pending.Count.ShouldBe(56);
        first.TucumanOfferingsPreserved.ShouldBe(354);
        (await db.AcademicUnits.CountAsync(unit => unit.Province == null)).ShouldBe(0);
        db.ChangeTracker.Clear();
        var second = await importer.ImportAsync(snapshot);
        second.UniversitiesCreated.ShouldBe(0);
        second.AcademicUnitsCreated.ShouldBe(0);
        second.CareersCreated.ShouldBe(0);
        second.OfficialFactsCreated.ShouldBe(0);
        JsonSerializer.Serialize(await db.Careers.AsNoTracking().Where(c => previousIds.Contains(c.Id))
            .OrderBy(c => c.Id).ToListAsync()).ShouldBe(previousJson);

        var spu = new SpuInstitutionImporter(db, clock);
        var spuCount = await spu.ImportAsync();
        spuCount.ShouldBeGreaterThan(300);
        (await spu.ImportAsync()).ShouldBe(0);
        JsonSerializer.Serialize(await db.OfficialFacts.AsNoTracking().Where(f => previousFactIds.Contains(f.Id))
            .OrderBy(f => f.Id).ToListAsync()).ShouldBe(JsonSerializer.Serialize(previousFacts));

        var uba = await db.Universities.SingleAsync(u => u.Name == "Universidad de Buenos Aires");
        (await db.OfficialFacts.SingleAsync(f => f.SubjectId == uba.Id.Value && f.Field == OfficialFactField.Students))
            .Value.ShouldBe("347280");
        var anchor = NationalCanonicalCareerGroupings.LawCareerIds[0].Value;
        using var anonymous = fixture.Factory.CreateClient();
        var comparison = (await anonymous.GetFromJsonAsync<Comparison>(
            $"/api/academic/career-comparison?careerId={anchor}"))!;
        comparison.GroupName.ShouldBe("Abogacía");
        comparison.CityLabel.ShouldBe("Gran Mendoza");
        comparison.IsProvinceFallback.ShouldBeFalse();
        comparison.Offerings.Count.ShouldBe(4);
        comparison.Offerings.Select(o => o.CareerId).Order().ShouldBe(
            NationalCanonicalCareerGroupings.LawCareerIds.Select(id => id.Value).Order());
        foreach (var offering in comparison.Offerings)
        {
            offering.Facts.ShouldContain(f => f.Field == OfficialFactField.PaperDuration && f.Status == "Published");
            offering.Facts.ShouldContain(f => f.Field == OfficialFactField.RealDuration && f.Status == "NotPublished");
        }
    }

    // Respuestas Georef verificadas el 2026-09-17. El resto simula falta de resolución: la suite no depende de la red pública.
    private sealed class RecordedLocalities : IGeorefLocalityResolver
    {
        public Task<GeorefLocality?> ResolveAsync(string localityText, string province, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();
            GeorefLocality? result = (localityText, province) switch
            {
                ("Mendoza", "Mendoza") => new("50007010", "Mendoza"),
                ("Godoy Cruz", "Mendoza") => new("50021010", "Godoy Cruz"),
                ("Guaymallen", "Mendoza") => new("50028020", "Guaymallén"),
                _ => null,
            };
            return Task.FromResult(result);
        }
    }

    private sealed record Comparison(string GroupName, string CityLabel, bool IsProvinceFallback, IReadOnlyList<Offering> Offerings);
    private sealed record Offering(Guid CareerId, IReadOnlyList<Fact> Facts);
    private sealed record Fact(string Field, string Status);
}
