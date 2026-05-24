namespace Planb.Identity.Application.Features.UpdateMySettings;

/// <summary>
/// Body del PATCH /api/users/me/settings (US-072). Todos los campos nullable: el cliente
/// manda solo el subset que cambió (semántica de auto-save por toggle). El handler aplica
/// los no-null sobre el aggregate y persiste.
///
/// <para>
/// <c>Language</c> y <c>Theme</c> llegan como strings, no como enums, para que el JSON binding
/// no falle con 500 si el cliente manda un valor desconocido. El validator chequea explícito
/// y devuelve 400 con un mensaje útil.
/// </para>
/// </summary>
public sealed record UpdateMySettingsRequest(
    bool? NotificationsInApp,
    bool? NotificationsEmail,
    bool? NotifyReviewResponse,
    bool? NotifyNewReviewInFollowed,
    bool? NotifyAcademicCalendar,
    bool? NotifyDraftPromotionNudge,
    bool? ShowDisplayNameInReviews,
    bool? AllowTeacherContact,
    string? Language,
    string? Theme);
