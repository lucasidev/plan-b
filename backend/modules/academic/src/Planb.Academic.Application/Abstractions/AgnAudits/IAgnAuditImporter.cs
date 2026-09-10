using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Abstractions.AgnAudits;

/// <summary>
/// Port para disparar la importación de auditorías de la AGN (issue #506, ADR-0090). La impl
/// concreta vive en Infrastructure (<c>AgnAuditImporter</c>): trae los informes por organismo, arma
/// una afirmación por institución y persiste todo o nada. El handler que la dispara solo conoce
/// este contrato, igual que <c>IPdfTextExtractor</c> para la extracción de PDF.
/// </summary>
public interface IAgnAuditImporter
{
    Task<Result<int>> ImportAsync(CancellationToken ct = default);
}
