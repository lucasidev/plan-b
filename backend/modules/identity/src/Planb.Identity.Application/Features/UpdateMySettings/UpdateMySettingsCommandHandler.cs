using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.UpdateMySettings;

/// <summary>
/// Handler del PATCH /api/users/me/settings (US-072). Lazy creation: si el user todavía no
/// tiene row de settings, lo crea con los defaults y aplica el update en la misma transacción.
/// Si ya tiene, aplica el update directo.
/// </summary>
public static class UpdateMySettingsCommandHandler
{
    public static async Task<Result> Handle(
        UpdateMySettingsCommand command,
        IUserSettingsRepository settings,
        IIdentityUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var existing = await settings.FindByUserIdAsync(command.UserId, ct);
        if (existing is null)
        {
            var fresh = UserSettings.CreateDefault(command.UserId, clock);
            fresh.Update(
                command.NotificationsInApp,
                command.NotificationsEmail,
                command.NotifyReviewResponse,
                command.NotifyNewReviewInFollowed,
                command.NotifyAcademicCalendar,
                command.NotifyDraftPromotionNudge,
                command.ShowDisplayNameInReviews,
                command.AllowTeacherContact,
                command.Language,
                command.Theme,
                clock);

            settings.Add(fresh);
        }
        else
        {
            existing.Update(
                command.NotificationsInApp,
                command.NotificationsEmail,
                command.NotifyReviewResponse,
                command.NotifyNewReviewInFollowed,
                command.NotifyAcademicCalendar,
                command.NotifyDraftPromotionNudge,
                command.ShowDisplayNameInReviews,
                command.AllowTeacherContact,
                command.Language,
                command.Theme,
                clock);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}
