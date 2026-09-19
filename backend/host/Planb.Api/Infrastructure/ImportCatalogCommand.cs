using System.Text.Json;
using JasperFx.CommandLine;
using Planb.Academic.Infrastructure.CatalogImport;
using Planb.Academic.Infrastructure.Spu;

namespace Planb.Api.Infrastructure;

[Description("Importa un snapshot validado del catálogo nacional SIU", Name = "import-catalog")]
public sealed class ImportCatalogCommand : JasperFxAsyncCommand<ImportCatalogCommand.Input>
{
    public sealed class Input : NetCoreInput
    {
        [Description("Ruta al snapshot JSON de la Guía SIU")]
        public string Snapshot { get; set; } = string.Empty;
    }

    public override async Task<bool> Execute(Input input)
    {
        ArgumentNullException.ThrowIfNull(input);
        if (string.IsNullOrWhiteSpace(input.Snapshot) || !File.Exists(input.Snapshot))
            throw new InvalidOperationException("A readable SIU snapshot path is required.");

        await using var stream = File.OpenRead(input.Snapshot);
        await ReviewedCatalogSnapshot.VerifyAsync(stream);
        stream.Position = 0;
        var snapshot = await JsonSerializer.DeserializeAsync<SiuCatalogSnapshot>(stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("The SIU snapshot is empty or invalid JSON.");
        var errors = SiuCatalogSnapshotValidator.Validate(snapshot);
        if (errors.Count > 0) throw new InvalidOperationException("Invalid SIU snapshot: " + string.Join(" ", errors));

        using var host = input.BuildHost();
        using var scope = host.Services.CreateScope();
        var result = await scope.ServiceProvider.GetRequiredService<SiuCatalogImporter>().ImportAsync(snapshot);
        Console.WriteLine($"SIU: universidades nuevas {result.UniversitiesCreated}, unidades nuevas {result.AcademicUnitsCreated}, ofertas nuevas {result.CareersCreated}, datos oficiales nuevos {result.OfficialFactsCreated}, Tucumán preservadas {result.TucumanOfferingsPreserved}, pendientes {result.Pending.Count}.");
        foreach (var pending in result.Pending) Console.WriteLine($"Pendiente: {pending}");
        var spu = ActivatorUtilities.CreateInstance<SpuInstitutionImporter>(scope.ServiceProvider);
        Console.WriteLine($"SPU: {await spu.ImportAsync()} hechos institucionales agregados.");
        return true;
    }
}
