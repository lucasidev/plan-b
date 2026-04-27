using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.SignIn;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Exercises POST /api/identity/sign-in against the seeded personas. The
/// <see cref="RegisterApiFixture"/> builds the host which runs DevSeedHostedService
/// in Development, so by the time CreateClient() returns, the four personas exist
/// in the per-test database.
/// </summary>
public class SignInEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public SignInEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            // We assert on cookie headers, so no automatic redirects.
            HandleCookies = false,
        });
    }

    [Fact]
    public async Task Returns_200_with_user_payload_and_sets_session_cookies_for_lucia()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.LuciaEmail, TestPersonas.LuciaPassword));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<SignInResponse>();
        body.ShouldNotBeNull();
        body.Email.ShouldBe(TestPersonas.LuciaEmail);
        body.Role.ShouldBe(nameof(UserRole.Member));
        body.UserId.ShouldNotBe(Guid.Empty);

        // Tokens never bleed into the JSON body.
        var raw = await response.Content.ReadAsStringAsync();
        raw.ShouldNotContain("AccessToken");
        raw.ShouldNotContain("RefreshToken");

        // Cookies must be set httpOnly + SameSite=Lax.
        var setCookies = response.Headers.GetValues("Set-Cookie").ToList();
        setCookies.ShouldContain(c => c.StartsWith("planb_session="));
        setCookies.ShouldContain(c => c.StartsWith("planb_refresh="));
        setCookies.ShouldAllBe(c => c.Contains("httponly", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Returns_401_for_wrong_password()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.LuciaEmail, "definitely-wrong-password"));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.signin.invalid_credentials");
    }

    [Fact]
    public async Task Returns_401_for_email_that_does_not_exist()
    {
        // Anti-enumeration: same 401 + same code as wrong password.
        var response = await _client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest("nobody.here@nowhere.local", "any-password-1234"));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.signin.invalid_credentials");
    }

    [Fact]
    public async Task Returns_403_email_not_verified_for_martin()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.MartinEmail, TestPersonas.MartinPassword));

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.account.email_not_verified");
    }

    [Fact]
    public async Task Returns_403_account_disabled_for_paula()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.PaulaEmail, TestPersonas.PaulaPassword));

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.account.disabled");
    }

    [Fact]
    public async Task Persists_user_in_db_with_seeded_state()
    {
        // Sanity check that DevSeedHostedService actually ran for this fixture.
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        var lucia = await db.Users.SingleOrDefaultAsync(u => u.Email == EmailAddress.Create(TestPersonas.LuciaEmail).Value);
        lucia.ShouldNotBeNull();
        lucia.IsEmailVerified.ShouldBeTrue();
        lucia.IsDisabled.ShouldBeFalse();

        var paula = await db.Users.SingleOrDefaultAsync(u => u.Email == EmailAddress.Create(TestPersonas.PaulaEmail).Value);
        paula.ShouldNotBeNull();
        paula.IsDisabled.ShouldBeTrue();

        var martin = await db.Users.SingleOrDefaultAsync(u => u.Email == EmailAddress.Create(TestPersonas.MartinEmail).Value);
        martin.ShouldNotBeNull();
        martin.IsEmailVerified.ShouldBeFalse();
    }
}
