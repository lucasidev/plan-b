using Carter;
using JasperFx;
using Microsoft.EntityFrameworkCore;
using JasperFx.CodeGeneration;
using JasperFx.Resources;
using Planb.Academic.Application;
using Planb.Academic.Infrastructure;
using Planb.Api.Infrastructure;
using Planb.Identity.Application;
using Planb.Identity.Infrastructure;
using Planb.Identity.Infrastructure.Persistence;
using Planb.Identity.Infrastructure.Security;
using Planb.Reviews.Application;
using Planb.Reviews.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.Persistence;
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
    // NoClobber: el entorno real le gana al .env, nunca al revés. Sin eso, cualquier proceso que
    // arranque el host con variables propias las perdía en silencio. Y no era hipotético: el runner
    // de E2E (scripts/run-e2e.ts) le pasa la connection string de una base efímera, el .env la
    // pisaba con la de dev, y la suite entera corría contra la base de desarrollo creyendo que
    // corría aislada. Se descubrió porque el spec de períodos empezó a chocar contra períodos que
    // habían creado corridas anteriores.
    DotNetEnv.Env.TraversePath().NoClobber().Load();
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
// Las lecturas Dapper de los tres modulos abren su conexion por aca. Singleton porque solo
// guarda el connection string, y validarlo al construirse hace que un config incompleto
// explote al levantar y no en el primer request que toque un servicio de lectura.
builder.Services.AddSingleton<IDbConnectionFactory, NpgsqlConnectionFactory>();
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

builder.Services.AddDbContextWithWolverineIntegration<Planb.Reviews.Infrastructure.Persistence.ReviewsDbContext>(opts =>
    Planb.Reviews.Infrastructure.DependencyInjection.ConfigureReviewsDbContext(
        opts, connectionString));


// ------------------------------------------------------------------
// Wolverine (mediator + message bus + outbox + FluentValidation middleware)
// ------------------------------------------------------------------
builder.Host.UseWolverine(opts =>
{
    opts.Discovery.IncludeAssembly(typeof(Program).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Identity.Application.DependencyInjection).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Academic.Application.DependencyInjection).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Reviews.Application.DependencyInjection).Assembly);

    opts.PersistMessagesWithPostgresql(connectionString, schemaName: "wolverine");
    opts.Policies.AutoApplyTransactions();

    // El outbox durable garantiza que el mensaje se persista al commitear, pero las colas locales
    // son in-memory por default: la entrega es "lo saco del outbox y lo pongo en una Channel". Si el
    // proceso se cae entre esas dos cosas, el mensaje se pierde sin rastro.
    //
    // Eso no es teórico acá: el import de plan de carrera es fire-and-forget con el usuario
    // esperando en un polling. Un restart en el momento equivocado dejaba el import en Pending
    // para siempre, con la pantalla girando contra un worker que ya no existe. Con colas
    // durables el envelope sobrevive al restart y Wolverine lo reentrega.
    opts.Policies.UseDurableLocalQueues();

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

builder.Services.AddReviewsApplication();
builder.Services.AddReviewsInfrastructure(builder.Configuration);


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

// Catálogo del instrumento (ADR-0082): las frases del cuestionario y su versión vigente. Es catálogo
// de referencia, no corpus de demo, así que va gateado por IsDevelopment() solo: sin él no hay qué
// responder, y los integration tests corren en Development sin PLANB_SEED_CORPUS.
builder.Services.AddScoped<Planb.Reviews.Application.Seeding.CatalogSeeder>();
builder.Services.AddHostedService<CatalogSeedHostedService>();

// Corpus de demostración (#374): las reseñas que hacen que las fichas tengan qué mostrar. Es el
// nivel 2 de ADR-0058 y va gateado también por PLANB_SEED_CORPUS. Después del catálogo, que es
// contra cuyo instrumento se responden.
builder.Services.AddScoped<Planb.Reviews.Application.Seeding.CorpusSeeder>();
builder.Services.AddHostedService<CorpusSeedHostedService>();

// ------------------------------------------------------------------
// Traducción de violaciones de UNIQUE a 409. Ver UniqueViolationExceptionHandler: los índices
// únicos son la red para las carreras que el chequeo previo del handler no puede cerrar, y sin esto
// esa red se manifestaba como un 500.
// ------------------------------------------------------------------
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<Planb.Api.Infrastructure.UniqueViolationExceptionHandler>();

// ------------------------------------------------------------------
// HTTP pipeline
// ------------------------------------------------------------------
var app = builder.Build();

app.UseExceptionHandler();
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
