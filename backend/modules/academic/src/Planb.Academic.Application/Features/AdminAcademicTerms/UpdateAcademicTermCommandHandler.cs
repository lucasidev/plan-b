using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Commissions;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// Handler del PATCH /api/academic/academic-terms/{id} (admin). Carga el aggregate, recomputa el
/// label a partir de los nuevos year/number/kind, revalida el UNIQUE (excluyendo el propio id) y
/// persiste. 404 si el período no existe.
///
/// <para>
/// La cadencia (<c>Kind</c>) se congela apenas el período tiene comisiones: ver
/// <see cref="AcademicTermErrors.KindLockedByCommissions"/>.
/// </para>
/// </summary>
public static class UpdateAcademicTermCommandHandler
{
    public static async Task<Result<UpdateAcademicTermResponse>> Handle(
        UpdateAcademicTermCommand command,
        IAcademicTermRepository terms,
        ICommissionRepository commissions,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var term = await terms.FindByIdAsync(new AcademicTermId(command.AcademicTermId), ct);
        if (term is null)
        {
            return AcademicTermErrors.NotFound;
        }

        if (command.Kind != term.Kind
            && await commissions.ExistsForTermAsync(term.Id.Value, ct))
        {
            return AcademicTermErrors.KindLockedByCommissions;
        }

        if (await terms.ExistsAsync(
            term.UniversityId, command.Year, command.Number, command.Kind, term.Id, ct))
        {
            return AcademicTermErrors.AlreadyExists;
        }

        var label = AcademicTerm.ComputeLabel(command.Year, command.Number, command.Kind);

        var result = term.Update(
            command.Year,
            command.Number,
            command.Kind,
            command.StartDate,
            command.EndDate,
            command.EnrollmentOpens,
            command.EnrollmentCloses,
            label,
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UpdateAcademicTermResponse(term.Id.Value);
    }
}
