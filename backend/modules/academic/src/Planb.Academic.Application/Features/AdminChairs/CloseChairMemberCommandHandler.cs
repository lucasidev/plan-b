using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Chairs;
using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Handler de cerrar el tramo de un docente (US-196). No borra la fila: le pone el período hasta el
/// que integró, y el aggregate se encarga de que el docente esté vigente en esa cátedra.
/// </summary>
public static class CloseChairMemberCommandHandler
{
    public static async Task<Result> Handle(
        CloseChairMemberCommand command,
        IChairRepository chairs,
        IAcademicTermRepository terms,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var chair = await chairs.GetByIdAsync(new ChairId(command.ChairId), ct);
        if (chair is null)
        {
            return ChairErrors.NotFound;
        }

        // El período de cierre se valida contra el catálogo igual que el de alta: un Guid inventado
        // dejaría un tramo cerrado contra un período que no existe, y la ficha no podría fecharlo.
        var term = await terms.FindByIdAsync(new AcademicTermId(command.UntilTermId), ct);
        if (term is null)
        {
            return ChairErrors.TermNotFound;
        }

        var result = chair.CloseMember(
            new TeacherId(command.TeacherId),
            new AcademicTermId(command.UntilTermId),
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}
