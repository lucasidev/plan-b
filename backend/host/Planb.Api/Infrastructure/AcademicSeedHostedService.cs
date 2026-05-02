using Planb.Academic.Infrastructure.Seeding;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Mismo patrón que <see cref="DevSeedHostedService"/> de Identity: corre el
/// <see cref="AcademicSeeder"/> en startup en Development. Se debe registrar DESPUÉS de
/// <see cref="DevMigrationsHostedService"/> porque el seeder asume que el schema academic
/// ya existe.
///
/// El seeder es idempotente, así que correrlo siempre en Development (incluyendo desde
/// WebApplicationFactory en integration tests) es seguro y no duplica.
/// </summary>
public sealed class AcademicSeedHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly IHostEnvironment _env;
    private readonly ILogger<AcademicSeedHostedService> _log;

    public AcademicSeedHostedService(
        IServiceProvider sp,
        IHostEnvironment env,
        ILogger<AcademicSeedHostedService> log)
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
            var seeder = scope.ServiceProvider.GetRequiredService<AcademicSeeder>();
            await seeder.SeedAsync(ct);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Academic seeder failed; continuing without seeded catalog data.");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
