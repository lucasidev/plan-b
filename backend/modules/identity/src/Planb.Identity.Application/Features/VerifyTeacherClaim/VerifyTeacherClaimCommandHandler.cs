using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.TeacherProfiles;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.VerifyTeacherClaim;

/// <summary>
/// Handler de US-031 paso 2 (consumir el token del link de mail). Flow:
/// <list type="number">
///   <item>Buscar el claim dueño del token. Validar ownership (es del user del JWT).</item>
///   <item>Si el claim no está ya verificado, rechazar si OTRO claim ya verificó este docente
///         (partial UNIQUE teacher WHERE verified: solo un profile verificado por docente).</item>
///   <item><c>VerifyByInstitutionalEmail</c> consume el token y marca verificado (idempotente).</item>
/// </list>
/// </summary>
public static class VerifyTeacherClaimCommandHandler
{
    public static async Task<Result<VerifyTeacherClaimResponse>> Handle(
        VerifyTeacherClaimCommand command,
        ITeacherProfileRepository profiles,
        IIdentityUnitOfWork unitOfWork,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await profiles.FindByVerificationTokenAsync(command.RawToken, ct);
        if (profile is null)
        {
            return TeacherProfileErrors.VerificationTokenInvalid;
        }
        if (profile.UserId != command.UserId)
        {
            return TeacherProfileErrors.NotClaimOwner;
        }

        if (!profile.IsVerified
            && await profiles.AnyVerifiedForTeacherAsync(profile.TeacherId, ct))
        {
            return TeacherProfileErrors.TeacherAlreadyVerifiedByAnother;
        }

        var result = profile.VerifyByInstitutionalEmail(command.RawToken, clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await DomainEventDispatcher.DispatchAsync([profile], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new VerifyTeacherClaimResponse(
            profile.Id.Value, profile.TeacherId, profile.IsVerified);
    }
}
