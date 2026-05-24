using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.GetMySettings;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// End-to-end de GET/PATCH /api/users/me/settings (US-072). Cubre auth gate, GET defaults
/// cuando no hay row, GET de un row persistido, PATCH lazy-create, PATCH update, PATCH parcial,
/// PATCH vacío (400), enum inválido (400).
/// </summary>
public class UserSettingsEndpointTests : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    public UserSettingsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private static string FreshEmail(string label) => $"{label}.{Guid.NewGuid():N}@planb.local";

    // ── Auth gate ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Get_returns_401_without_session()
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var response = await bootstrap.GetAsync("/api/users/me/settings");
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Patch_returns_401_without_session()
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var response = await bootstrap.PatchAsJsonAsync(
            "/api/users/me/settings",
            new { theme = "Dark" });
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    // ── GET ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Get_returns_defaults_when_user_has_no_row()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("settings-get-defaults"));

        var response = await auth.Client.GetAsync("/api/users/me/settings");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMySettingsResponse>();
        body.ShouldNotBeNull();
        body!.NotificationsInApp.ShouldBeTrue();
        body.NotificationsEmail.ShouldBeTrue();
        body.NotifyReviewResponse.ShouldBeTrue();
        body.ShowDisplayNameInReviews.ShouldBeTrue();
        body.AllowTeacherContact.ShouldBeFalse();
        body.Language.ShouldBe("EsRioplatense");
        body.Theme.ShouldBe("Auto");

        // No row debe haberse persistido por un GET.
        var rowCount = await CountSettingsRowsAsync(auth.UserId);
        rowCount.ShouldBe(0);
    }

    [Fact]
    public async Task Get_returns_persisted_values_after_patch()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("settings-get-persisted"));

        var patch = await auth.Client.PatchAsJsonAsync(
            "/api/users/me/settings",
            new { theme = "Dark", allowTeacherContact = true });
        patch.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var response = await auth.Client.GetAsync("/api/users/me/settings");
        var body = await response.Content.ReadFromJsonAsync<GetMySettingsResponse>();

        body.ShouldNotBeNull();
        body!.Theme.ShouldBe("Dark");
        body.AllowTeacherContact.ShouldBeTrue();
        // Los no tocados quedaron en defaults.
        body.NotificationsInApp.ShouldBeTrue();
        body.Language.ShouldBe("EsRioplatense");
    }

    // ── PATCH happy paths ─────────────────────────────────────────────────

    [Fact]
    public async Task Patch_creates_row_on_first_update()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("settings-patch-lazy-create"));

        (await CountSettingsRowsAsync(auth.UserId)).ShouldBe(0);

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/users/me/settings",
            new { notificationsEmail = false });
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        (await CountSettingsRowsAsync(auth.UserId)).ShouldBe(1);
    }

    [Fact]
    public async Task Patch_partial_only_updates_provided_fields()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("settings-patch-partial"));

        // Primero seteamos un par de cosas.
        var first = await auth.Client.PatchAsJsonAsync(
            "/api/users/me/settings",
            new { theme = "Dark", language = "EsNeutro", allowTeacherContact = true });
        first.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Segundo PATCH solo toca theme. Lo demás debe quedar igual.
        var second = await auth.Client.PatchAsJsonAsync(
            "/api/users/me/settings",
            new { theme = "Light" });
        second.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var body = await (await auth.Client.GetAsync("/api/users/me/settings"))
            .Content.ReadFromJsonAsync<GetMySettingsResponse>();
        body!.Theme.ShouldBe("Light");
        body.Language.ShouldBe("EsNeutro");
        body.AllowTeacherContact.ShouldBeTrue();
    }

    [Fact]
    public async Task Patch_does_not_create_duplicate_rows_on_multiple_updates()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("settings-patch-no-dups"));

        for (var i = 0; i < 3; i++)
        {
            var response = await auth.Client.PatchAsJsonAsync(
                "/api/users/me/settings",
                new { theme = i % 2 == 0 ? "Dark" : "Light" });
            response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        }

        (await CountSettingsRowsAsync(auth.UserId)).ShouldBe(1);
    }

    // ── PATCH validation ──────────────────────────────────────────────────

    [Fact]
    public async Task Patch_returns_400_when_body_has_no_fields()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("settings-patch-empty"));

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/users/me/settings",
            new { });
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Patch_returns_400_when_language_is_unknown()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("settings-patch-bad-lang"));

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/users/me/settings",
            new { language = "Klingon" });
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("errors").GetProperty("language").GetArrayLength().ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task Patch_returns_400_when_theme_is_unknown()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("settings-patch-bad-theme"));

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/users/me/settings",
            new { theme = "Mauve" });
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private async Task<int> CountSettingsRowsAsync(UserId userId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        return await db.UserSettings.AsNoTracking().CountAsync(s => s.UserId == userId);
    }
}
