using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Infrastructure.CatalogImport;
using Planb.Academic.Application.Abstractions.Georef;
using Planb.Academic.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

public sealed class SiuCatalogEdgeCasesTests(RegisterApiFixture fixture) : IClassFixture<RegisterApiFixture>
{
    [Fact]
    public async Task Distinct_degrees_and_sites_survive_and_georef_can_recover_on_retry()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
        var georef = new RecoveringGeoref();
        var importer = new SiuCatalogImporter(db, georef, clock, NullLogger<SiuCatalogImporter>.Instance);
        var doctorate = Offering("Estudios", "Doctorado", "18 Meses");
        var masters = doctorate with { DegreeType = "Maestría" };
        var elsewhere = doctorate with { Address = "Otra calle - Mendoza - Mendoza" };
        var spaced = Offering("A B", "Grado", "4 Años");
        var compact = Offering("AB", "Grado", null) with { Admission = null };
        var snapshot = Snapshot(doctorate, masters, elsewhere, spaced, compact);
        var first = await importer.ImportAsync(snapshot);
        first.CareersCreated.ShouldBe(5);
        first.AcademicUnitsCreated.ShouldBe(2);
        georef.Calls.ShouldBe(1);
        var ids = snapshot.Offerings.Select(o => new CareerId(SiuCatalogImporter.GetDeterministicCareerId(o))).ToArray();
        var careers = await db.Careers.AsNoTracking().Where(c => ids.Contains(c.Id)).ToListAsync();
        careers.Single(c => c.Name == "A B").DurationYears.ShouldBe(4);
        careers.Where(c => c.Name == "Estudios").ShouldAllBe(c => c.DurationYears == null);
        var missingId = SiuCatalogImporter.GetDeterministicCareerId(compact);
        (await db.OfficialFacts.SingleAsync(f => f.SubjectId == missingId && f.Field == OfficialFactField.PaperDuration))
            .Status.ShouldBe(OfficialFactStatus.NotPublished);
        (await db.OfficialFacts.SingleAsync(f => f.SubjectId == missingId && f.Field == OfficialFactField.AdmissionRegime))
            .Status.ShouldBe(OfficialFactStatus.NotPublished);

        db.ChangeTracker.Clear();
        georef.Available = true;
        var second = await importer.ImportAsync(snapshot);
        second.CareersCreated.ShouldBe(0);
        second.OfficialFactsCreated.ShouldBe(0);
        georef.Calls.ShouldBe(2);
        var unitIds = careers.Select(c => c.AcademicUnitId!.Value).ToArray();
        (await db.AcademicUnits.AsNoTracking().Where(u => unitIds.Contains(u.Id)).ToListAsync())
            .ShouldAllBe(u => u.LocalityId == "50007010");
    }

    [Fact]
    public async Task Invalid_coverage_and_conflicting_source_do_not_create_partial_offerings()
    {
        using var scope = fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var importer = new SiuCatalogImporter(db, new RecoveringGeoref(),
            scope.ServiceProvider.GetRequiredService<IDateTimeProvider>(), NullLogger<SiuCatalogImporter>.Instance);
        var initial = await db.Careers.CountAsync();
        var first = Offering("Oferta contradictoria", "Grado", "4 Años");
        var snapshot = Snapshot(first, first with { Duration = "5 Años" });
        (await importer.ImportAsync(snapshot)).Pending.Count.ShouldBe(1);
        (await db.Careers.CountAsync()).ShouldBe(initial);
        await Should.ThrowAsync<InvalidOperationException>(() => importer.ImportAsync(snapshot with { Coverage = [] }));
        (await db.Careers.CountAsync()).ShouldBe(initial);
    }

    private static SiuCatalogOffering Offering(string title, string degree, string? duration) =>
        new("M", "Mendoza", "postgraduate", "Institución de prueba R8", "Facultad", title,
            degree, duration, "Ingreso Directo", "Calle 1 - Mendoza - Mendoza", null, null, null);

    private static SiuCatalogSnapshot Snapshot(params SiuCatalogOffering[] offerings)
    {
        string[] provinces = ["B", "K", "H", "U", "C", "X", "W", "E", "P", "Y", "L", "F", "M", "N", "Q", "R", "A", "J", "D", "Z", "S", "G", "V", "T"];
        var coverage = provinces.SelectMany(code => new[] { "undergraduate", "postgraduate" }.Select(level =>
            new SiuCatalogCoverage(code, level,
                $"https://guiadecarreras.siu.edu.ar/ciie_ofertas/2.0/guia_{(level == "undergraduate" ? "grado" : "postgrado")}.php?provincia={code}&nivel={(level == "undergraduate" ? "1" : "2")}",
                new string('a', 64), offerings.Count(o => o.ProvinceCode == code && o.Level == level)))).ToArray();
        return new(1, SiuCatalogSnapshotValidator.SourceUrl, DateTimeOffset.Parse("2026-09-17T00:00:00Z"), coverage, offerings);
    }

    private sealed class RecoveringGeoref : IGeorefLocalityResolver
    {
        public bool Available { get; set; }
        public int Calls { get; private set; }
        public Task<GeorefLocality?> ResolveAsync(string localityText, string province, CancellationToken ct = default)
        {
            Calls++;
            return Task.FromResult<GeorefLocality?>(Available ? new("50007010", "Mendoza") : null);
        }
    }
}
