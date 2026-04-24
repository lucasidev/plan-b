using Carter;
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
// Wolverine (mediator + message bus + outbox)
// See ADR-0015 for rationale.
// ------------------------------------------------------------------
builder.Host.UseWolverine(opts =>
{
    // Discovery: all loaded assemblies with handlers.
    opts.Discovery.IncludeAssembly(typeof(Program).Assembly);

    // TODO: Register each module's assembly for handler discovery as modules are added.
    // opts.Discovery.IncludeAssembly(typeof(Planb.Identity.Application.DependencyInjection).Assembly);

    // TODO: Configure Postgres outbox once connection strings are in place.
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
// Will be added as the modules are implemented.
// ------------------------------------------------------------------
// builder.Services.AddIdentityApplication();
// builder.Services.AddIdentityInfrastructure(builder.Configuration);
// builder.Services.AddAcademicApplication();
// builder.Services.AddAcademicInfrastructure(builder.Configuration);
// builder.Services.AddEnrollmentsApplication();
// builder.Services.AddEnrollmentsInfrastructure(builder.Configuration);
// builder.Services.AddReviewsApplication();
// builder.Services.AddReviewsInfrastructure(builder.Configuration);
// builder.Services.AddModerationApplication();
// builder.Services.AddModerationInfrastructure(builder.Configuration);

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
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.Run();

// Exposed for WebApplicationFactory in integration tests.
public partial class Program;
