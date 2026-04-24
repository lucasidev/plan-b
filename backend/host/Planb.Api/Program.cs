using Carter;
using Planb.Identity.Application;
using Planb.Identity.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Serilog;
using Wolverine;

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

// ------------------------------------------------------------------
// Wolverine (mediator + message bus + outbox)
// See ADR-0015 for rationale.
// ------------------------------------------------------------------
builder.Host.UseWolverine(opts =>
{
    // Discovery: host + each module's Application assembly.
    opts.Discovery.IncludeAssembly(typeof(Program).Assembly);
    opts.Discovery.IncludeAssembly(typeof(Planb.Identity.Application.DependencyInjection).Assembly);

    // TODO: Configure Postgres outbox once a module emits integration events.
    // var connStr = builder.Configuration.GetConnectionString("PlanbWolverine");
    // opts.PersistMessagesWithPostgreSql(connStr!, "wolverine");
    // opts.Policies.AutoApplyTransactions();
});

// ------------------------------------------------------------------
// Carter (endpoint discovery)
// See ADR-0016 for rationale.
// ------------------------------------------------------------------
builder.Services.AddCarter();

// ------------------------------------------------------------------
// Modules (each module registers its Application + Infrastructure).
// ------------------------------------------------------------------
builder.Services.AddIdentityApplication();
builder.Services.AddIdentityInfrastructure(builder.Configuration);

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

app.Run();

// Exposed for WebApplicationFactory in integration tests.
public partial class Program;
