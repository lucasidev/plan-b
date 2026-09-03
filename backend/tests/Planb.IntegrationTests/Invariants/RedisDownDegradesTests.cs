using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// Redis caído degrada, no rompe (ADR-0034): Postgres es la fuente de verdad, Redis es cache o
/// estado efímero, y <c>AbortOnConnectFail=false</c> (host/Planb.Api/Program.cs) dice que un
/// Redis caído no impide levantar el host. Cada consumidor (refresh tokens, rate limiter) tiene
/// su fallback documentado en backend/CLAUDE.md.
/// </summary>
public class RedisDownDegradesTests : IClassFixture<RedisDownApiFixture>
{
    private readonly RedisDownApiFixture _fixture;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid Term = Guid.Parse("00000005-0000-4000-a000-000000000001");
    private const string Password = "valid-password-12c";

    public RedisDownDegradesTests(RedisDownApiFixture fixture)
    {
        _fixture = fixture;
    }

    private sealed record SignedInSession(HttpClient Client, string RefreshCookie);

    /// <summary>
    /// Register + forzar verificado por SQL + sign-in: la misma receta de
    /// <see cref="AuthenticatedClient.CreateAsync"/>, reescrita acá porque ese helper pide un
    /// <see cref="RegisterApiFixture"/> y este test corre contra un fixture distinto.
    /// </summary>
    private async Task<SignedInSession> RegisterAndSignInAsync(string email)
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var register = await bootstrap.PostAsJsonAsync(
            "/api/identity/register",
            new { email, password = Password, careerPlanId = TudcsPlanId });
        register.StatusCode.ShouldBe(HttpStatusCode.Accepted, await register.Content.ReadAsStringAsync());

        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
            var emailVo = EmailAddress.Create(email).Value;
            var userId = (await db.Users.SingleAsync(u => u.Email == emailVo)).Id;
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE identity.users SET email_verified_at = NOW() WHERE id = {0}", userId.Value);
        }

        using var signInClient = _fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });
        var signIn = await signInClient.PostAsJsonAsync(
            "/api/identity/sign-in", new { email, password = Password });
        signIn.StatusCode.ShouldBe(HttpStatusCode.OK, await signIn.Content.ReadAsStringAsync());

        var setCookies = signIn.Headers.GetValues("Set-Cookie").ToList();
        var access = ExtractCookieValue(setCookies, "planb_session");
        var refresh = ExtractCookieValue(setCookies, "planb_refresh");

        var client = _fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });
        client.DefaultRequestHeaders.Add("Cookie", $"planb_session={access}; planb_refresh={refresh}");

        return new SignedInSession(client, refresh);
    }

    private static string ExtractCookieValue(IEnumerable<string> setCookieHeaders, string name)
    {
        var header = setCookieHeaders.FirstOrDefault(c => c.StartsWith($"{name}="))
            ?? throw new InvalidOperationException(
                $"Sign-in response did not contain Set-Cookie for '{name}'.");
        var firstSemicolon = header.IndexOf(';');
        var keyValue = firstSemicolon < 0 ? header : header[..firstSemicolon];
        var equalsAt = keyValue.IndexOf('=');
        return equalsAt < 0 ? string.Empty : keyValue[(equalsAt + 1)..];
    }

    /// <summary>
    /// Si el host no llega a levantar con Redis caído, o alguno de estos pasos no completa, eso
    /// es un hallazgo del producto, no un problema del test (así lo pide el spec).
    /// </summary>
    [Fact]
    public async Task Registering_signing_in_reviewing_and_reading_the_ficha_work_with_redis_down()
    {
        var email = $"redisdown-{Guid.NewGuid():N}@planb.local";
        var session = await RegisterAndSignInAsync(email);

        (await session.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        var review = await session.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211,
                termId = Term,
                chairId = (Guid?)ChairPerez,
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = 1 } },
                freeText = (string?)null,
            });
        review.StatusCode.ShouldBe(HttpStatusCode.Created, await review.Content.ReadAsStringAsync());

        var ficha = await session.Client.GetAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        ficha.StatusCode.ShouldBe(HttpStatusCode.OK, await ficha.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// El refresh token se valida contra la revocation list de Redis. Sin Redis no hay forma de
    /// validarlo, y la respuesta seguridad-primero es pedir que se vuelva a loguear, no un 500.
    /// </summary>
    [Fact]
    public async Task Refreshing_a_session_returns_401_instead_of_500_when_redis_is_unreachable()
    {
        var email = $"redisdown-refresh-{Guid.NewGuid():N}@planb.local";
        var session = await RegisterAndSignInAsync(email);

        using var anonymous = _fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });
        anonymous.DefaultRequestHeaders.Add("Cookie", $"planb_refresh={session.RefreshCookie}");

        var refresh = await anonymous.PostAsync("/api/identity/refresh", null);

        refresh.StatusCode.ShouldBe(HttpStatusCode.Unauthorized, await refresh.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// El rate limiter (<c>IRateLimiter</c>, ADR-0034 patrón #2) vive en Redis: sin Redis, el
    /// fallback documentado es fail-open, no bloquea. RegisterUserEndpoint no sirve para
    /// observar eso desde afuera: devuelve el mismo 202 tanto si el limiter permite como si
    /// bloquea (ADR-0076, no revelar a la casilla de destino), así que un test ahí no distingue
    /// fail-open de fail-closed. Resend-verification sí responde 429 al bloquear (ver
    /// ResendVerificationEmailEndpoint, 3 por hora): con Redis caído, una cuarta request en la
    /// misma ventana tiene que seguir pasando en vez de cortarse en la tercera.
    /// </summary>
    [Fact]
    public async Task Exceeding_the_rate_limit_window_does_not_return_429_when_redis_is_unreachable()
    {
        var email = $"redisdown-ratelimit-{Guid.NewGuid():N}@planb.local";
        using var client = _fixture.Factory.CreateClient();

        for (var i = 0; i < 4; i++)
        {
            var response = await client.PostAsJsonAsync("/api/identity/resend-verification", new { email });

            response.StatusCode.ShouldBe(
                HttpStatusCode.NoContent, $"attempt {i + 1} debería pasar (Redis caído: fail-open)");
        }
    }
}
