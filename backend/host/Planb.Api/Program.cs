using Carter;
using JasperFx;
using Microsoft.EntityFrameworkCore;
using JasperFx.CodeGeneration;
using JasperFx.Resources;
using Planb.Academic.Application;
using Planb.Academic.Infrastructure;
using Planb.Api.Infrastructure;
using Planb.Enrollments.Application;
using Planb.Enrollments.Infrastructure;
using Planb.Identity.Application;
using Planb.Identity.Infrastructure;
using Planb.Identity.Infrastructure.Persistence;
using Planb.Identity.Infrastructure.Security;
using Planb.Moderation.Application;
using Planb.Moderation.Infrastructure;
using Planb.Planning.Application;
using Planb.Planning.Infrastructure;
using Planb.Reviews.Application;
using Planb.Reviews.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Serilog;
using StackExchange.Redis;
using Wolverine;
using Wolverine.EntityFrameworkCore;
using Wolverine.FluentValidation;
using Wolverine.Postgresql;

// ------------------------------------------------------------------
// .env local (antes de construir el builder, que ya lee el entorno)
// ------------------------------------------------------------------
// El Justfile inyecta el .env de la raíz con `set dotenv-load := true`, así que `just dev-backend`
// arranca bien. Cualquier otro camino (un `dotnet run` directo, el F5 del IDE, un debugger
// adjunto) se quedaba sin esas variables y el host moría con "Connection string 'Redis' is not
// configured", un mensaje que no menciona el .env por ningún lado. Cargarlo acá empareja todos los
// caminos de arranque. `TraversePath` sube hasta la raíz del repo porque el proceso corre desde
// host/Planb.Api. En producción no se toca: ahí las variables vienen del entorno real.
if (!string.Equals(
        Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        "Production",
        StringComparison.OrdinalIgnoreCase))
{
    DotNetEnv.Env.TraversePath().Load();
}

var builder = WebApplication.CreateBuilder(args);

// ------------------------------------------------------------------
// Logging (Serilog)
// ------------------------------------------------------------------
builder.Host.UseSerilog((ctx, services, config) =>
    config
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

// ------------------------------------------------------------------
// SharedKernel services
// ------------------------------------------------------------------
builder.Services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
builder.Services.AddScoped<IDomainEventPublisher, WolverineDomainEventPublisher>();

var connectionString = builder.Configuration.GetConnectionString("Planb")
    ?? throw new InvalidOperationException("Connection string 'Planb' is not configured.");

// ------------------------------------------------------------------
// Redis (cache + ephemeral state, ADR-0034). Registered as a singleton
// IConnectionMultiplexer so handlers can pull it directly.
//
// AbortOnConnectFail=false means a Redis outage does NOT prevent the host
// from starting; per the ADR's degradation principle, each consumer handles
// unavailability locally (cache miss → DB, rate limiter unreachable → fail
// open, refresh tokens not validable → 401 and re-login).
//
// Required (not conditional). Earlier this was conditional on the connection
// string being present, which silently dropped IRefreshTokenStore's
// dependency in environments that forgot to configure Redis — manifesting
// as a confusing DI validation error at host build instead of a clear
// "missing connection string" message. Postgres is required and so is Redis.
// ------------------------------------------------------------------
var redisConnectionString = builder.Configuration.GetConnectionString("Redis")
    ?? throw new InvalidOperationException("Connection string 'Redis' is not configured.");

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var options = ConfigurationOptions.Parse(redisConnectionString);
    options.AbortOnConnectFail = false;
    return ConnectionMultiplexer.Connect(options);
});

// ------------------------------------------------------------------
// EF Core DbContexts registered with Wolverine outbox integration. This makes
// IMessageBus.PublishAsync calls inside [Transactional] handlers enroll messages
// in the same Postgres transaction as SaveChangesAsync. See ADR-0015.
// ------------------------------------------------------------------
builder.Services.AddDbContextWithWolverineIntegration<IdentityDbContext>(opts =>
    Planb.Identity.Infrastructure.DependencyInjection.ConfigureIdentityDbContext(
        opts, connectionString));

builder.Services.AddDbContextWithWolverineIntegration<Planb.Academic.Infrastructure.Persistence.AcademicDbContext>(opts =>
    Planb.Academic.Infrastructure.DependencyInjection.ConfigureAcademicDbContext(
        opts, connectionString));

builder.Services.AddDbContextWithWolverineIntegration<Planb.Enrollments.Infrastructure.Persistence.EnrollmentsDbContext>(opts =>
    Planb.Enrollments.Infrastructure.DependencyInjection.ConfigureEnrollmentsDbContext(
        opts, connectionString));

builder.Services.AddDbContextWithWolverineIntegration<Planb.Reviews.Infrastructure.Persistence.ReviewsDbContext>(opts =>
    Planb.Reviews.Infrastructure.DependencyInjection.ConfigureReviewsDbContext(
        opts, connectionString));

builder.Services.AddDbContextWithWolverineIntegration<Planb.Moderation.Infrastructure.Persistence.ModerationDbContext>(opts =>
    Planb.Moderation.Infrastructure.DependencyInjection.ConfigureModerationDbContext(
        opts, connectionString));

