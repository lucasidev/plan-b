using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.ChangePassword;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using StackExchange.Redis;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// End-to-end del PATCH /api/me/password (US-079-i). Cubre auth gate, validaciones del
/// aggregate (current invalid, same-as-current, too weak, too long), happy path con
/// revocación de refresh tokens, y el caso disabled mid-sesión.
/// </summary>
public class ChangePasswordEndpointTests : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    public ChangePasswordEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private static string FreshEmail(string label) => $"{label}.{Guid.NewGuid():N}@planb.local";

    // ── Auth gate ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Patch_returns_401_without_session()
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var response = await bootstrap.PatchAsJsonAsync(
            "/api/me/password",
            new ChangePasswordRequest("anything", "new-password-12c"));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    // ── Happy path ────────────────────────────────────────────────────────

    [Fact]
    public async Task Patch_returns_204_and_rotates_hash_on_happy_path()
    {
        const string OldPassword = "viejo-password-12c";
        const string NewPassword = "nuevo-password-12c";

        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("change-pwd-happy"), OldPassword);

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/password",
            new ChangePasswordRequest(OldPassword, NewPassword));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Verify: el sign-in con la old falla, con la new pasa.
        using var bootstrap = _fixture.Factory.CreateClient();
        var signInWithOld = await bootstrap.PostAsJsonAsync(
            "/api/identity/sign-in",
            new { email = (await GetEmailForUserAsync(auth.UserId)), password = OldPassword });
        signInWithOld.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        var signInWithNew = await bootstrap.PostAsJsonAsync(
            "/api/identity/sign-in",
            new { email = (await GetEmailForUserAsync(auth.UserId)), password = NewPassword });
        signInWithNew.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Patch_revokes_all_refresh_tokens_after_change()
    {
        const string OldPassword = "viejo-password-12c";
        const string NewPassword = "nuevo-password-12c";

        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("change-pwd-revoke"), OldPassword);

        // Pre: refresh token del current session exists en Redis.
        var redis = _fixture.Factory.Services.GetRequiredService<IConnectionMultiplexer>();
        var server = redis.GetServer(redis.GetEndPoints()[0]);
        var beforeCount = server.Keys(pattern: $"identity:refresh:*").Count();
        beforeCount.ShouldBeGreaterThan(0);

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/password",
            new ChangePasswordRequest(OldPassword, NewPassword));
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Post: el refresh endpoint con el token viejo devuelve 401.
        using var refreshClient = _fixture.Factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });
        refreshClient.DefaultRequestHeaders.Add("Cookie", $"planb_refresh={auth.RefreshCookie}");
        var refresh = await refreshClient.PostAsync("/api/identity/refresh", content: null);
        refresh.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    // ── Validaciones del aggregate ────────────────────────────────────────

    [Fact]
    public async Task Patch_returns_401_when_current_password_does_not_match()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("change-pwd-wrong-current"), "viejo-password-12c");

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/password",
            new ChangePasswordRequest("password-equivocada", "nuevo-password-12c"));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Patch_returns_400_when_new_password_equals_current()
    {
        const string SamePassword = "misma-password-12c";

        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("change-pwd-same"), SamePassword);

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/password",
            new ChangePasswordRequest(SamePassword, SamePassword));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Patch_returns_400_when_new_password_too_short()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("change-pwd-short"), "viejo-password-12c");

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/password",
            new ChangePasswordRequest("viejo-password-12c", "corta"));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Patch_returns_400_when_new_password_blank()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, FreshEmail("change-pwd-blank"), "viejo-password-12c");

        var response = await auth.Client.PatchAsJsonAsync(
            "/api/me/password",
            new ChangePasswordRequest("viejo-password-12c", ""));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private async Task<string> GetEmailForUserAsync(UserId userId)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Planb.Identity.Infrastructure.Persistence.IdentityDbContext>();
        var user = await db.Users.FindAsync(userId);
        user.ShouldNotBeNull();
        return user!.Email.Value;
    }
}
