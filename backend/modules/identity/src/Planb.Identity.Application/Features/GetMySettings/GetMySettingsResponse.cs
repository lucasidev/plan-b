namespace Planb.Identity.Application.Features.GetMySettings;

/// <summary>
/// Shape del response del GET. Todos los campos no-null: si el user no tiene row persistido,
/// el handler devuelve los defaults (la API no distingue "default implícito" de "default
/// explícito"; ambos son el mismo state desde el cliente).
/// </summary>
public sealed record GetMySettingsResponse(
    bool NotificationsInApp,
    bool NotificationsEmail,
    bool NotifyReviewResponse,
    bool NotifyNewReviewInFollowed,
    bool NotifyAcademicCalendar,
    bool NotifyDraftPromotionNudge,
    bool ShowDisplayNameInReviews,
    bool AllowTeacherContact,
    string Language,
    string Theme);
