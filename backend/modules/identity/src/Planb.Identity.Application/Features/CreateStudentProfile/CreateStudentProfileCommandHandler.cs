using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.CreateStudentProfile;

/// <summary>
/// Handler de US-012. Flow:
/// <list type="number">
///   <item>Cargar el user por Id.</item>
///   <item>Validar que el CareerPlan exista en Academic via IAcademicQueryService (cross-BC
///         read sin FK, ADR-0017). Eso devuelve también el CareerId del plan, que se denormaliza
///         en el StudentProfile para que el UNIQUE(user_id, career_id) sea evaluable en DB sin
///         JOIN cross-schema.</item>
///   <item>Llamar <c>user.AddStudentProfile</c> con los IDs derivados. El aggregate enforce
///         las invariantes del dominio (verified, role=Member, year range, no duplicate).</item>
///   <item>Persistir + dispatch de eventos.</item>
/// </list>
///
/// Errores que pueden surgir:
/// <list type="bullet">
///   <item>UserNotFound si el JWT autenticó pero el user no existe (estado degenerado).</item>
///   <item>CareerPlanErrors.NotFound si el plan no está en Academic (UI debería ofrecer un
///         picker que solo liste planes válidos, así que esto es defense en profundidad).</item>
///   <item>UserErrors.EmailNotVerified / AccountDisabled / OnlyMembersCanHaveProfiles /
///         EnrollmentYearOutOfRange / DuplicateStudentProfile desde el aggregate.</item>
/// </list>
/// </summary>
public static class CreateStudentProfileCommandHandler
{
    public static async Task<Result<CreateStudentProfileResponse>> Handle(
        CreateStudentProfileCommand command,
        IUserRepository users,
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

        var plan = await academic.GetCareerPlanByIdAsync(command.CareerPlanId, ct);
        if (plan is null)
        {
            return UserErrors.StudentProfileCareerPlanNotFound;
        }

        var profileResult = user.AddStudentProfile(
            plan.Id,
            plan.CareerId,
            command.EnrollmentYear,
            clock);

        if (profileResult.IsFailure)
        {
            return profileResult.Error;
        }

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        var profile = profileResult.Value;
        return new CreateStudentProfileResponse(
            profile.Id.Value,
            profile.CareerPlanId,
            profile.EnrollmentYear,
            profile.Status.ToString());
    }
}
