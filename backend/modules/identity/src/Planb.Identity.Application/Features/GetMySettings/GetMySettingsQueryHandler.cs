using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Identity.Application.Features.GetMySettings;

/// <summary>
/// Handler del GET /api/users/me/settings. Si el user no tiene row persistido, devuelve los
/// defaults derivados de <see cref="UserSettings.CreateDefault"/> sin escribir nada en DB.
/// </summary>
public static class GetMySettingsQueryHandler
{
    public static async Task<GetMySettingsResponse> Handle(
        GetMySettingsQuery query,
        IUserSettingsRepository settings,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var existing = await settings.FindByUserIdAsync(query.UserId, ct);
        if (existing is not null)
        {
            return ToResponse(existing);
        }

        // Defaults sin persistir: el row se crea recién en el primer PATCH.
        var defaults = UserSettings.CreateDefault(query.UserId, clock);
        return ToResponse(defaults);
    }

    private static GetMySettingsResponse ToResponse(UserSettings s) => new(
        NotificationsInApp: s.NotificationsInApp,
        NotificationsEmail: s.NotificationsEmail,
        NotifyReviewResponse: s.NotifyReviewResponse,
        NotifyNewReviewInFollowed: s.NotifyNewReviewInFollowed,
        NotifyAcademicCalendar: s.NotifyAcademicCalendar,
        NotifyDraftPromotionNudge: s.NotifyDraftPromotionNudge,
        ShowDisplayNameInReviews: s.ShowDisplayNameInReviews,
        AllowTeacherContact: s.AllowTeacherContact,
        Language: s.Language.ToString(),
        Theme: s.Theme.ToString());
}
