using JasperFx.CommandLine;
using Microsoft.EntityFrameworkCore;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Enrollments.Infrastructure.Persistence;
using Planb.Identity.Infrastructure.Persistence;
using Planb.Reviews.Infrastructure.Persistence;

namespace Planb.Api.Infrastructure;

/// <summary>
/// `dotnet Planb.Api.dll migrate-db`: aplica las migraciones pendientes de EF Core de los seis
/// módulos y termina.
///
/// <para>
/// Existe porque en producción nadie las aplica solo. <see cref="DevMigrationsHostedService"/> corta
/// si el entorno no es Development (a propósito: un arranque que migra solo es un arranque que hace
/// DDL sin que nadie lo haya decidido, y con más de una réplica es una carrera). Y el otro camino
/// habitual, <c>dotnet ef database update</c>, no sirve acá: pide el SDK y las herramientas de EF,
/// que la imagen de runtime no tiene, y habría que correrlo seis veces con el nombre de cada
/// DbContext.
/// </para>
/// <para>
/// Es idempotente: <c>MigrateAsync</c> aplica solo lo pendiente, así que correrlo dos veces no hace
/// nada la segunda. El deploy lo corre antes de <c>db-apply</c> (que crea el schema del outbox de
/// Wolverine) y antes de levantar la versión nueva. Ver <c>docs/engineering/deploy.md</c>.
/// </para>
/// </summary>
[Description("Aplica las migraciones pendientes de EF Core de todos los módulos", Name = "migrate-db")]
public sealed class MigrateDbCommand : JasperFxAsyncCommand<NetCoreInput>
{
    public override async Task<bool> Execute(NetCoreInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        using var host = input.BuildHost();
        using var scope = host.Services.CreateScope();
        var sp = scope.ServiceProvider;

        // El orden entre módulos no importa: no hay FK cross-schema (ADR-0017), así que ninguna
        // migración depende de otra de otro módulo.
        await MigrateAsync<IdentityDbContext>(sp, "Identity");
        await MigrateAsync<AcademicDbContext>(sp, "Academic");
        await MigrateAsync<EnrollmentsDbContext>(sp, "Enrollments");
        await MigrateAsync<ReviewsDbContext>(sp, "Reviews");

        return true;
    }

    private static async Task MigrateAsync<TContext>(IServiceProvider sp, string label)
        where TContext : DbContext
    {
        var db = sp.GetRequiredService<TContext>();
        var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();

        if (pending.Count == 0)
        {
            Console.WriteLine($"{label}: sin migraciones pendientes.");
            return;
        }

        Console.WriteLine($"{label}: aplicando {pending.Count} ({string.Join(", ", pending)})");
        await db.Database.MigrateAsync();
        Console.WriteLine($"{label}: listo.");
    }
}
