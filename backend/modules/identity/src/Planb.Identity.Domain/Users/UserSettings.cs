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
    /// se aplica solo cuando difiere del actual (mandar el mismo valor que ya tenía no cuenta
    /// como cambio). <c>UpdatedAt</c> se mueve únicamente si algún campo cambió de verdad.
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

        var changed = false;
        changed |= ApplyIfChanged(NotificationsInApp, notificationsInApp, v => NotificationsInApp = v);
        changed |= ApplyIfChanged(NotificationsEmail, notificationsEmail, v => NotificationsEmail = v);
        changed |= ApplyIfChanged(NotifyReviewResponse, notifyReviewResponse, v => NotifyReviewResponse = v);
        changed |= ApplyIfChanged(NotifyNewReviewInFollowed, notifyNewReviewInFollowed, v => NotifyNewReviewInFollowed = v);
        changed |= ApplyIfChanged(NotifyAcademicCalendar, notifyAcademicCalendar, v => NotifyAcademicCalendar = v);
        changed |= ApplyIfChanged(NotifyDraftPromotionNudge, notifyDraftPromotionNudge, v => NotifyDraftPromotionNudge = v);
        changed |= ApplyIfChanged(ShowDisplayNameInReviews, showDisplayNameInReviews, v => ShowDisplayNameInReviews = v);
        changed |= ApplyIfChanged(AllowTeacherContact, allowTeacherContact, v => AllowTeacherContact = v);
        changed |= ApplyIfChanged(Language, language, v => Language = v);
        changed |= ApplyIfChanged(Theme, theme, v => Theme = v);

        if (changed)
        {
            UpdatedAt = clock.UtcNow;
        }
    }

    /// <summary>
    /// Aplica <paramref name="incoming"/> vía <paramref name="apply"/> solo si trae valor y
    /// difiere de <paramref name="current"/>. Devuelve si hubo cambio, para que <see cref="Update"/>
    /// sepa si tiene que mover <c>UpdatedAt</c>.
    /// </summary>
    private static bool ApplyIfChanged<T>(T current, T? incoming, Action<T> apply)
        where T : struct
    {
        if (!incoming.HasValue || EqualityComparer<T>.Default.Equals(current, incoming.Value))
        {
            return false;
        }

        apply(incoming.Value);
        return true;
    }
}
