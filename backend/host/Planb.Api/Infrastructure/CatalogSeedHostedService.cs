using Planb.Reviews.Application.Seeding;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Corre el <see cref="CatalogSeeder"/> en startup, en Development. Mismo patrón que
/// <see cref="AcademicSeedHostedService"/>, y por la misma razón: el catálogo de frases y su
/// instrumento son **catálogo de referencia del producto**, no corpus de demostración.
///
/// <para>
/// Por eso va gateado por <c>IsDevelopment()</c> solo (nivel 1 de ADR-0058) y NO por
/// <c>PLANB_SEED_CORPUS</c> (nivel 2). Sin este seed no hay cuestionario, y sin cuestionario no hay
/// reseña que responder: los integration tests, que corren en Development pero sin el corpus,
/// necesitan las frases para poder publicar una reseña contra la versión vigente del instrumento.
/// Dejarlo en el nivel 2 los habría dejado sin nada que contestar.
/// </para>
///
/// <para>
/// En producción no siembra, igual que el resto: ahí el catálogo lo carga la curaduría desde el
/// backoffice (US-198), que es donde ese contenido editorial se decide.
/// </para>
///
/// <para>
/// Debe registrarse DESPUÉS de <see cref="DevMigrationsHostedService"/>: el seeder asume que el
/// schema reviews ya existe.
/// </para>
/// </summary>
public sealed class CatalogSeedHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly IHostEnvironment _env;
    private readonly ILogger<CatalogSeedHostedService> _log;

    public CatalogSeedHostedService(
        IServiceProvider sp,
        IHostEnvironment env,
        ILogger<CatalogSeedHostedService> log)
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
            var seeder = scope.ServiceProvider.GetRequiredService<CatalogSeeder>();
            await seeder.SeedAsync(ct);
        }
        catch (Exception ex)
        {
            // Falla ruidoso, mismo criterio que el seed académico: sin catálogo de frases la API
            // arranca sin cuestionario, la pantalla Reseñar no tiene qué ofrecer y los tests fallan
            // todos por causas que no nombran el problema real.
            _log.LogError(ex, "Catalog seeder failed.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
