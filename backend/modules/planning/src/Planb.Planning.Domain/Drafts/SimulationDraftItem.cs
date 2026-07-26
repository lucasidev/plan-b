namespace Planb.Planning.Domain.Drafts;

/// <summary>
/// Child entity de <see cref="SimulationDraft"/> (US-023): una materia (+ opcionalmente la comisión
/// elegida) que compone la simulación. Identidad compuesta <c>(draft_id, subject_id)</c>, sin id
/// sintético: una materia no se repite en el mismo borrador. Vive dentro del aggregate boundary y se
/// carga eager con él (OwnsMany + AutoInclude), mismo patrón que CommissionTeacher/CommissionSchedule
/// en Academic. El ctor es internal: solo <see cref="SimulationDraft"/> crea instancias.
/// </summary>
public sealed class SimulationDraftItem
{
    public Guid SubjectId { get; private set; }
    public Guid? CommissionId { get; private set; }

    private SimulationDraftItem() { }

    internal SimulationDraftItem(Guid subjectId, Guid? commissionId)
    {
        SubjectId = subjectId;
        CommissionId = commissionId;
    }
}
