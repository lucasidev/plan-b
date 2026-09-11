using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Georef;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Academic.Infrastructure.Seeding;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// La idempotencia de <see cref="AcademicSeeder"/> contra una base que ya tiene datos, que es el
/// caso que en desarrollo no se ejercita nunca porque ahí la base se tira y se recrea.
///
/// <para>
/// Base propia migrada y vacía (<see cref="AcademicDatabase"/>), no la plantilla de
/// <see cref="RegisterApiFixture"/>: la plantilla arranca ya sembrada, y acá el seeder es el
/// sujeto del test, no el decorado.
/// </para>
/// </summary>
[Collection(PostgresCollection.Name)]
public class AcademicSeederIdempotencyTests
{
    private static readonly DateTimeOffset Now =
        new(2026, 9, 11, 12, 0, 0, TimeSpan.Zero);

    private readonly PostgresFixture _fixture;

    public AcademicSeederIdempotencyTests(PostgresFixture fixture) => _fixture = fixture;

    private static string FreshDb(string label) => $"planb_seeder_{label}_{Guid.NewGuid():N}";

    private static AcademicSeeder SeederOn(AcademicDbContext db, ILogger<AcademicSeeder> logger) =>
        new(db, new FixedClock(Now), new NoGeoref(), logger);

    /// <summary>
    /// El primer período lectivo que el seed le da a esa universidad. Sirve para armar el choque
    /// sin hardcodear los UUIDs: lo que importa es que son dos registros distintos, no cuáles.
    /// </summary>
    private static AcademicTermRecord FirstTermOf(UniversityId university) =>
        AcademicSeedData.AcademicTerms.First(t => t.UniversityId == university);

