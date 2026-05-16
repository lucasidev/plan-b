using Planb.Academic.Domain.CareerPlanImports;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.CareerPlanImports;

public static class GetCareerPlanImportQueryHandler
{
    public static async Task<Result<CareerPlanImportResponse>> Handle(
        GetCareerPlanImportQuery query,
        ICareerPlanImportRepository imports,
        CancellationToken ct)
    {
        var import = await imports.FindByIdForOwnerAsync(
            new CareerPlanImportId(query.ImportId), query.UserId, ct);
        if (import is null)
        {
            return CareerPlanImportErrors.NotFound;
        }
        return import.ToResponse();
    }
}
