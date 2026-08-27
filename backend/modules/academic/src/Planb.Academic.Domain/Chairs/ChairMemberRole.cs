namespace Planb.Academic.Domain.Chairs;

/// <summary>
/// Rol de un docente dentro de una cátedra. Una cátedra tiene a lo sumo un <see cref="Lead"/>
/// vigente (invariante del aggregate); el resto de los roles admiten varios docentes a la vez.
///
/// <para>
/// Repite los valores de <c>CommissionTeacherRole</c> a propósito, sin compartir el tipo: la
/// comisión es de un período y la cátedra persiste entre períodos, así que sus listas de roles
/// pueden separarse sin que una arrastre a la otra. Unificarlas hoy costaría migrar el enum ya
/// persistido de la comisión, y no compra nada.
/// </para>
/// </summary>
public enum ChairMemberRole
{
    Lead,
    Associate,
    PracticalLead,
    Assistant,
    Guest,
}