// ------------------------------------------------------------------
// Wolverine (mediator + message bus + outbox + FluentValidation middleware)
// ------------------------------------------------------------------
builder.Host.UseWolverine(opts =>
{
    opts.Discovery.IncludeAssembly(typeof(Program).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Identity.Application.DependencyInjection).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Academic.Application.DependencyInjection).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Enrollments.Application.DependencyInjection).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Reviews.Application.DependencyInjection).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Moderation.Application.DependencyInjection).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Planning.Application.DependencyInjection).Assembly);

    opts.PersistMessagesWithPostgresql(connectionString, schemaName: "wolverine");
    opts.Policies.AutoApplyTransactions();
    opts.UseFluentValidation(fv => fv.IncludeInternalTypes = true);

    // CritterStack-canonical environment split: dev auto-creates schemas, prod assumes the
    // deploy pipeline already ran `dotnet run -- db-apply`. See https://wolverinefx.net.
    opts.Services.CritterStackDefaults(x =>
    {
        x.Production.GeneratedCodeMode = TypeLoadMode.Static;
        x.Production.ResourceAutoCreate = AutoCreate.None;
        x.Production.AssertAllPreGeneratedTypesExist = true;

        x.Development.GeneratedCodeMode = TypeLoadMode.Dynamic;
        x.Development.ResourceAutoCreate = AutoCreate.CreateOrUpdate;
    });
});

// In dev, build any missing schemas (Wolverine outbox + EF Core) at startup.
if (builder.Environment.IsDevelopment())
{
    builder.Host.UseResourceSetupOnStartup();
}

// ------------------------------------------------------------------
// Carter (endpoint discovery)
// ------------------------------------------------------------------
builder.Services.AddCarter();

// ------------------------------------------------------------------
// Modules
// ------------------------------------------------------------------
builder.Services.AddIdentityApplication();
builder.Services.AddIdentityInfrastructure(builder.Configuration);

builder.Services.AddAcademicApplication();
builder.Services.AddAcademicInfrastructure(builder.Configuration);

builder.Services.AddEnrollmentsApplication();
builder.Services.AddEnrollmentsInfrastructure(builder.Configuration);

builder.Services.AddReviewsApplication(builder.Configuration);
builder.Services.AddReviewsInfrastructure(builder.Configuration);

builder.Services.AddModerationApplication();
builder.Services.AddModerationInfrastructure(builder.Configuration);

builder.Services.AddPlanningApplication();
builder.Services.AddPlanningInfrastructure();

// JwtBearer middleware (cierre del workaround pre-JWT). Endpoints /api/me/* leen el UserId
// del claim `sub` validado por este middleware, no del body/query. Token llega desde el
// header Authorization: Bearer o la cookie planb_session (frontend de Next.js).
builder.Services.AddIdentityJwtAuthentication(builder.Configuration);

// In Development, apply EF migrations on host startup. Lives as a hosted
// service so WebApplicationFactory tests get the same treatment as `just dev`.
// See DevMigrationsHostedService for the why.
builder.Services.AddHostedService<DevMigrationsHostedService>();

// US-022: scheduled job que expira registros no verificados a los 7 días. Corre cada 24h con
// un PeriodicTimer; primer fire 24h post-startup así no molesta en tests / dev sessions cortas.
builder.Services.AddHostedService<UnverifiedRegistrationExpirationScheduler>();

// ------------------------------------------------------------------
// Dev seed: load personas from a separate JSON file (Options pattern), then
// register the IdentitySeeder + hosted service that materializes them. The
// hosted service is gated by IsDevelopment() internally; Configure can stay
// unconditional because the file is also dev-only (production deploys ship
// without it). Order: must be registered AFTER DevMigrationsHostedService so
// it runs against an existing schema.
// ------------------------------------------------------------------
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile(
        "seed-data/personas.json", optional: true, reloadOnChange: false);
}

builder.Services.AddOptions<Planb.Identity.Application.Seeding.SeedPersonasOptions>()
    .Bind(builder.Configuration.GetSection(
        Planb.Identity.Application.Seeding.SeedPersonasOptions.SectionName))
    .ValidateDataAnnotations();

builder.Services.AddScoped<Planb.Identity.Application.Seeding.IdentitySeeder>();
builder.Services.AddHostedService<DevSeedHostedService>();

// Academic seed: UNSTA + TUDCS + CareerPlan 2024 (US-012). Idempotente, gateado por
// IsDevelopment() internamente. Debe registrarse después de DevMigrationsHostedService
// (mismo motivo que el seed de Identity: necesita schema academic existente).
builder.Services.AddHostedService<AcademicSeedHostedService>();

// Demo corpus seed (devex, sin US): autores fantasma + cursadas + reseñas + votos para que el
// corpus de reseñas sea consumible y demostrable en `just dev` sin armar datos a mano. Cruza
// identity/enrollments/reviews; el host orquesta. Gateado por IsDevelopment() Y el env var
// PLANB_SEED_DEMO (default off): SOLO lo prende `just dev`, así los integration tests (que corren
// en Development) NO reciben el corpus y sus asserts de conteo quedan intactos. Va último: depende
// de los seeds de Identity (personas) y Academic (catálogo) ya aplicados.
builder.Services.AddScoped<Planb.Identity.Application.Seeding.DemoAuthorsSeeder>();
builder.Services.AddScoped<Planb.Enrollments.Application.Seeding.EnrollmentsDemoSeeder>();
builder.Services.AddScoped<Planb.Reviews.Application.Seeding.ReviewsDemoSeeder>();
builder.Services.AddHostedService<Planb.Api.Infrastructure.DemoCorpus.DemoCorpusHostedService>();

// ------------------------------------------------------------------
// HTTP pipeline
// ------------------------------------------------------------------
var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseIdentityJwtAuthentication();
app.MapCarter();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "planb-api",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0",
}));

// JasperFx command-line: `dotnet run` runs the server, `dotnet run -- db-apply` etc. for
// administrative operations. See https://wolverinefx.net/guide/command-line.html.
return await app.RunJasperFxCommands(args);

// Exposed for WebApplicationFactory in integration tests.
public partial class Program;
