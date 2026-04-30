using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.RequestPasswordReset;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using StackExchange.Redis;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Exercises POST /api/identity/forgot-password against the seeded personas. All paths
/// return 204 by anti-enumeration design; the assertions inspect the database for whether
/// a password-reset token was actually issued.
///
/// Each test resets the per-IP rate-limit bucket in Redis to keep them isolated. The
/// WebApplicationFactory always reports localhost so every test shares the same bucket key
/// otherwise.
/// </summary>
public class RequestPasswordResetEndpointTests : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public RequestPasswordResetEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
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

    private async Task<List<VerificationToken>> GetPasswordResetTokensAsync(string email)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var emailVo = EmailAddress.Create(email).Value;
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == emailVo);
        if (user is null) return [];
        return user.Tokens.Where(t => t.Purpose == TokenPurpose.PasswordReset).ToList();
    }

    [Fact]
    public async Task Returns_204_and_issues_a_token_for_a_verified_active_user()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/forgot-password",
            new RequestPasswordResetRequest(TestPersonas.LuciaEmail));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var tokens = await GetPasswordResetTokensAsync(TestPersonas.LuciaEmail);
        tokens.Count.ShouldBe(1);
        tokens[0].IsActive.ShouldBeTrue();
        tokens[0].ExpiresAt.ShouldBeGreaterThan(DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Returns_204_and_issues_no_token_for_an_unknown_email()
    {
        var unknown = $"nobody.{Guid.NewGuid():N}@nowhere.local";

        var response = await _client.PostAsJsonAsync(
            "/api/identity/forgot-password",
            new RequestPasswordResetRequest(unknown));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var tokens = await GetPasswordResetTokensAsync(unknown);
        tokens.ShouldBeEmpty();
    }

    [Fact]
    public async Task Returns_204_and_issues_no_token_for_an_unverified_user()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/forgot-password",
            new RequestPasswordResetRequest(TestPersonas.MartinEmail));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var tokens = await GetPasswordResetTokensAsync(TestPersonas.MartinEmail);
        tokens.ShouldBeEmpty();
    }

    [Fact]
    public async Task Returns_204_and_issues_no_token_for_a_disabled_user()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/forgot-password",
            new RequestPasswordResetRequest(TestPersonas.PaulaEmail));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var tokens = await GetPasswordResetTokensAsync(TestPersonas.PaulaEmail);
        tokens.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_second_request_for_the_same_user_invalidates_the_first_token()
    {
        var first = await _client.PostAsJsonAsync(
            "/api/identity/forgot-password",
            new RequestPasswordResetRequest(TestPersonas.LuciaEmail));
        first.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var second = await _client.PostAsJsonAsync(
            "/api/identity/forgot-password",
            new RequestPasswordResetRequest(TestPersonas.LuciaEmail));
        second.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var tokens = await GetPasswordResetTokensAsync(TestPersonas.LuciaEmail);
        tokens.Count(t => t.IsActive).ShouldBe(1);
        tokens.Count(t => t.IsInvalidated).ShouldBeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Returns_429_after_five_requests_in_the_window_from_the_same_ip()
    {
        for (var i = 0; i < 5; i++)
        {
            var response = await _client.PostAsJsonAsync(
                "/api/identity/forgot-password",
                new RequestPasswordResetRequest(TestPersonas.LuciaEmail));
            response.StatusCode.ShouldBe(HttpStatusCode.NoContent, $"attempt {i + 1} should be allowed");
        }

        var sixth = await _client.PostAsJsonAsync(
            "/api/identity/forgot-password",
            new RequestPasswordResetRequest(TestPersonas.LuciaEmail));

        sixth.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
        var body = await sixth.Content.ReadAsStringAsync();
        body.ShouldContain("identity.rate_limit.exceeded");
    }
}
