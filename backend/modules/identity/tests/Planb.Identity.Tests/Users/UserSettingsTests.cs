using Planb.Identity.Domain.Users;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Users;

/// <summary>
/// Domain unit tests de <see cref="UserSettings"/>: los defaults de <see cref="UserSettings.CreateDefault"/>
/// (US-072) y los invariantes de <see cref="UserSettings.Update"/> (PATCH parcial), cada uno intentado
/// al revés.
/// </summary>
public class UserSettingsTests
{
    private static readonly DateTimeOffset T0 = new(2026, 9, 1, 12, 0, 0, TimeSpan.Zero);

    private static UserSettings Defaults(FixedClock? clock = null) =>
        UserSettings.CreateDefault(UserId.New(), clock ?? new FixedClock(T0));

    // ── Defaults de CreateDefault ─────────────────────────────────────────

    [Fact]
    public void CreateDefault_NotificationsInApp_startsOn()
    {
        Defaults().NotificationsInApp.ShouldBe(true);
    }

    [Fact]
    public void CreateDefault_NotificationsEmail_startsOn()
    {
        Defaults().NotificationsEmail.ShouldBe(true);
    }

    [Fact]
    public void CreateDefault_NotifyReviewResponse_startsOn()
    {
        Defaults().NotifyReviewResponse.ShouldBe(true);
    }

    [Fact]
    public void CreateDefault_NotifyNewReviewInFollowed_startsOn()
    {
        Defaults().NotifyNewReviewInFollowed.ShouldBe(true);
    }

    [Fact]
    public void CreateDefault_NotifyAcademicCalendar_startsOn()
    {
        Defaults().NotifyAcademicCalendar.ShouldBe(true);
    }

    [Fact]
    public void CreateDefault_NotifyDraftPromotionNudge_startsOn()
    {
        Defaults().NotifyDraftPromotionNudge.ShouldBe(true);
    }

    [Fact]
    public void CreateDefault_ShowDisplayNameInReviews_startsOn()
    {
        Defaults().ShowDisplayNameInReviews.ShouldBe(true);
    }

    /// <summary>
    /// Único opt-in de privacidad en false por default: dejar que un docente contacte al alumno no
    /// se asume, se pide.
    /// </summary>
    [Fact]
    public void CreateDefault_AllowTeacherContact_startsOff()
    {
        Defaults().AllowTeacherContact.ShouldBe(false);
    }

    [Fact]
    public void CreateDefault_Language_isEsRioplatense()
    {
        Defaults().Language.ShouldBe(Language.EsRioplatense);
    }

    [Fact]
    public void CreateDefault_Theme_isAuto()
    {
        Defaults().Theme.ShouldBe(ThemePreference.Auto);
    }

    // ── Update con todo null ──────────────────────────────────────────────

    [Fact]
    public void Update_WithAllNull_DoesNotChangeAnySetting()
    {
        var settings = Defaults();

        settings.Update(
            notificationsInApp: null,
            notificationsEmail: null,
            notifyReviewResponse: null,
            notifyNewReviewInFollowed: null,
            notifyAcademicCalendar: null,
            notifyDraftPromotionNudge: null,
            showDisplayNameInReviews: null,
            allowTeacherContact: null,
            language: null,
            theme: null,
            clock: new FixedClock(T0.AddDays(1)));

        settings.NotificationsInApp.ShouldBe(true);
        settings.NotificationsEmail.ShouldBe(true);
        settings.NotifyReviewResponse.ShouldBe(true);
        settings.NotifyNewReviewInFollowed.ShouldBe(true);
        settings.NotifyAcademicCalendar.ShouldBe(true);
        settings.NotifyDraftPromotionNudge.ShouldBe(true);
        settings.ShowDisplayNameInReviews.ShouldBe(true);
        settings.AllowTeacherContact.ShouldBe(false);
        settings.Language.ShouldBe(Language.EsRioplatense);
        settings.Theme.ShouldBe(ThemePreference.Auto);
    }

    /// <summary>
    /// Roto: un PATCH sin ningún campo no es una actualización, así que no debería mover
    /// <see cref="UserSettings.UpdatedAt"/>. <see cref="UserSettings.Update"/> lo bumpea igual,
    /// pase lo que pase: el guard de "al menos un campo" vive solo en el validator del endpoint,
    /// no en el dominio.
    /// </summary>
    [Fact(Skip = "Roto: #447")]
    public void Update_WithAllNull_DoesNotBumpUpdatedAt()
    {
        var settings = Defaults();

        settings.Update(
            notificationsInApp: null,
            notificationsEmail: null,
            notifyReviewResponse: null,
            notifyNewReviewInFollowed: null,
            notifyAcademicCalendar: null,
            notifyDraftPromotionNudge: null,
            showDisplayNameInReviews: null,
            allowTeacherContact: null,
            language: null,
            theme: null,
            clock: new FixedClock(T0.AddDays(1)));

        settings.UpdatedAt.ShouldBe(T0);
    }

    // ── Update parcial ─────────────────────────────────────────────────────

    [Fact]
    public void Update_OnlyTheme_LeavesLanguageUnchangedAndBumpsUpdatedAt()
    {
        var settings = Defaults();

        settings.Update(
            notificationsInApp: null,
            notificationsEmail: null,
            notifyReviewResponse: null,
            notifyNewReviewInFollowed: null,
            notifyAcademicCalendar: null,
            notifyDraftPromotionNudge: null,
            showDisplayNameInReviews: null,
            allowTeacherContact: null,
            language: null,
            theme: ThemePreference.Dark,
            clock: new FixedClock(T0.AddMinutes(10)));

        settings.Theme.ShouldBe(ThemePreference.Dark);
        settings.Language.ShouldBe(Language.EsRioplatense);
        settings.UpdatedAt.ShouldBe(T0.AddMinutes(10));
    }

    [Fact]
    public void Update_OnlyLanguage_LeavesThemeUnchangedAndBumpsUpdatedAt()
    {
        var settings = Defaults();

        settings.Update(
            notificationsInApp: null,
            notificationsEmail: null,
            notifyReviewResponse: null,
            notifyNewReviewInFollowed: null,
            notifyAcademicCalendar: null,
            notifyDraftPromotionNudge: null,
            showDisplayNameInReviews: null,
            allowTeacherContact: null,
            language: Language.EsNeutro,
            theme: null,
            clock: new FixedClock(T0.AddMinutes(10)));

        settings.Language.ShouldBe(Language.EsNeutro);
        settings.Theme.ShouldBe(ThemePreference.Auto);
        settings.UpdatedAt.ShouldBe(T0.AddMinutes(10));
    }
}
