using Planb.Enrollments.Domain.HistorialImports;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Handler del GET /api/me/historial-imports/{id}. Resuelve el profile del user, busca el import
/// con ownership check (<c>FindByIdForOwnerAsync</c>) y devuelve el DTO. Si el import existe
/// pero pertenece a otro user, devuelve <see cref="HistorialImportErrors.NotFound"/> en lugar
/// de Forbidden — no leakeamos existencia.
/// </summary>
public static class GetHistorialImportQueryHandler
{
    public static async Task<Result<HistorialImportResponse>> Handle(
        GetHistorialImportQuery query,
        IHistorialImportRepository imports,
        IIdentityQueryService identity,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(query.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return HistorialImportErrors.StudentProfileRequired;
        }

        var import = await imports.FindByIdForOwnerAsync(
            new HistorialImportId(query.ImportId), profile.Id, ct);
        if (import is null)
        {
            return HistorialImportErrors.NotFound;
        }

        return import.ToResponse();
    }
}
