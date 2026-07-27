using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Application.Validation;
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
///   <item>Validar las referencias cross-BC de los items contra el catálogo (materia en el plan,
///         período de la universidad del alumno, y comisión existente, de esa materia, de ese
///         período y todavía ofrecida). Ver <c>DraftItemValidator</c> para el por qué.</item>
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

        var itemsValidation = await DraftItemValidator.ValidateAsync(
            academic,
            profile.CareerPlanId,
            command.TermId,
            [.. command.Items.Select(i => (i.SubjectId, i.CommissionId))],
            ct);
        if (itemsValidation.IsFailure)
        {
            return Result.Failure<CreateSimulationDraftResponse>(itemsValidation.Error);
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
