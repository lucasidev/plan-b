namespace Planb.Academic.Domain.Commissions;

/// <summary>
/// Rol de un docente dentro de una comisión (ENUM <c>commission_teacher_role</c> del data-model).
/// Una comisión tiene a lo sumo un <see cref="Lead"/> (invariante del aggregate); el resto de
/// los roles admiten múltiples docentes.
/// </summary>
public enum CommissionTeacherRole
{
    Lead,
    Associate,
    PracticalLead,
    Assistant,
    Guest,
}
