using Carter;
using JasperFx;
using Microsoft.EntityFrameworkCore;
using JasperFx.CodeGeneration;
using JasperFx.Resources;
using Planb.Api.Infrastructure;
using Planb.Identity.Application;
using Planb.Identity.Infrastructure;
using Planb.Identity.Infrastructure.Persistence;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Serilog;
using StackExchange.Redis;
using Wolverine;
using Wolverine.EntityFrameworkCore;
using Wolverine.FluentValidation;
using Wolverine.Postgresql;

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
// IConnectionMultiplexer so handlers can pull it directly. AbortOnConnectFail =
// false means a Redis outage does NOT prevent the host from starting; per the
// ADR's degradation principle, each consumer handles unavailability locally
// (cache miss → DB, rate limiter unreachable → fail open, etc.).
//
// Skipped when no connection string is provided (e.g. some integration tests).
// Consumers must guard for missing IConnectionMultiplexer in that case.
// ------------------------------------------------------------------
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    {
        var options = ConfigurationOptions.Parse(redisConnectionString);
        options.AbortOnConnectFail = false;
        return ConnectionMultiplexer.Connect(options);
    });
}

// ------------------------------------------------------------------
// EF Core DbContext registered with Wolverine outbox integration. This makes
// IMessageBus.PublishAsync calls inside [Transactional] handlers enroll messages
// in the same Postgres transaction as SaveChangesAsync. See ADR-0015.
// ------------------------------------------------------------------
builder.Services.AddDbContextWithWolverineIntegration<IdentityDbContext>(opts =>
    Planb.Identity.Infrastructure.DependencyInjection.ConfigureIdentityDbContext(
        opts, connectionString));

// ------------------------------------------------------------------
// Wolverine (mediator + message bus + outbox + FluentValidation middleware)
// ------------------------------------------------------------------
builder.Host.UseWolverine(opts =>
{
    opts.Discovery.IncludeAssembly(typeof(Program).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Identity.Application.DependencyInjection).Assembly);

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

// In Development, apply EF migrations on host startup. Lives as a hosted
// service so WebApplicationFactory tests get the same treatment as `just dev`.
// See DevMigrationsHostedService for the why.
builder.Services.AddHostedService<DevMigrationsHostedService>();

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

// ------------------------------------------------------------------
// HTTP pipeline
// ------------------------------------------------------------------
var app = builder.Build();

app.UseSerilogRequestLogging();
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
