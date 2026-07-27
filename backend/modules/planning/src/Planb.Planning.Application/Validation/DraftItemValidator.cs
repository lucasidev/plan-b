using Planb.Academic.Application.Contracts;
using Planb.Planning.Domain.Drafts;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Validation;

/// <summary>
/// Valida las referencias cross-BC de los items de un borrador contra el catálogo de Academic:
/// materia en el plan del alumno, período de su universidad, y comisión que exista, sea de esa
/// materia, de ese período y siga ofreciéndose.
///
/// <para>
/// Vive afuera de las dos features porque las dos la necesitan con la misma forma (guardar borrador
/// nuevo y editar uno existente); la única diferencia es de dónde sale el período, que se pasa como
/// parámetro. Antes ninguna de las dos validaba nada más allá de la materia, y el propio docstring
/// del handler de creación lo admitía ("No valida término ni comisión").
/// </para>
///
/// <para>
/// Por qué importa: los items del borrador se publican. Un borrador compartido aparece en el feed de
/// la comunidad del plan (US-027) con el nombre de la comisión resuelto por join, así que una
/// comisión de otra materia o de otro año se le mostraba a los demás alumnos como si fuera la oferta
/// de esa materia. Y una vez publicado, el read no tiene forma de distinguir "el alumno se equivocó"
/// de "la comisión cambió", que es exactamente la razón para validar al escribir.
/// </para>
/// </summary>
internal static class DraftItemValidator
{
    public static async Task<Result> ValidateAsync(
        IAcademicQueryService academic,
        Guid careerPlanId,
        Guid termId,
        IReadOnlyList<(Guid SubjectId, Guid? CommissionId)> items,
        CancellationToken ct)
    {
        var plan = await academic.GetCareerPlanByIdAsync(careerPlanId, ct);
        if (plan is null)
        {
            return SimulationDraftErrors.SubjectNotInPlan;
        }

        if (!await academic.IsAcademicTermInUniversityAsync(termId, plan.UniversityId, ct))
        {
            return SimulationDraftErrors.TermNotInUniversity;
        }

        foreach (var subjectId in items.Select(i => i.SubjectId).Distinct())
        {
            if (!await academic.IsSubjectInPlanAsync(subjectId, careerPlanId, ct))
            {
                return SimulationDraftErrors.SubjectNotInPlan;
            }
        }

        foreach (var (subjectId, commissionId) in items.Where(i => i.CommissionId is not null))
        {
            var placement = await academic.GetCommissionPlacementAsync(commissionId!.Value, ct);
            if (placement is null)
            {
                return SimulationDraftErrors.CommissionNotFound;
            }
            if (placement.SubjectId != subjectId)
            {
                return SimulationDraftErrors.CommissionNotForSubject;
            }
            if (placement.TermId != termId)
            {
                return SimulationDraftErrors.CommissionNotForTerm;
            }
            if (!placement.IsActive)
            {
                return SimulationDraftErrors.CommissionInactive;
            }
        }

        return Result.Success();
    }
}
