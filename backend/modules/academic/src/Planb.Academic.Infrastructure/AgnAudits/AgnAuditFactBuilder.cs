using System.Globalization;
using Planb.Academic.Domain.OfficialFacts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>Una institución del catálogo y, si el padrón de la AGN la tiene, su organismo (ver <see cref="AgnOrganismoCatalog"/>).</summary>
public sealed record AgnAuditSubject(Guid UniversityId, int? OrganismoId);

/// <summary>
/// Decide, para cada institución del catálogo, la afirmación de auditoría de la AGN (ADR-0090,
/// issue #506): Published con el informe más reciente si el organismo tiene alguno, o NotPublished
/// si no tiene informes o la institución ni siquiera está en el padrón. Sin HTTP ni base: es la
/// parte que se testea sola, contra listas armadas a mano (<see cref="AgnAuditImporter"/> es quien
/// la conecta con el fetch real y con la persistencia).
/// </summary>
public static class AgnAuditFactBuilder
{
    public const string SourceName = "AGN, Auditoría General de la Nación";

    /// <summary>Dónde se buscó cuando no hay informe que citar: el buscador público, no el endpoint JSON crudo.</summary>
    public const string SearchUrl = "https://www.agn.gob.ar/auditorias/buscador";

    private const string PublicBaseUrl = "https://www.agn.gob.ar";

    /// <summary>
    /// Todo o nada: si construir la afirmación de cualquier sujeto falla, corta ahí y no devuelve
    /// las que ya había armado. <see cref="AgnAuditImporter"/> depende de esto para no persistir
    /// nada cuando el resultado es una falla.
    /// </summary>
    public static Result<IReadOnlyList<OfficialFact>> Build(
        IReadOnlyList<AgnReport> reports,
        IReadOnlyList<AgnAuditSubject> subjects,
        DateTimeOffset now,
        Guid relievedBy,
        IDateTimeProvider clock)
    {
        var facts = new List<OfficialFact>(subjects.Count);

        foreach (var subject in subjects)
        {
            var factResult = subject.OrganismoId is int organismoId
                ? BuildForOrganismo(subject.UniversityId, organismoId, reports, now, relievedBy, clock)
                : BuildNotPublished(
                    subject.UniversityId, now, relievedBy, clock,
                    note: "La institución no figura en el padrón de organismos auditados de la AGN.");

            if (factResult.IsFailure)
            {
                return Result.Failure<IReadOnlyList<OfficialFact>>(factResult.Error);
            }

            facts.Add(factResult.Value);
        }

        return facts;
    }

    private static Result<OfficialFact> BuildForOrganismo(
        Guid universityId,
        int organismoId,
        IReadOnlyList<AgnReport> reports,
        DateTimeOffset now,
        Guid relievedBy,
        IDateTimeProvider clock)
    {
        var matches = reports.Where(r => r.OrganismoIds.Contains(organismoId)).ToList();
        if (matches.Count == 0)
        {
            return BuildNotPublished(universityId, now, relievedBy, clock, note: null);
        }

        // Más reciente por año publicado (lo que dice el checklist: "último informe [año]"),
        // desempatado por fecha del acta y, si hiciera falta, por número de resolución.
        var latest = matches
            .OrderByDescending(r => r.Ano ?? int.MinValue)
            .ThenByDescending(r => r.FechaActa ?? DateOnly.MinValue)
            .ThenByDescending(r => r.Resolucion ?? int.MinValue)
            .First();

        if (string.IsNullOrWhiteSpace(latest.Titulo)
            || latest.Ano is null
            || string.IsNullOrWhiteSpace(latest.PathAlias))
        {
            return AgnAuditErrors.IncompleteReport(organismoId);
        }

        var sourceDocument = latest.Resolucion is int resolucion
            ? $"Resolución AGN {resolucion}/{latest.Ano}"
            : null;

        return OfficialFact.Create(
            OfficialFactSubjectType.Institution,
            universityId,
            OfficialFactField.AgnAudit,
            OfficialFactStatus.Published,
            value: latest.Titulo,
            unit: null,
            period: latest.Ano.Value.ToString(CultureInfo.InvariantCulture),
            sourceName: SourceName,
            sourceUrl: $"{PublicBaseUrl}{latest.PathAlias}",
            sourceDocument: sourceDocument,
            sourceRetrievedAt: now,
            derivationRuleId: null,
            note: null,
            relievedAt: now,
            relievedBy: relievedBy,
            clock);
    }

    private static Result<OfficialFact> BuildNotPublished(
        Guid universityId,
        DateTimeOffset now,
        Guid relievedBy,
        IDateTimeProvider clock,
        string? note) =>
        OfficialFact.Create(
            OfficialFactSubjectType.Institution,
            universityId,
            OfficialFactField.AgnAudit,
            OfficialFactStatus.NotPublished,
            value: null,
            unit: null,
            period: null,
            sourceName: SourceName,
            sourceUrl: SearchUrl,
            sourceDocument: null,
            sourceRetrievedAt: now,
            derivationRuleId: null,
            note: note,
            relievedAt: now,
            relievedBy: relievedBy,
            clock);
}
