using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.TeacherProfiles;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.InitiateTeacherClaim;

/// <summary>
/// Handler de US-030 (iniciar claim docente). Flow:
/// <list type="number">
///   <item>Cargar el user (del JWT). Debe existir, estar verificado, no disabled y ser Member:
///         ADR-0008, solo members con identidad real pueden reclamar (enforce app-level porque
///         TeacherProfile es un aggregate aparte de User).</item>
///   <item>Validar que el docente exista y esté activo en Academic vía IAcademicQueryService
///         (cross-BC read sin FK, ADR-0017). Soft-deleted devuelve un error que el endpoint mapea
///         a 410 Gone.</item>
///   <item>Rechazar si el user ya tiene un claim sobre ese docente (UNIQUE user+teacher).</item>
///   <item>Crear el TeacherProfile pending + dispatch de eventos + persistir.</item>
/// </list>
/// </summary>
public static class InitiateTeacherClaimCommandHandler
{
    public static async Task<Result<InitiateTeacherClaimResponse>> Handle(
        InitiateTeacherClaimCommand command,
        IUserRepository users,
        ITeacherProfileRepository profiles,
        IIdentityUnitOfWork unitOfWork,
        IAcademicQueryService academic,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var user = await users.FindByIdAsync(command.UserId, ct);
        if (user is null)
        {
            return UserErrors.NotFoundById;
        }

        if (!user.IsEmailVerified)
        {
            return UserErrors.EmailNotVerified;
        }
        if (user.IsDisabled)
        {
            return UserErrors.AccountDisabled;
        }
        if (user.Role != UserRole.Member)
        {
            return UserErrors.OnlyMembersCanHaveProfiles;
        }

        var teacher = await academic.GetTeacherByIdAsync(command.TeacherId, ct);
        if (teacher is null)
        {
            return TeacherProfileErrors.TeacherNotFound;
        }
        if (!teacher.IsActive)
        {
            return TeacherProfileErrors.TeacherRemoved;
        }

        var alreadyClaimed = await profiles.ExistsForUserAndTeacherAsync(
            command.UserId, command.TeacherId, ct);
        if (alreadyClaimed)
        {
            return TeacherProfileErrors.AlreadyClaimed;
        }

        var profile = TeacherProfile.InitiateClaim(command.UserId, command.TeacherId, clock);
        profiles.Add(profile);

        await DomainEventDispatcher.DispatchAsync([profile], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new InitiateTeacherClaimResponse(
            profile.Id.Value, profile.TeacherId, profile.IsVerified);
    }
}
