using Planb.Reviews.Application.Seeding;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Corre el <see cref="CorpusSeeder"/> en startup (#374), en Development y solo si está
/// <c>PLANB_SEED_CORPUS</c>.
///
/// <para>
/// Es el nivel 2 de ADR-0058, a diferencia del catálogo académico y del de ítems, que son catálogo
/// de referencia y van en el nivel 1. La distinción es la que gobierna el gate: sin el catálogo la
/// API no tiene qué responder, y sin el corpus tiene todo lo que necesita para funcionar, solo que
/// en cero. Los integration tests corren en Development sin la variable, así que su base sigue
/// naciendo sin una sola reseña y sus conteos siguen siendo los que ellos publican.
/// </para>
///
/// <para>
/// Debe registrarse DESPUÉS de <see cref="CatalogSeedHostedService"/>: las reseñas del corpus se
/// responden contra el instrumento vigente, que lo siembra aquel.
/// </para>
/// </summary>
public sealed class CorpusSeedHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly IHostEnvironment _env;
    private readonly ILogger<CorpusSeedHostedService> _log;

    public CorpusSeedHostedService(
        IServiceProvider sp,
        IHostEnvironment env,
        ILogger<CorpusSeedHostedService> log)
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

        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("PLANB_SEED_CORPUS")))
        {
            return;
        }

        try
        {
            using var scope = _sp.CreateScope();
            var seeder = scope.ServiceProvider.GetRequiredService<CorpusSeeder>();
            await seeder.SeedAsync(ct);
        }
        catch (Exception ex)
        {
            // Falla ruidoso: el corpus se pide explícitamente con una variable, así que si se pidió
            // y no entró, arrancar igual deja las fichas en cero sin decir por qué.
            _log.LogError(ex, "Corpus seeder failed.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
