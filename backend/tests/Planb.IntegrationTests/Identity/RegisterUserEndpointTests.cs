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
    public async Task Returns_202_with_email_only_and_persists_user_and_token()
    {
        var email = FreshEmail("register");

        var response = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));

        // 202 y solo el email: la respuesta no trae id ni Location porque tiene que ser
        // identica exista o no la cuenta (ADR-0076).
        response.StatusCode.ShouldBe(HttpStatusCode.Accepted);
        var body = await response.Content.ReadFromJsonAsync<RegisterUserResponse>();
        body.ShouldNotBeNull();
        body.Email.ShouldBe(email);

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

        var emailVo = EmailAddress.Create(email).Value;
        var user = await db.Users.SingleAsync(u => u.Email == emailVo);
        user.Email.Value.ShouldBe(email);
        user.EmailVerifiedAt.ShouldBeNull();
        user.Role.ShouldBe(UserRole.Member);

        var token = user.Tokens
            .ShouldHaveSingleItem();
        token.Purpose.ShouldBe(TokenPurpose.UserEmailVerification);
        token.Token.ShouldNotBeNullOrEmpty();
        token.ConsumedAt.ShouldBeNull();
        token.InvalidatedAt.ShouldBeNull();
        token.ExpiresAt.ShouldBeGreaterThan(token.IssuedAt);
    }

    [Fact]
    public async Task Sends_verification_email_with_link_to_the_registered_address()
    {
        var email = FreshEmail("email-flow");

        var response = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));
        response.StatusCode.ShouldBe(HttpStatusCode.Accepted);

        var summary = await _mailpit.WaitForMessageToAsync(email, TimeSpan.FromSeconds(10));
        summary.ShouldNotBeNull(
            "The verification email should hit Mailpit's inbox within 10s of registration.");
        summary.Subject.ShouldContain("planb");

        var detail = await _mailpit.GetMessageDetailAsync(summary.Id);
        detail.ShouldNotBeNull();
        detail.Html.ShouldContain("token=");
    }

    [Fact]
    public async Task Registering_past_the_mailbox_limit_still_answers_202_and_does_not_leak()
    {
        // ADR-0076 punto 5: el limite es por casilla de destino. Al bombardear un mail, la
        // respuesta sigue siendo 202 (el mail extra se descarta en silencio): un 429 visible
        // volveria a delatar que esa casilla es especial. Contrato HTTP estable; la ausencia
        // del mail la garantiza el rate limiter, con su propio test unitario.
        var email = FreshEmail("mailbox-flood");

        HttpStatusCode? distinct = null;
        for (var i = 0; i < 14; i++)
        {
            var r = await _client.PostAsJsonAsync(
                "/api/identity/register",
                new RegisterUserRequest(email, "valid-password-12c"));
            if (r.StatusCode != HttpStatusCode.Accepted)
            {
                distinct = r.StatusCode;
                break;
            }
        }

        distinct.ShouldBeNull(
            $"Todo intento sobre la misma casilla responde 202; apareció {distinct}.");
    }

    [Fact]
    public async Task Registering_with_a_taken_email_responds_exactly_like_a_free_one()
    {
        // ADR-0076: las tres puertas responden igual exista o no la cuenta. Confirmar que un
        // mail tiene cuenta es confirmar que esa persona aporto, y este endpoint era la puerta
        // por la que se enumeraba. La pantalla no distingue; el mail que llega si.
        var email = FreshEmail("enumeration");

        var first = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));
        await _mailpit.ClearAsync();

        var second = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "another-password-12"));

        second.StatusCode.ShouldBe(first.StatusCode);
        (await second.Content.ReadAsStringAsync())
            .ShouldBe(await first.Content.ReadAsStringAsync());

        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var emailVo = EmailAddress.Create(email).Value;
        (await db.Users.CountAsync(u => u.Email == emailVo)).ShouldBe(1);

        var summary = await _mailpit.WaitForMessageToAsync(email, TimeSpan.FromSeconds(10));
        summary.ShouldNotBeNull(
            "El dueno de la cuenta recibe el aviso de que alguien intento registrarse.");
        summary.Subject.ShouldContain("Ya ten");
        var detail = await _mailpit.GetMessageDetailAsync(summary.Id);
        detail.ShouldNotBeNull();
        detail.Html.ShouldNotContain("token=");
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
