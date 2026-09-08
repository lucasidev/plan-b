using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;
using Planb.Reviews.Application.Seeding;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Corre el <see cref="CorpusSeeder"/> en startup (#374), en Development y solo si está
/// <c>PLANB_SEED_CORPUS</c>.
///
/// <para>
/// Es el nivel 2 de ADR-0058, a diferencia del catálogo académico y del de frases, que son catálogo
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
    /// <summary>
    /// Tiene que matchear el mail de <c>seed-data/personas.json</c>: es la única persona sembrada a
    /// la que el corpus le suma reseñas propias.
    /// </summary>
    private const string LuciaEmail = "lucia.mansilla@gmail.com";

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
            var luciaAccountId = await ResolveLuciaAccountIdAsync(scope.ServiceProvider, ct);
            var seeder = scope.ServiceProvider.GetRequiredService<CorpusSeeder>();
            await seeder.SeedAsync(luciaAccountId, ct);
        }
        catch (Exception ex)
        {
            // Falla ruidoso: el corpus se pide explícitamente con una variable, así que si se pidió
            // y no entró, arrancar igual deja las fichas en cero sin decir por qué.
            _log.LogError(ex, "Corpus seeder failed.");
            throw;
        }
    }

    /// <summary>
    /// El id real de lucia.mansilla, sembrada por <c>DevSeedHostedService</c> antes que este
    /// servicio corra (ver el orden de registro en Program.cs). Nace random al registrarse (
    /// <c>User.Register</c> no acepta un id determinístico), así que no hay forma de conocerlo de
    /// antemano: hay que resolverlo contra identity en cada arranque. Null si por algún motivo la
    /// persona no está sembrada (el corpus sigue igual, solo sin sus dos reseñas propias).
    /// </summary>
    private static async Task<Guid?> ResolveLuciaAccountIdAsync(IServiceProvider services, CancellationToken ct)
    {
        var emailResult = EmailAddress.Create(LuciaEmail);
        if (emailResult.IsFailure)
        {
            return null;
        }

        var users = services.GetRequiredService<IUserRepository>();
        var lucia = await users.FindByEmailAsync(emailResult.Value, ct);
        return lucia?.Id.Value;
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
