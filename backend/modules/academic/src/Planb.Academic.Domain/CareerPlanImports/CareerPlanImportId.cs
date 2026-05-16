namespace Planb.Academic.Domain.CareerPlanImports;

public readonly record struct CareerPlanImportId(Guid Value)
{
    public static CareerPlanImportId New() => new(Guid.NewGuid());
}
