using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Commissions;
using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Handler del PUT /api/academic/commissions/{id} (admin). Subject/term no cambian (ya se validó su
/// coherencia al crear la comisión, y la ruta no los recibe), pero cada docente del payload se
/// revalida contra la universidad del term: un docente nuevo agregado en la edición podría ser de
/// otra universidad. 404 si la comisión no existe.
/// </summary>
public static class UpdateCommissionCommandHandler
{
    public static async Task<Result<UpdateCommissionResponse>> Handle(
        UpdateCommissionCommand command,
        ICommissionRepository commissions,
        IAcademicTermRepository terms,
        ITeacherRepository teachers,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var commission = await commissions.GetByIdAsync(new CommissionId(command.CommissionId), ct);
        if (commission is null)
        {
            return CommissionErrors.NotFound;
        }

        var trimmedName = command.Name.Trim();
        if (await commissions.ExistsByNameAsync(
            commission.SubjectId, commission.TermId, trimmedName, commission.Id, ct))
        {
            return CommissionErrors.NameAlreadyExists;
        }

        var term = await terms.FindByIdAsync(new AcademicTermId(commission.TermId), ct);
        if (term is null)
        {
            return CommissionErrors.TermNotFound;
        }

        var assignments = new List<(TeacherId TeacherId, CommissionTeacherRole Role)>();
        foreach (var item in command.Teachers)
        {
            var teacher = await teachers.GetByIdAsync(new TeacherId(item.TeacherId), ct);
            if (teacher is null)
            {
                return CommissionErrors.TeacherNotFound;
            }
            if (teacher.UniversityId.Value != term.UniversityId.Value)
            {
                return CommissionErrors.UniversityMismatch;
            }
            assignments.Add((teacher.Id, item.Role));
        }

        // TODO(US-093): rechazar el cambio de modality si la comisión ya tiene inscriptos (409,
        // cross-BC Enrollments). Diferido: requiere un read a Enrollments que hoy no existe.

        // Reconfiguración atómica: valida metadata + docentes + horarios y solo entonces muta (o no
        // muta nada si algo falla). Un fallo tardío no puede dejar el aggregate a medias, porque
        // Wolverine commitea la transacción aunque el handler devuelva Result.Failure (no es una
        // excepción). Ver el review de US-093.
        var reconfigured = commission.Reconfigure(
            command.Name,
            command.Modality,
            command.Capacity,
            command.Notes,
            assignments,
            command.Schedule.Select(s => (s.Day, s.Start, s.End)),
            clock);
        if (reconfigured.IsFailure)
        {
            return reconfigured.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UpdateCommissionResponse(commission.Id.Value);
    }
}
