using Microsoft.EntityFrameworkCore;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Infrastructure.Persistence;

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
/// Aplica migraciones de TODOS los DbContexts registrados (Identity, Academic, ...).
/// Cuando aterrice un módulo nuevo con su propio DbContext, agregar otro
/// <see cref="MigrateAsync{TContext}"/> a <see cref="StartAsync"/>.
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

        await MigrateAsync<IdentityDbContext>(scope.ServiceProvider, "Identity", ct);
        await MigrateAsync<AcademicDbContext>(scope.ServiceProvider, "Academic", ct);
    }

    private async Task MigrateAsync<TContext>(
        IServiceProvider sp, string label, CancellationToken ct)
        where TContext : DbContext
    {
        var db = sp.GetRequiredService<TContext>();
        var pending = await db.Database.GetPendingMigrationsAsync(ct);
        var pendingList = pending.ToList();
        if (pendingList.Count == 0) return;

        _log.LogInformation(
            "Applying {Count} pending {Label} migrations: {Migrations}",
            pendingList.Count, label, string.Join(", ", pendingList));
        await db.Database.MigrateAsync(ct);
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
