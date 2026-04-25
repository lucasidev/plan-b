using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.RegisterUser;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

public class RegisterUserEndpointTests : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;
    private readonly MailpitClient _mailpit = new();

    public RegisterUserEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    public Task InitializeAsync() => _mailpit.ClearAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private static string FreshEmail(string label) => $"{label}.{Guid.NewGuid():N}@planb.local";

    [Fact]
    public async Task Returns_201_with_user_payload_and_persists_user_and_token()
    {
        var email = FreshEmail("register");

        var response = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<RegisterUserResponse>();
        body.ShouldNotBeNull();
        body.Email.ShouldBe(email);
        body.Id.ShouldNotBe(Guid.Empty);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        var user = await db.Users.SingleAsync(u => u.Id == new UserId(body.Id));
        user.Email.Value.ShouldBe(email);
        user.EmailVerifiedAt.ShouldBeNull();
        user.Role.ShouldBe(UserRole.Member);

        var token = await db.EmailVerificationTokens
            .SingleAsync(t => t.UserId == user.Id);
        token.Token.ShouldNotBeNullOrEmpty();
        token.ConsumedAt.ShouldBeNull();
        token.ExpiresAt.ShouldBeGreaterThan(token.IssuedAt);
    }

    [Fact]
    public async Task Sends_verification_email_with_link_to_the_registered_address()
    {
        var email = FreshEmail("email-flow");

        var response = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var summary = await _mailpit.WaitForMessageToAsync(email, TimeSpan.FromSeconds(10));
        summary.ShouldNotBeNull(
            "The verification email should hit Mailpit's inbox within 10s of registration.");
        summary.Subject.ShouldContain("planb");

        var detail = await _mailpit.GetMessageDetailAsync(summary.Id);
        detail.ShouldNotBeNull();
        detail.Html.ShouldContain("token=");
    }

    [Fact]
    public async Task Returns_409_when_email_is_already_registered()
    {
        var email = FreshEmail("conflict");

        (await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c")))
            .StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Returns_400_when_password_is_short()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(FreshEmail("short-password"), "short"));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_when_email_is_malformed()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest("not-an-email", "valid-password-12c"));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
