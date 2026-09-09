namespace Planb.Api.Infrastructure;

/// <summary>
/// Applies EF Core migrations on host startup, but only in Development. Production
/// deploys must run migrations explicitly through the deploy pipeline.
///
/// Lives as an <see cref="IHostedService"/> rather than inline in <c>Program.cs</c>
/// so that <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}"/>
/// also runs it: the factory builds the host and invokes hosted-service
/// <c>StartAsync</c>, but it never reaches the top-level <c>RunJasperFxCommands</c>
/// call. With the migration in a hosted service, dev runs and integration tests
/// share the same path.
///
/// Why migrate at startup at all: without this, `just dev` against a fresh
/// database fails with "relation identity.users does not exist". Even a manual
/// `just migrate` after the failure does not recover, because the Npgsql data
/// source cached the missing `identity.user_role` enum on its first
/// connection. Running migrations before any request reaches an enum-mapped
/// column avoids the stale cache.
///
/// Reusa <see cref="EfCoreMigrator"/> para el loop de migración: es el mismo código que corre el
/// verbo `migrate-db` (<see cref="MigrateDbCommand"/>) del deploy, así que este hosted service y ese
/// verbo no pueden divergir. Cuando aterrice un módulo nuevo con su propio DbContext, se agrega ahí,
/// no acá.
/// </summary>
public sealed class DevMigrationsHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly IHostEnvironment _env;
    private readonly ILogger<DevMigrationsHostedService> _log;

    public DevMigrationsHostedService(
        IServiceProvider sp,
        IHostEnvironment env,
        ILogger<DevMigrationsHostedService> log)
    {
        _sp = sp;
        _env = env;
        _log = log;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        if (!_env.IsDevelopment()) return;

        using var scope = _sp.CreateScope();
        await EfCoreMigrator.MigrateAllAsync(
            scope.ServiceProvider,
            message => _log.LogInformation("{Message}", message),
            ct);
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
