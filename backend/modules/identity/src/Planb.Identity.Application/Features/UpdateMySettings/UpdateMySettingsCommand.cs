using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.UpdateMySettings;

/// <summary>
/// Command del PATCH. Espeja el shape del request pero con UserId resuelto desde el JWT y
/// los enums parseados a su tipo del dominio. El validator del command asegura que al menos
/// un campo viene no-null (PATCH vacío no tiene sentido).
/// </summary>
public sealed record UpdateMySettingsCommand(
    UserId UserId,
    bool? NotificationsInApp,
    bool? NotificationsEmail,
    bool? NotifyReviewResponse,
    bool? NotifyNewReviewInFollowed,
    bool? NotifyAcademicCalendar,
    bool? NotifyDraftPromotionNudge,
    bool? ShowDisplayNameInReviews,
    bool? AllowTeacherContact,
    Language? Language,
    ThemePreference? Theme);
