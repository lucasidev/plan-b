using Planb.Academic.Domain.Teachers;

namespace Planb.Academic.Domain.Commissions;

/// <summary>
/// Child entity de <see cref="Commission"/>: la asignación de un docente a la comisión con su rol.
/// Identidad compuesta <c>(commission_id, teacher_id)</c> (data-model), no tiene id sintético. Vive
/// dentro del aggregate boundary de Commission y se carga eager con él (OwnsMany + AutoInclude).
/// El ctor es internal: solo <see cref="Commission"/> crea instancias (al asignar o hidratar), lo
/// que mantiene los invariantes (no duplicar, un solo titular) dentro del aggregate.
/// </summary>
public sealed class CommissionTeacher
{
    public TeacherId TeacherId { get; private set; }
    public CommissionTeacherRole Role { get; private set; }

    private CommissionTeacher() { }

    internal CommissionTeacher(TeacherId teacherId, CommissionTeacherRole role)
    {
        TeacherId = teacherId;
        Role = role;
    }
}
