using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.RegisterUser;
using Planb.Identity.Application.Features.RequestPasswordReset;
using Planb.Identity.Application.Features.ResetPassword;
using Planb.Identity.Application.Features.SignIn;
using Planb.Identity.Application.Features.VerifyEmail;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using StackExchange.Redis;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// End-to-end behavior of POST /api/identity/reset-password. Covers each error code
/// listed in the AC of US-033 plus the cross-cutting "refresh tokens are revoked" path.
///
/// Each test builds its own fresh user (registered + verified inline) so token state
/// from one test doesn't bleed into another. Lucía from the seed is reused only when the
/// sign-in / refresh path is what's under test.
/// </summary>
public class ResetPasswordEndpointTests : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public ResetPasswordEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });
    }

    public async Task InitializeAsync() => await ClearForgotPasswordRateLimitBucketsAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task ClearForgotPasswordRateLimitBucketsAsync()
    {
        var redis = _fixture.Factory.Services.GetRequiredService<IConnectionMultiplexer>();
        var server = redis.GetServer(redis.GetEndPoints()[0]);
        var keys = server.Keys(pattern: "identity:ratelimit:forgot-password:*").ToArray();
        if (keys.Length > 0)
        {
            await redis.GetDatabase().KeyDeleteAsync(keys);
        }
    }

    private static string FreshEmail(string label) => $"{label}.{Guid.NewGuid():N}@planb.local";

    /// <summary>
    /// Sign up + verify a fresh user, then trigger forgot-password and read the raw token
    /// straight out of the DB. Returns the user id and token so each test can drive the
    /// reset-password endpoint with a known-good initial state.
    /// </summary>
    private async Task<(Guid UserId, string ResetToken)> ProvisionUserWithResetTokenAsync(
        string email, string password = "valid-password-12c")
    {
        var register = await _client.PostAsJsonAsync(
            "/api/identity/register", new RegisterUserRequest(email, password));
        register.StatusCode.ShouldBe(HttpStatusCode.Created);
        var registerBody = await register.Content.ReadFromJsonAsync<RegisterUserResponse>();
        registerBody.ShouldNotBeNull();

        var verifyToken = await ReadActiveTokenAsync(registerBody.Id, TokenPurpose.UserEmailVerification);
        var verify = await _client.PostAsJsonAsync(
            "/api/identity/verify-email", new VerifyEmailRequest(verifyToken));
        verify.StatusCode.ShouldBe(HttpStatusCode.OK);

        var forgot = await _client.PostAsJsonAsync(
            "/api/identity/forgot-password", new RequestPasswordResetRequest(email));
        forgot.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var resetToken = await ReadActiveTokenAsync(registerBody.Id, TokenPurpose.PasswordReset);
        return (registerBody.Id, resetToken);
    }

    private async Task<string> ReadActiveTokenAsync(Guid userId, TokenPurpose purpose)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == new UserId(userId));
        return user.Tokens.Single(t => t.Purpose == purpose && t.IsActive).Token;
    }

    [Fact]
    public async Task Returns_204_and_replaces_password_hash_on_happy_path()
    {
        var (userId, resetToken) = await ProvisionUserWithResetTokenAsync(FreshEmail("happy"));

        string oldHash;
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
            oldHash = (await db.Users.SingleAsync(u => u.Id == new UserId(userId))).PasswordHash;
        }

        var response = await _client.PostAsJsonAsync(
            "/api/identity/reset-password",
            new ResetPasswordRequest(resetToken, "brand-new-password-42"));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var verifyScope = _fixture.Factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await verifyDb.Users.SingleAsync(u => u.Id == new UserId(userId));
        user.PasswordHash.ShouldNotBe(oldHash);
        user.Tokens.Single(t => t.Purpose == TokenPurpose.PasswordReset).IsConsumed.ShouldBeTrue();
    }

    [Fact]
    public async Task Returns_404_when_token_does_not_exist()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/reset-password",
            new ResetPasswordRequest("totally-fake-token-value", "valid-new-password-12"));

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("identity.verification.invalid");
    }

    [Fact]
    public async Task Returns_409_when_token_was_already_consumed()
    {
        var (_, resetToken) = await ProvisionUserWithResetTokenAsync(FreshEmail("consumed"));

        var first = await _client.PostAsJsonAsync(
            "/api/identity/reset-password",
            new ResetPasswordRequest(resetToken, "new-password-attempt-1"));
        first.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var second = await _client.PostAsJsonAsync(
            "/api/identity/reset-password",
            new ResetPasswordRequest(resetToken, "new-password-attempt-2"));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync()).ShouldContain("identity.verification.already_consumed");
    }

    [Fact]
    public async Task Returns_409_when_token_purpose_is_email_verification()
    {
        // Register a user but DON'T verify; use the email-verification token in reset-password.
        var email = FreshEmail("wrong-purpose");
        var register = await _client.PostAsJsonAsync(
            "/api/identity/register", new RegisterUserRequest(email, "valid-password-12c"));
        var registerBody = await register.Content.ReadFromJsonAsync<RegisterUserResponse>();
        registerBody.ShouldNotBeNull();
        var verifyToken = await ReadActiveTokenAsync(registerBody.Id, TokenPurpose.UserEmailVerification);

        var response = await _client.PostAsJsonAsync(
            "/api/identity/reset-password",
            new ResetPasswordRequest(verifyToken, "valid-new-password-12"));

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).ShouldContain("identity.verification.wrong_purpose");
    }

    [Fact]
    public async Task Returns_400_when_password_is_too_weak()
    {
        var (_, resetToken) = await ProvisionUserWithResetTokenAsync(FreshEmail("weak"));

        var response = await _client.PostAsJsonAsync(
            "/api/identity/reset-password",
            new ResetPasswordRequest(resetToken, "short"));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).ShouldContain("identity.password.too_weak");
    }

    [Fact]
    public async Task Returns_400_when_token_is_blank()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/reset-password",
            new ResetPasswordRequest("", "valid-new-password-12"));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Successful_reset_revokes_existing_refresh_tokens()
    {
        var email = FreshEmail("refresh-revoke");
        var password = "valid-password-12c";
        var (_, resetToken) = await ProvisionUserWithResetTokenAsync(email, password);

        // Sign in BEFORE reset to mint a refresh token.
        var login = await _client.PostAsJsonAsync(
            "/api/identity/sign-in", new SignInRequest(email, password));
        login.StatusCode.ShouldBe(HttpStatusCode.OK);
        var refreshCookie = ExtractCookie(login, "planb_refresh");

        // Reset to a brand new password.
        var reset = await _client.PostAsJsonAsync(
            "/api/identity/reset-password",
            new ResetPasswordRequest(resetToken, "post-reset-password-77"));
        reset.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // The pre-reset refresh cookie must no longer work.
        using var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/identity/refresh");
        refreshRequest.Headers.Add("Cookie", refreshCookie);
        var refreshResponse = await _client.SendAsync(refreshRequest);
        refreshResponse.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private static string ExtractCookie(HttpResponseMessage response, string name)
    {
        var setCookies = response.Headers.GetValues("Set-Cookie");
        var cookie = setCookies.FirstOrDefault(c => c.StartsWith($"{name}="));
        cookie.ShouldNotBeNull();
        return cookie!.Split(';')[0];
    }
}
