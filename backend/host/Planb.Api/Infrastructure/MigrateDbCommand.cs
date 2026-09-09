using JasperFx.CommandLine;
using JasperFx.Resources;

namespace Planb.Api.Infrastructure;

/// <summary>
/// `dotnet Planb.Api.dll migrate-db`: deja la base lista para que el api arranque en Production y
/// termina. Dos pasos: las migraciones pendientes de EF Core de los tres módulos y, después, los
/// recursos de Wolverine (el schema `wolverine` del outbox durable) que en Production nadie crea
/// solo (<c>ResourceAutoCreate = None</c>, ver el bloque <c>CritterStackDefaults</c> en
/// <c>Program.cs</c>).
///
/// <para>
/// Existe porque en producción nadie los aplica solo. <see cref="DevMigrationsHostedService"/> corta
/// si el entorno no es Development (a propósito: un arranque que migra solo es un arranque que hace
/// DDL sin que nadie lo haya decidido, y con más de una réplica es una carrera). Y el otro camino
/// habitual para EF, <c>dotnet ef database update</c>, no sirve acá: pide el SDK y las herramientas
/// de EF, que la imagen de runtime no tiene, y habría que correrlo tres veces con el nombre de cada
/// DbContext.
/// </para>
/// <para>
/// La parte de EF Core reusa <see cref="EfCoreMigrator"/>, el mismo código que corre
/// <see cref="DevMigrationsHostedService"/> en Development: un solo lugar para esa lógica, así el
/// hosted service y este verbo no pueden divergir. La parte de Wolverine llama a
/// <c>SetupResources</c> (JasperFx.Resources), la misma API que <c>UseResourceSetupOnStartup()</c>
/// usa para el auto-create de Development: acá se dispara a mano en vez de en cada arranque.
/// </para>
/// <para>
/// Es idempotente en los dos pasos, así que correrlo dos veces no hace nada la segunda. El deploy lo
/// corre antes de levantar la versión nueva. Ver <c>docs/engineering/deploy.md</c>.
/// </para>
/// </summary>
[Description("Deja la base lista: migraciones de EF Core + recursos de Wolverine", Name = "migrate-db")]
public sealed class MigrateDbCommand : JasperFxAsyncCommand<NetCoreInput>
{
    public override async Task<bool> Execute(NetCoreInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        using var host = input.BuildHost();
        using var scope = host.Services.CreateScope();

        await EfCoreMigrator.MigrateAllAsync(scope.ServiceProvider, Console.WriteLine);

        Console.WriteLine("Wolverine: aplicando recursos...");
        await host.SetupResources();
        Console.WriteLine("Wolverine: listo.");

        return true;
    }
}
