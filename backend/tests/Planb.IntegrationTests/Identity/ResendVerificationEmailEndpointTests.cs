using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.ResendVerificationEmail;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using StackExchange.Redis;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Exercises POST /api/identity/resend-verification (US-021). Anti-enumeración: todas las
/// branches no-happy retornan 204 igual que el happy. Las assertions inspeccionan la DB para
/// confirmar si efectivamente se emitió un token nuevo + Mailpit para confirmar el email.
///
/// Cada test resetea el bucket per-IP del rate-limit en Redis para mantener isolation. El
/// WebApplicationFactory siempre reporta localhost asi que todos comparten la misma key
/// si no la limpiamos.
/// </summary>
public class ResendVerificationEmailEndpointTests : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;
    private readonly MailpitClient _mailpit = new();

    public ResendVerificationEmailEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        await _mailpit.ClearAsync();
        await ClearResendRateLimitBucketsAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task ClearResendRateLimitBucketsAsync()
    {
        var redis = _fixture.Factory.Services.GetRequiredService<IConnectionMultiplexer>();
        var server = redis.GetServer(redis.GetEndPoints()[0]);
        var keys = server.Keys(pattern: "identity:ratelimit:resend-verification:*").ToArray();
        if (keys.Length > 0)
        {
            await redis.GetDatabase().KeyDeleteAsync(keys);
        }
    }

    private async Task<List<VerificationToken>> GetEmailVerificationTokensAsync(string email)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var emailVo = EmailAddress.Create(email).Value;
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == emailVo);
        if (user is null) return [];
        return user.Tokens.Where(t => t.Purpose == TokenPurpose.UserEmailVerification).ToList();
    }

    [Fact]
    public async Task Returns_204_and_issues_new_active_token_for_unverified_user()
    {
        // Martín está en seed-data como pendiente de verificación.
        var beforeTokens = await GetEmailVerificationTokensAsync(TestPersonas.MartinEmail);
        var beforeActive = beforeTokens.Count(t => t.IsActive);

        var response = await _client.PostAsJsonAsync(
            "/api/identity/resend-verification",
            new ResendVerificationEmailRequest(TestPersonas.MartinEmail));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var afterTokens = await GetEmailVerificationTokensAsync(TestPersonas.MartinEmail);
        // Después del resend hay exactamente 1 token activo de email-verification (el nuevo)
        // y los previos quedan invalidated.
        afterTokens.Count(t => t.IsActive).ShouldBe(1);
        afterTokens.Count.ShouldBeGreaterThan(beforeTokens.Count);
    }

    [Fact]
    public async Task Sends_a_fresh_verification_email_to_unverified_user()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/resend-verification",
            new ResendVerificationEmailRequest(TestPersonas.MartinEmail));
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var summary = await _mailpit.WaitForMessageToAsync(TestPersonas.MartinEmail, TimeSpan.FromSeconds(10));
        summary.ShouldNotBeNull(
            "El email de verificación reemitido debería llegar a Mailpit en ≤ 10s.");
        summary.Subject.ShouldContain("planb");

        var detail = await _mailpit.GetMessageDetailAsync(summary.Id);
        detail.ShouldNotBeNull();
        detail.Html.ShouldContain("token=");
    }

    [Fact]
    public async Task Returns_204_and_issues_no_token_for_unknown_email()
    {
        var unknown = $"nobody.{Guid.NewGuid():N}@nowhere.local";

        var response = await _client.PostAsJsonAsync(
            "/api/identity/resend-verification",
            new ResendVerificationEmailRequest(unknown));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var tokens = await GetEmailVerificationTokensAsync(unknown);
        tokens.ShouldBeEmpty();
    }

    [Fact]
    public async Task Returns_204_and_issues_no_token_for_already_verified_user()
    {
        // Lucía ya está verificada en seed.
        var beforeTokens = await GetEmailVerificationTokensAsync(TestPersonas.LuciaEmail);
        var beforeCount = beforeTokens.Count;

        var response = await _client.PostAsJsonAsync(
            "/api/identity/resend-verification",
            new ResendVerificationEmailRequest(TestPersonas.LuciaEmail));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var afterTokens = await GetEmailVerificationTokensAsync(TestPersonas.LuciaEmail);
        afterTokens.Count.ShouldBe(beforeCount);
    }

    [Fact]
    public async Task Returns_204_and_issues_no_token_for_disabled_user()
    {
        // Paula está disabled en seed.
        var response = await _client.PostAsJsonAsync(
            "/api/identity/resend-verification",
            new ResendVerificationEmailRequest(TestPersonas.PaulaEmail));

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task A_second_request_for_the_same_user_invalidates_the_first_resent_token()
    {
        var first = await _client.PostAsJsonAsync(
            "/api/identity/resend-verification",
            new ResendVerificationEmailRequest(TestPersonas.MartinEmail));
        first.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var second = await _client.PostAsJsonAsync(
            "/api/identity/resend-verification",
            new ResendVerificationEmailRequest(TestPersonas.MartinEmail));
        second.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var tokens = await GetEmailVerificationTokensAsync(TestPersonas.MartinEmail);
        tokens.Count(t => t.IsActive).ShouldBe(1);
        tokens.Count(t => t.IsInvalidated).ShouldBeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Returns_429_after_three_requests_in_the_window_from_the_same_ip()
    {
        for (var i = 0; i < 3; i++)
        {
            var response = await _client.PostAsJsonAsync(
                "/api/identity/resend-verification",
                new ResendVerificationEmailRequest(TestPersonas.MartinEmail));
            response.StatusCode.ShouldBe(HttpStatusCode.NoContent, $"attempt {i + 1} debería pasar");
        }

        var fourth = await _client.PostAsJsonAsync(
            "/api/identity/resend-verification",
            new ResendVerificationEmailRequest(TestPersonas.MartinEmail));

        fourth.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
        var body = await fourth.Content.ReadAsStringAsync();
        body.ShouldContain("identity.rate_limit.exceeded");
    }
}