    [Fact]
    public async Task Seeding_a_term_already_stored_under_another_id_neither_throws_nor_duplicates()
    {
        await using var handle = await AcademicDatabase.CreateMigratedAsync(
            _fixture, FreshDb("terms"));
        var db = handle.Context;

        // El estado que tumbó el stage: al abrirle un bloque de ids a otra universidad, el período
        // de UTN quedó en la base con el id que el seed hoy le da al de UNT.
        var renumbered = FirstTermOf(AcademicSeedData.UtnFrt.Id);
        var squatter = FirstTermOf(AcademicSeedData.Unt.Id);
        renumbered.Id.ShouldNotBe(squatter.Id);

        db.AcademicTerms.Add(AcademicTerm.Hydrate(
            squatter.Id,
            renumbered.UniversityId,
            renumbered.Year,
            renumbered.Number,
            renumbered.Kind,
            renumbered.StartDate,
            renumbered.EndDate,
            renumbered.EnrollmentOpens,
            renumbered.EnrollmentCloses,
            AcademicTerm.ComputeLabel(renumbered.Year, renumbered.Number, renumbered.Kind),
            createdAt: Now));
        await db.SaveChangesAsync();

        var log = new RecordingLogger<AcademicSeeder>();
        await SeederOn(db, log).SeedAsync();

        await using var fresh = AcademicDatabase.Open(handle.ConnectionString);
        var terms = await fresh.AcademicTerms.AsNoTracking().ToListAsync();

        // Ninguna clave natural repetida: es lo que el índice único prohíbe y lo que reventaba.
        terms.Select(t => (t.UniversityId, t.Year, t.Number, t.Kind)).Distinct().Count()
            .ShouldBe(terms.Count);

        // El período que ya estaba sigue con el id que la base le había dado: no se renumera.
        var stored = terms.Single(t => t.Id == squatter.Id);
        stored.UniversityId.ShouldBe(renumbered.UniversityId);

        // El que no entró es el que tenía ese id reservado, y no se pierde en silencio.
        terms.Any(t =>
            t.UniversityId == squatter.UniversityId
            && t.Year == squatter.Year
            && t.Number == squatter.Number
            && t.Kind == squatter.Kind).ShouldBeFalse();
        terms.Count.ShouldBe(AcademicSeedData.AcademicTerms.Count - 1);
        log.Warnings.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Seeding_a_plan_whose_id_is_held_by_another_year_neither_throws_nor_duplicates()
    {
        await using var handle = await AcademicDatabase.CreateMigratedAsync(
            _fixture, FreshDb("plans"));
        var db = handle.Context;

        // El otro choque de la misma familia: el plan cambió de año sin cambiar de id, así que la
        // base tiene el año viejo bajo el id que el seed sigue usando para el nuevo.
        var seed = AcademicSeedData.Careers.First(c => c.Plan is not null);
        var storedYear = seed.Plan!.Year - 1;

        db.Careers.Add(Career.Hydrate(
            seed.Career.Id,
            seed.Career.UniversityId,
            seed.Career.Name,
            seed.Career.Slug,
            shortName: null,
            code: null,
            degreeType: null,
            durationYears: null,
            cadence: null,
            description: null,
            isOfficial: true,
            isActive: true,
            createdAt: Now,
            updatedAt: Now,
            academicUnitId: seed.Career.AcademicUnitId));
        db.CareerPlans.Add(CareerPlan.Hydrate(
            seed.Plan.Id,
            seed.Career.Id,
            storedYear,
            CareerPlanStatus.Active,
            isOfficial: true,
            label: null,
            createdAt: Now,
            updatedAt: Now));
        await db.SaveChangesAsync();

        var log = new RecordingLogger<AcademicSeeder>();
        await SeederOn(db, log).SeedAsync();

        await using var fresh = AcademicDatabase.Open(handle.ConnectionString);
        var plans = await fresh.CareerPlans.AsNoTracking()
            .Where(p => p.CareerId == seed.Career.Id)
            .ToListAsync();

        // El plan que ya estaba queda como está: su id no se puede reusar para otro año.
        plans.ShouldHaveSingleItem().Year.ShouldBe(storedYear);
        log.Warnings.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Seeding_twice_over_the_same_base_leaves_the_same_result()
    {
        await using var handle = await AcademicDatabase.CreateMigratedAsync(
            _fixture, FreshDb("twice"));

        var log = new RecordingLogger<AcademicSeeder>();
        await SeederOn(handle.Context, log).SeedAsync();
        var afterFirst = await CountsAsync(handle.ConnectionString);

        // Contexto nuevo: que la segunda pasada no duplique tiene que salir de lo que hay en la
        // base, no de un ChangeTracker que todavía se acuerda de la primera.
        await using (var second = AcademicDatabase.Open(handle.ConnectionString))
        {
            await SeederOn(second, log).SeedAsync();
        }

        var afterSecond = await CountsAsync(handle.ConnectionString);

        afterSecond.ShouldBe(afterFirst);
        afterFirst.ShouldAllBe(table => table.Rows > 0);

        // Sobre una base que el propio seed llenó no hay desencuentro de ids que avisar.
        log.Warnings.ShouldBeEmpty();
    }

    private static async Task<IReadOnlyList<(string Table, int Rows)>> CountsAsync(
        string connectionString)
    {
        await using var db = AcademicDatabase.Open(connectionString);

        return
        [
            ("universities", await db.Universities.CountAsync()),
            ("academic_units", await db.AcademicUnits.CountAsync()),
            ("careers", await db.Careers.CountAsync()),
            ("career_plans", await db.CareerPlans.CountAsync()),
            ("subjects", await db.Subjects.CountAsync()),
            ("prerequisites", await db.Prerequisites.CountAsync()),
            ("academic_terms", await db.AcademicTerms.CountAsync()),
            ("teachers", await db.Teachers.CountAsync()),
            ("chairs", await db.Chairs.CountAsync()),
            ("official_facts", await db.OfficialFacts.CountAsync()),
        ];
    }

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    /// <summary>
    /// Georef siempre en blanco: el test no sale a la red, y una unidad académica sin localidad es
    /// un estado válido del catálogo (el resolver real también devuelve null cuando la API no
    /// contesta).
    /// </summary>
    private sealed class NoGeoref : IGeorefLocalityResolver
    {
        public Task<GeorefLocality?> ResolveAsync(string localityText, CancellationToken ct = default) =>
            Task.FromResult<GeorefLocality?>(null);
    }

    /// <summary>
    /// Guarda los avisos del seeder. Un salteo sin ruido es la mitad del bug original, así que el
    /// test mira que el aviso exista, sin atarse a cómo está redactado.
    /// </summary>
    private sealed class RecordingLogger<T> : ILogger<T>
    {
        private readonly List<string> _warnings = [];

        public IReadOnlyList<string> Warnings => _warnings;

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (logLevel >= LogLevel.Warning)
            {
                _warnings.Add(formatter(state, exception));
            }
        }
    }
}
