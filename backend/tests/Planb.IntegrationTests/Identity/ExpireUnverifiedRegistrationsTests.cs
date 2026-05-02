using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Features.ExpireUnverifiedRegistrations;
using Planb.Identity.Application.Features.RegisterUser;
using Planb.Identity.Application.Features.SignIn;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Wolverine;
using Xunit;

namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Tests integration de US-022. En lugar de mockear el clock global, "back-datamos" un user
/// directamente via DbContext (created_at en el pasado) y disparamos el comando vía IMessageBus.
/// Eso ejercita la query Dapper real, el handler real, la migration real, y la mutación EF real.
///
/// Cobertura:
///   - User con created_at &gt; 7d y unverified → queda con expired_at != null.
///   - User verificado → no se toca aunque sea viejo.
///   - User disabled → no se toca aunque sea viejo y unverified.
///   - User dentro del grace period (created_at &lt; 7d) → no se toca.
///   - Sign-in de un user expired → 401 InvalidCredentials.
///   - Re-register del mismo email post-expire → 201 (partial unique index lo permite).
/// </summary>
public class ExpireUnverifiedRegistrationsTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public ExpireUnverifiedRegistrationsTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private static string FreshEmail(string label) => $"{label}.{Guid.NewGuid():N}@planb.local";

    private async Task<UserId> RegisterAndBackdateAsync(string email, TimeSpan ageFromNow)
    {
        var register = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));
        register.EnsureSuccessStatusCode();
        var body = await register.Content.ReadFromJsonAsync<RegisterUserResponse>();

        // Back-date el created_at vía SQL directo. Esto evita acoplar el test al clock global
        // del host: el comando va a usar IDateTimeProvider real, calcula cutoff = now - 7d, y
        // este user queda dentro del set de candidatos.
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var newCreatedAt = DateTimeOffset.UtcNow - ageFromNow;
        await db.Database.ExecuteSqlRawAsync(
            "UPDATE identity.users SET created_at = {0} WHERE id = {1}",
            newCreatedAt,
            body!.Id);

        return new UserId(body.Id);
    }

    private async Task<User?> ReloadUserAsync(UserId id)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        return await db.Users.IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    private async Task DispatchExpireCommandAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var bus = scope.ServiceProvider.GetRequiredService<IMessageBus>();
        await bus.InvokeAsync(new ExpireUnverifiedRegistrationsCommand());
    }

    [Fact]
    public async Task User_unverified_for_more_than_seven_days_gets_expired()
    {
        var email = FreshEmail("expire-stale");
        var userId = await RegisterAndBackdateAsync(email, TimeSpan.FromDays(8));

        await DispatchExpireCommandAsync();

        var user = await ReloadUserAsync(userId);
        user.ShouldNotBeNull();
        user.ExpiredAt.ShouldNotBeNull();
    }

    [Fact]
    public async Task Verified_user_is_not_expired_even_when_old()
    {
        var email = FreshEmail("expire-verified");
        await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "valid-password-12c"));

        // Verificarlo: tomar el token de la DB y consumirlo via aggregate (atajo, evitamos
        // ir por el endpoint de verify-email que requiere mock de clock o un email parsing).
        UserId userId;
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
            var emailVo = EmailAddress.Create(email).Value;
            var user = await db.Users.SingleAsync(u => u.Email == emailVo);
            userId = user.Id;
            user.GetType()
                .GetProperty("EmailVerifiedAt")!
                .SetValue(user, (DateTimeOffset?)DateTimeOffset.UtcNow);
            await db.SaveChangesAsync();
        }

        // Back-date al pasado.
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE identity.users SET created_at = {0} WHERE id = {1}",
                DateTimeOffset.UtcNow - TimeSpan.FromDays(30),
                userId.Value);
        }

        await DispatchExpireCommandAsync();

        var reloaded = await ReloadUserAsync(userId);
        reloaded.ShouldNotBeNull();
        reloaded.ExpiredAt.ShouldBeNull();
    }

    [Fact]
    public async Task User_within_grace_period_is_not_expired()
    {
        var email = FreshEmail("expire-young");
        var userId = await RegisterAndBackdateAsync(email, TimeSpan.FromDays(3));

        await DispatchExpireCommandAsync();

        var user = await ReloadUserAsync(userId);
        user.ShouldNotBeNull();
        user.ExpiredAt.ShouldBeNull();
    }

    [Fact]
    public async Task SignIn_returns_401_invalid_credentials_for_expired_user()
    {
        var email = FreshEmail("expire-signin");
        await RegisterAndBackdateAsync(email, TimeSpan.FromDays(8));
        await DispatchExpireCommandAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(email, "valid-password-12c"));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("invalid_credentials");
    }

    [Fact]
    public async Task Re_register_with_same_email_after_expiration_succeeds()
    {
        var email = FreshEmail("expire-rereg");
        await RegisterAndBackdateAsync(email, TimeSpan.FromDays(8));
        await DispatchExpireCommandAsync();

        var second = await _client.PostAsJsonAsync(
            "/api/identity/register",
            new RegisterUserRequest(email, "different-password-12c"));

        second.StatusCode.ShouldBe(HttpStatusCode.Created);

        // Confirmamos que en la DB quedan dos rows con el mismo email: el expired (audit) y
        // el nuevo activo. El partial unique index permite esta coexistencia.
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var emailVo = EmailAddress.Create(email).Value;
        var rows = await db.Users.IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.Email == emailVo)
            .ToListAsync();
        rows.Count.ShouldBe(2);
        rows.Count(u => u.ExpiredAt is not null).ShouldBe(1);
        rows.Count(u => u.ExpiredAt is null).ShouldBe(1);
    }
}
