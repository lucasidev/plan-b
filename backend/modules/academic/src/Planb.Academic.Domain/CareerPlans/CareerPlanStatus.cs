namespace Planb.Academic.Domain.CareerPlans;

/// <summary>
/// Estado del plan de estudios. <see cref="Active"/> es el plan vigente para nuevos ingresos;
/// <see cref="Deprecated"/> es histórico (ya no se inscribe nadie pero alumnos previos siguen
/// asociados). Cuando una universidad reemplaza un plan, el viejo pasa a Deprecated y el nuevo
/// nace Active.
/// </summary>
public enum CareerPlanStatus
{
    Active,
    Deprecated,
}
