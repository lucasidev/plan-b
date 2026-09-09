using Microsoft.EntityFrameworkCore;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Infrastructure.Persistence;
using Planb.Reviews.Infrastructure.Persistence;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Aplica las migraciones pendientes de EF Core de los tres módulos. Vive separado de sus dos
/// llamadores (<see cref="DevMigrationsHostedService"/>, que migra solo en Development, y
/// <see cref="MigrateDbCommand"/>, el verbo `migrate-db` del deploy) para que ambos corran
/// exactamente el mismo código: sin este punto único, cada uno mantiene su propia copia del loop y
/// terminan divergiendo el día que alguien cambia uno y se olvida del otro.
/// </summary>
public static class EfCoreMigrator
{
    public static async Task MigrateAllAsync(
        IServiceProvider sp, Action<string> report, CancellationToken ct = default)
    {
        // El orden entre módulos no importa: no hay FK cross-schema (ADR-0017), así que ninguna
        // migración depende de otra de otro módulo.
        await MigrateAsync<IdentityDbContext>(sp, "Identity", report, ct);
        await MigrateAsync<AcademicDbContext>(sp, "Academic", report, ct);
        await MigrateAsync<ReviewsDbContext>(sp, "Reviews", report, ct);
    }

    private static async Task MigrateAsync<TContext>(
        IServiceProvider sp, string label, Action<string> report, CancellationToken ct)
        where TContext : DbContext
    {
        var db = sp.GetRequiredService<TContext>();
        var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();

        if (pending.Count == 0)
        {
            report($"{label}: sin migraciones pendientes.");
            return;
        }

        report($"{label}: aplicando {pending.Count} ({string.Join(", ", pending)})");
        await db.Database.MigrateAsync(ct);
    }
}
