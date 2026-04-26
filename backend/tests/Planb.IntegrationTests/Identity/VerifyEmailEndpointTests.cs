using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.RegisterUser;
using Planb.Identity.Application.Features.VerifyEmail;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

public class VerifyEmailEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public VerifyEmailEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    private static string FreshEmail(string label) => $"{label}.{Guid.NewGuid():N}@planb.local";

    private async Task<(Guid UserId, string Token)> RegisterAndCaptureTokenAsync(string email)
    {
        var register = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));
        register.StatusCode.ShouldBe(HttpStatusCode.Created);
        var body = await register.Content.ReadFromJsonAsync<RegisterUserResponse>();
        body.ShouldNotBeNull();

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == new UserId(body.Id));
        var token = user.Tokens.Single(t => t.Purpose == TokenPurpose.UserEmailVerification);
        return (body.Id, token.Token);
    }

    [Fact]
    public async Task Returns_200_and_marks_user_verified_with_a_valid_token()
    {
        var (userId, rawToken) = await RegisterAndCaptureTokenAsync(FreshEmail("verify"));

        var response = await _client.PostAsJsonAsync(
            "/api/identity/verify-email",
            new VerifyEmailRequest(rawToken));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<VerifyEmailResponse>();
        body.ShouldNotBeNull();
        body.UserId.ShouldBe(userId);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == new UserId(userId));
        user.EmailVerifiedAt.ShouldNotBeNull();
        user.IsEmailVerified.ShouldBeTrue();
        var token = user.Tokens.Single(t => t.Purpose == TokenPurpose.UserEmailVerification);
        token.IsConsumed.ShouldBeTrue();
    }

    [Fact]
    public async Task Is_idempotent_when_called_twice_with_the_same_token()
    {
        var (_, rawToken) = await RegisterAndCaptureTokenAsync(FreshEmail("idempotent"));

        (await _client.PostAsJsonAsync(
            "/api/identity/verify-email",
            new VerifyEmailRequest(rawToken)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var second = await _client.PostAsJsonAsync(
            "/api/identity/verify-email",
            new VerifyEmailRequest(rawToken));

        second.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Returns_404_when_token_does_not_exist()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/verify-email",
            new VerifyEmailRequest("nonexistent-token-value"));

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_400_when_token_is_blank()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/verify-email",
            new VerifyEmailRequest(""));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
