using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Planb.Identity.Application.Features.ExpireUnverifiedRegistrations;
using Wolverine;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Scheduled job de US-022: dispara <see cref="ExpireUnverifiedRegistrationsCommand"/> diariamente.
///
/// Implementación con <see cref="PeriodicTimer"/> + <see cref="IMessageBus"/> en lugar de
/// Wolverine's built-in scheduling porque:
/// <list type="bullet">
///   <item>API .NET standard, sin provider lock-in.</item>
///   <item>Trivial de testear (los integration tests llaman al handler directamente; el scheduler
///         como hosted service se registra pero no interfiere porque el primer fire ocurre 24h
///         post-startup).</item>
///   <item>Si aparece la necesidad de varios jobs scheduled, se evalúa migrar a
///         Wolverine.Scheduled o Hangfire; un timer alcanza para un job único.</item>
/// </list>
///
/// Single-instance assumption: el host corre en una sola instancia (Dokploy). Si se escala
/// horizontalmente, este scheduler necesita leader election (lease distribuido en Redis o
/// Postgres advisory lock). El idempotency del comando (el handler tolera concurrent runs
/// porque el aggregate rechaza re-expirar) limita el blast radius si corriera en N instancias.
/// </summary>
internal sealed class UnverifiedRegistrationExpirationScheduler : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromDays(1);

    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<UnverifiedRegistrationExpirationScheduler> _logger;

    public UnverifiedRegistrationExpirationScheduler(
        IServiceScopeFactory scopes,
        ILogger<UnverifiedRegistrationExpirationScheduler> logger)
    {
        _scopes = scopes;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "UnverifiedRegistrationExpirationScheduler: started, interval {Interval}", Interval);

        using var timer = new PeriodicTimer(Interval);

        try
        {
            // Primer fire después de Interval. No corremos al startup para evitar surprises en
            // dev local cuando alguien levanta el backend con seed fresh.
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await DispatchAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Shutdown limpio. PeriodicTimer.WaitForNextTickAsync respeta el token.
        }
    }

    private async Task DispatchAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopes.CreateScope();
            var bus = scope.ServiceProvider.GetRequiredService<IMessageBus>();
            await bus.InvokeAsync(new ExpireUnverifiedRegistrationsCommand(), ct);
        }
        catch (Exception ex)
        {
            // Una corrida fallida no debe matar el scheduler. La próxima corre en 24h.
            _logger.LogError(
                ex,
                "UnverifiedRegistrationExpirationScheduler: dispatch failed, will retry next tick");
        }
    }
}
