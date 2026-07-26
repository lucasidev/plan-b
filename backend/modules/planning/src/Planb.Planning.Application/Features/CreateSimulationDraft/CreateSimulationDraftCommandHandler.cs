using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.Planning.Domain.Drafts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.CreateSimulationDraft;

/// <summary>
/// Handler de US-023 (guardar borrador nuevo). Flow:
/// <list type="number">
///   <item>Rate limit por user (60 saves/hora, key compartida con la edición:
///         <c>planning:ratelimit:save:{userId}</c>).</item>
///   <item>Resolver el StudentProfile activo (cross-BC). Sin profile activo, NotFound (reusa
///         AvailabilityErrors.StudentProfileRequired: mismo hecho de negocio que Evaluate/Available).</item>
///   <item>Validar que cada materia del borrador pertenezca al CareerPlan del profile (cross-BC vía
///         IAcademicQueryService.IsSubjectInPlanAsync). No valida término ni comisión: son Guid
///         planos sin FK (ADR-0017) y el AC de US-023 no pidió esa coherencia acá.</item>
///   <item>Crear el aggregate (valida no-vacío, sin duplicados, largo del label) y persistir.</item>
/// </list>
/// </summary>
public static class CreateSimulationDraftCommandHandler
{
    private const int MaxSavesPerHour = 60;
    private static readonly TimeSpan RateWindow = TimeSpan.FromHours(1);

    public static async Task<Result<CreateSimulationDraftResponse>> Handle(
        CreateSimulationDraftCommand command,
        IIdentityQueryService identity,
        IAcademicQueryService academic,
        ISimulationDraftRepository drafts,
        IPlanningUnitOfWork unitOfWork,
        IRateLimiter rateLimiter,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var rate = await rateLimiter.TryAcquireAsync(
            $"planning:ratelimit:save:{command.UserId}", RateWindow, MaxSavesPerHour, ct);
        if (!rate.Allowed)
        {
            return Result.Failure<CreateSimulationDraftResponse>(SimulationDraftErrors.RateLimitExceeded);
        }

        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<CreateSimulationDraftResponse>(AvailabilityErrors.StudentProfileRequired);
        }

        foreach (var subjectId in command.Items.Select(i => i.SubjectId).Distinct())
        {
            if (!await academic.IsSubjectInPlanAsync(subjectId, profile.CareerPlanId, ct))
            {
                return Result.Failure<CreateSimulationDraftResponse>(SimulationDraftErrors.SubjectNotInPlan);
            }
        }

        var created = SimulationDraft.Create(
            profile.Id,
            command.TermId,
            command.Label,
            command.Items.Select(i => (i.SubjectId, i.CommissionId)),
            clock);
        if (created.IsFailure)
        {
            return Result.Failure<CreateSimulationDraftResponse>(created.Error);
        }

        await drafts.AddAsync(created.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateSimulationDraftResponse(created.Value.Id.Value);
    }
}
