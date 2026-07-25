using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Commissions;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Handler del POST /api/academic/commissions/{id}/reactivate (admin). 404 si no existe; 409 si ya
/// estaba activa (idempotencia explícita del aggregate).
/// </summary>
public static class ReactivateCommissionCommandHandler
{
    public static async Task<Result<CommissionStatusResponse>> Handle(
        ReactivateCommissionCommand command,
        ICommissionRepository commissions,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var commission = await commissions.GetByIdAsync(new CommissionId(command.CommissionId), ct);
        if (commission is null)
        {
            return CommissionErrors.NotFound;
        }

        var result = commission.Reactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new CommissionStatusResponse(commission.Id.Value, commission.IsActive);
    }
}
