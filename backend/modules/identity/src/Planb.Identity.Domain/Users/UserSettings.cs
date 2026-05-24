using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Configuración personal del user: notificaciones (por canal y por tipo), privacidad,
/// idioma de UI, tema visual. Vive como aggregate root propio (no como child del User)
/// porque tiene lifecycle independiente: el row se crea lazy en el primer PATCH del user,
/// no en el Register. Mientras no exista row, el handler de GET devuelve los defaults.
///
/// <para>
/// Patrón de update: PATCH parcial. Cada llamada a <see cref="Update"/> trae un subset de
/// settings (los nullable). El método aplica solo los no-null, deja los demás como estaban.
/// Esto matchea la semántica del endpoint frontend (auto-save por toggle: el cliente manda
/// solo el field que cambió).
/// </para>
/// </summary>
public sealed class UserSettings : Entity<UserSettingsId>, IAggregateRoot
{
    public UserId UserId { get; private set; }

    // Notificaciones por canal.
    public bool NotificationsInApp { get; private set; }
    public bool NotificationsEmail { get; private set; }

    // Notificaciones por tipo.
    public bool NotifyReviewResponse { get; private set; }
    public bool NotifyNewReviewInFollowed { get; private set; }
    public bool NotifyAcademicCalendar { get; private set; }
    public bool NotifyDraftPromotionNudge { get; private set; }

    // Privacidad.
    public bool ShowDisplayNameInReviews { get; private set; }
    public bool AllowTeacherContact { get; private set; }

    // Localización + visuales.
    public Language Language { get; private set; }
    public ThemePreference Theme { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private UserSettings() { }

    /// <summary>
    /// Crea un settings row con los defaults sanos para un user que aún no personalizó nada.
    /// Defaults conservadores: todas las notificaciones ON (el user opt-outs lo que no quiere),
    /// display name visible (que es el comportamiento default de las reseñas hoy), idioma
    /// rioplatense, tema auto.
    /// </summary>
    public static UserSettings CreateDefault(UserId userId, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        var now = clock.UtcNow;

        return new UserSettings
        {
            Id = UserSettingsId.New(),
            UserId = userId,
            NotificationsInApp = true,
            NotificationsEmail = true,
            NotifyReviewResponse = true,
            NotifyNewReviewInFollowed = true,
            NotifyAcademicCalendar = true,
            NotifyDraftPromotionNudge = true,
            ShowDisplayNameInReviews = true,
            AllowTeacherContact = false,
            Language = Language.EsRioplatense,
            Theme = ThemePreference.Auto,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// PATCH parcial. Cada parámetro nullable: si viene null, no se toca; si viene con valor,
    /// se aplica. <c>UpdatedAt</c> se rebumpea siempre que entre acá (aunque el call termine
    /// sin tocar nada), porque el endpoint solo invoca este método si el body trae al menos
    /// un campo.
    /// </summary>
    public void Update(
        bool? notificationsInApp,
        bool? notificationsEmail,
        bool? notifyReviewResponse,
        bool? notifyNewReviewInFollowed,
        bool? notifyAcademicCalendar,
        bool? notifyDraftPromotionNudge,
        bool? showDisplayNameInReviews,
        bool? allowTeacherContact,
        Language? language,
        ThemePreference? theme,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (notificationsInApp.HasValue) NotificationsInApp = notificationsInApp.Value;
        if (notificationsEmail.HasValue) NotificationsEmail = notificationsEmail.Value;
        if (notifyReviewResponse.HasValue) NotifyReviewResponse = notifyReviewResponse.Value;
        if (notifyNewReviewInFollowed.HasValue) NotifyNewReviewInFollowed = notifyNewReviewInFollowed.Value;
        if (notifyAcademicCalendar.HasValue) NotifyAcademicCalendar = notifyAcademicCalendar.Value;
        if (notifyDraftPromotionNudge.HasValue) NotifyDraftPromotionNudge = notifyDraftPromotionNudge.Value;
        if (showDisplayNameInReviews.HasValue) ShowDisplayNameInReviews = showDisplayNameInReviews.Value;
        if (allowTeacherContact.HasValue) AllowTeacherContact = allowTeacherContact.Value;
        if (language.HasValue) Language = language.Value;
        if (theme.HasValue) Theme = theme.Value;

        UpdatedAt = clock.UtcNow;
    }
}
