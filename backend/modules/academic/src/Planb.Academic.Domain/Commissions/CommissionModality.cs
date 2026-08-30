namespace Planb.Academic.Domain.Commissions;

/// <summary>
/// Modalidad de cursada de una comisión (ENUM <c>commission_modality</c> del data-model).
/// Persistida como string (PascalCase) vía HasConversion, igual que el resto de los enums del
/// dominio (CareerPlanImportStatus, CommissionTeacherRole).
/// </summary>
public enum CommissionModality
{
    Presencial,
    Virtual,
    Hibrida,
}
