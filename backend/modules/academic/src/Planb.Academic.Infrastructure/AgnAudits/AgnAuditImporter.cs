using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Infrastructure.Persistence;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// Orquesta la tarea 18 de R6 (issue #506): trae los informes de la AGN, arma una afirmación de
/// auditoría por institución del catálogo (ADR-0090) y la persiste. Standalone: lo invoca el
/// comando <c>import-agn-audits</c> (host/Planb.Api/Infrastructure/ImportAgnAuditsCommand.cs) a
/// mano, nunca el seed automático de <c>just dev</c> ni el <c>seed-db</c> del stage. La API de la
/// AGN es de un tercero (482 páginas la primera vez que se comprobó, 2026-09-08): ni el arranque ni
/// un seed que corre en cada deploy pueden depender de que responda rápido, o de que responda.
///
/// <para>
/// Todo o nada: <see cref="AgnAuditFactBuilder.Build"/> arma la lista completa de afirmaciones en
/// memoria antes de que este método toque la base, así que un fallo del fetch o de la construcción
/// no deja filas nuevas. <see cref="AcademicDbContext.SaveChangesAsync"/> hace el resto en una sola
/// transacción: las N afirmaciones entran juntas o ninguna entra.
/// </para>
/// </summary>
public sealed class AgnAuditImporter
{
    /// <summary>
    /// RelievedBy de este import automático. Distinto del RelievedBy del relevamiento a mano de
    /// R6 tarea 3 (<c>OfficialFactSeedData.RelievedBy</c>, bloque 00000007): no corresponde a
    /// ningún User real de identity (ADR-0090, sin FK cross-módulo), y usar un bloque propio deja
    /// dicho, en la propia afirmación, que la cargó el comando y no una persona leyendo la fuente.
    /// </summary>
    public static readonly Guid SystemRelievedBy = Guid.Parse("00000009-0000-4000-a000-000000000001");

    private readonly AcademicDbContext _db;
    private readonly IAgnReportsClient _client;
    private readonly IOfficialFactRepository _officialFacts;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<AgnAuditImporter> _logger;

    public AgnAuditImporter(
        AcademicDbContext db,
        IAgnReportsClient client,
        IOfficialFactRepository officialFacts,
        IDateTimeProvider clock,
        ILogger<AgnAuditImporter> logger)
    {
        _db = db;
        _client = client;
        _officialFacts = officialFacts;
        _clock = clock;
        _logger = logger;
    }

    public async Task<Result<int>> ImportAsync(CancellationToken ct = default)
    {
        var reportsResult = await _client.FetchAllReportsAsync(ct);
        if (reportsResult.IsFailure)
        {
            _logger.LogWarning(
                "AgnAuditImporter: no se pudo traer los informes de la AGN ({Error}); no se cargó nada.",
                reportsResult.Error);
            return Result.Failure<int>(reportsResult.Error);
        }

        var universityIds = await _db.Universities
            .AsNoTracking()
            .Select(u => u.Id)
            .ToListAsync(ct);

        var subjects = universityIds
            .Select(id => new AgnAuditSubject(id.Value, AgnOrganismoCatalog.TryGetOrganismoId(id.Value)))
            .ToList();

        var now = _clock.UtcNow;
        var factsResult = AgnAuditFactBuilder.Build(
            reportsResult.Value, subjects, now, SystemRelievedBy, _clock);
        if (factsResult.IsFailure)
        {
            _logger.LogWarning(
                "AgnAuditImporter: no se pudo construir alguna afirmación ({Error}); no se cargó nada.",
                factsResult.Error);
            return Result.Failure<int>(factsResult.Error);
        }

        foreach (var fact in factsResult.Value)
        {
            await _officialFacts.AddAsync(fact, ct);
        }
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "AgnAuditImporter: cargadas {Count} afirmaciones de auditoría.", factsResult.Value.Count);
        return factsResult.Value.Count;
    }
}
