using Planb.Academic.Application.Abstractions.AgnAudits;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// Handler del POST /api/academic/agn-audits/import (admin, issue #506). Delega todo en
/// <see cref="IAgnAuditImporter"/>: el control contra la trampa, el fetch por organismo y el
/// todo-o-nada al persistir viven en la implementación (Infrastructure), no acá.
/// </summary>
public static class ImportAgnAuditsCommandHandler
{
    public static async Task<Result<ImportAgnAuditsResponse>> Handle(
        ImportAgnAuditsCommand command,
        IAgnAuditImporter importer,
        CancellationToken ct)
    {
        var result = await importer.ImportAsync(ct);
        if (result.IsFailure)
        {
            return result.Error;
        }

        return new ImportAgnAuditsResponse(result.Value);
    }
}
