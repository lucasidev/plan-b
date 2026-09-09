using JasperFx.CommandLine;
using Planb.Academic.Infrastructure.AgnAudits;

namespace Planb.Api.Infrastructure;

/// <summary>
/// `dotnet Planb.Api.dll import-agn-audits`: trae los informes de la AGN y carga una afirmación de
/// auditoría por institución del catálogo (ADR-0090, R6 tarea 18, <see
/// href="https://github.com/lucasidev/plan-b/issues/506">#506</see>).
///
/// <para>
/// Comando aparte, no un paso del seed automático: la API de la AGN es de un tercero (482 páginas
/// la primera vez que se comprobó, 2026-09-08) que puede tardar, no responder, o cambiar de forma.
/// Nada de eso puede tumbar <c>just dev</c> (el <see cref="AcademicSeedHostedService"/> corre en
/// cada arranque de Development) ni el <c>seed-db</c> del stage (corre en cada deploy a main). Se
/// invoca a mano, cuando alguien del equipo quiere refrescar el checklist de auditorías; no hay
/// automatización sin supervisión todavía porque no la pidió el issue.
/// </para>
/// <para>
/// <see cref="AgnAuditImporter"/> hace todo o nada: si el fetch o la construcción de alguna
/// afirmación falla, no guarda nada, y este comando lo refleja devolviendo <c>false</c> (falla,
/// sin tumbar el proceso) en vez de tirar.
/// </para>
/// </summary>
[Description("Carga afirmaciones de auditoría de la AGN por institución (ADR-0090)", Name = "import-agn-audits")]
public sealed class ImportAgnAuditsCommand : JasperFxAsyncCommand<NetCoreInput>
{
    public override async Task<bool> Execute(NetCoreInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        using var host = input.BuildHost();
        using var scope = host.Services.CreateScope();

        Console.WriteLine("AGN: paginando informes y filtrando por organismo...");
        var result = await scope.ServiceProvider
            .GetRequiredService<AgnAuditImporter>()
            .ImportAsync();

        if (result.IsFailure)
        {
            Console.WriteLine($"AGN: la carga falló, no se guardó nada. {result.Error.Message}");
            return false;
        }

        Console.WriteLine($"AGN: {result.Value} afirmaciones de auditoría cargadas.");
        return true;
    }
}
