namespace Planb.Academic.Domain.Chairs;

/// <summary>
/// Rol de un docente dentro de una cátedra. Una cátedra tiene a lo sumo un <see cref="Lead"/>
/// vigente (invariante del aggregate); el resto de los roles admiten varios docentes a la vez.

/// </summary>
public enum ChairMemberRole
{
    Lead,
    Associate,
    PracticalLead,
    Assistant,
    Guest,
}
