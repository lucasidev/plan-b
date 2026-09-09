using JasperFx.CommandLine;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Application.Seeding;
using Planb.Reviews.Application.Seeding;

namespace Planb.Api.Infrastructure;

/// <summary>
/// `dotnet Planb.Api.dll seed-db`: corre las siembras (personas, catálogo académico, catálogo de
/// frases y corpus de reseñas) y termina.
///
/// <para>
/// Solo lo invoca el stage (<c>docker-compose.stage.yml</c>), después de <see cref="MigrateDbCommand"/>
/// y contra el schema que ese verbo dejó listo. Producción no lo corre nunca, ni por error de
/// configuración: el servicio que lo invocaría no existe en <c>docker-compose.prod.yml</c>, así que
/// no hace falta (ni alcanza) un flag interno para protegerla.
/// </para>
/// <para>
/// Llama a los mismos <c>*Seeder</c> del Application layer de cada módulo que
/// <see cref="DevSeedHostedService"/>, <see cref="AcademicSeedHostedService"/>,
/// <see cref="CatalogSeedHostedService"/> y <see cref="CorpusSeedHostedService"/> corren en
/// Development: la lógica de siembra vive en esas clases, no acá, así que no hay dos copias que
/// puedan divergir. A diferencia de <see cref="DevSeedHostedService"/>, que traga un fallo de la
/// siembra de personas para no tumbar `just dev`, acá cualquier fallo se propaga: es un paso de
/// deploy sin supervisión, y un stage a medio sembrar es peor que uno que no arrancó.
/// </para>
/// <para>
/// Todos los seeders son idempotentes por identidad semántica (no por "la tabla está vacía"), así
/// que correr este verbo dos veces no duplica nada.
/// </para>
/// </summary>
[Description("Corre las siembras del stage: personas, catálogo académico, catálogo de frases y corpus", Name = "seed-db")]
public sealed class SeedDbCommand : JasperFxAsyncCommand<NetCoreInput>
{
    public override async Task<bool> Execute(NetCoreInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        using var host = input.BuildHost();
        using var scope = host.Services.CreateScope();
        var sp = scope.ServiceProvider;

        Console.WriteLine("Identity: sembrando personas...");
        await sp.GetRequiredService<IdentitySeeder>().SeedAsync();

        Console.WriteLine("Academic: sembrando catálogo...");
        await sp.GetRequiredService<AcademicSeeder>().SeedAsync();

        Console.WriteLine("Reviews: sembrando catálogo de frases...");
        await sp.GetRequiredService<CatalogSeeder>().SeedAsync();

        Console.WriteLine("Reviews: sembrando corpus...");
        var luciaAccountId = await LuciaAccountResolver.ResolveAsync(sp, CancellationToken.None);
        await sp.GetRequiredService<CorpusSeeder>().SeedAsync(luciaAccountId);

        Console.WriteLine("Siembras: listo.");
        return true;
    }
}
