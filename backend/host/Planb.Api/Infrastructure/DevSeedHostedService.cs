using Planb.Identity.Application.Seeding;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Runs <see cref="IdentitySeeder"/> at host startup in Development. Lives next to
/// <see cref="DevMigrationsHostedService"/> for the same reason: hosted services run
/// inside <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}"/>
/// when the host is built, so integration tests get the same seeded personas as
/// <c>just dev</c>.
///
/// Order matters: this service must run AFTER migrations (otherwise there's no schema to
/// insert into). ASP.NET Core hosts hosted services in registration order, so Program.cs
/// must register migrations before seeding.
/// </summary>
public sealed class DevSeedHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly IHostEnvironment _env;
    private readonly ILogger<DevSeedHostedService> _log;

    public DevSeedHostedService(
        IServiceProvider sp,
        IHostEnvironment env,
        ILogger<DevSeedHostedService> log)
    {
        _sp = sp;
        _env = env;
        _log = log;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        if (!_env.IsDevelopment())
        {
            return;
        }

        try
        {
            using var scope = _sp.CreateScope();
            var seeder = scope.ServiceProvider.GetRequiredService<IdentitySeeder>();
            await seeder.SeedAsync(ct);
        }
        catch (Exception ex)
        {
            // Don't tumble the host: a seed failure is annoying but should not prevent the
            // dev server from starting. Other developers might rely on it for non-auth work.
            _log.LogError(ex, "Identity seeder failed; continuing without seeded personas.");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
