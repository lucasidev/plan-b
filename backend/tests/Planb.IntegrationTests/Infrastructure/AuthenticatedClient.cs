using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Helper para integration tests post-JwtBearer middleware. Crea un user + verifica + sign-in
/// + devuelve un <see cref="HttpClient"/> con la cookie de sesión persistida.
///
/// <para>
/// Por qué hace falta: desde el cierre del workaround pre-JWT, los endpoints <c>/api/me/*</c>
/// requieren <c>RequireAuthorization()</c> y leen el UserId del claim <c>sub</c>. Los tests
/// que hacían \"POST con userId en body\" ahora necesitan estar autenticados.
/// </para>
///
/// <para>
/// Uso típico:
/// <code>
/// var auth = await AuthenticatedClient.CreateAsync(fixture, "lucia@x.local");
/// var resp = await auth.Client.PostAsJsonAsync("/api/me/student-profiles", new { ... });
/// </code>
/// </para>
/// </summary>
public sealed record AuthenticatedClient(
    HttpClient Client,
    UserId UserId,
    string AccessCookie,
    string RefreshCookie)
{
    public static async Task<AuthenticatedClient> CreateAsync(
        RegisterApiFixture fixture, string email, string password = "valid-password-12c",
        UserRole? role = null)
    {
        // 1) Register. La carrera es obligatoria en el alta (ADR-0086), pero el profile que
        // declara acá no llega a nacer: el paso 2 fuerza email_verified_at por SQL y saltea
        // User.VerifyEmail, que es quien lo materializa. Los tests que necesitan un profile
        // lo crean por POST /api/me/student-profiles.
        using (var bootstrap = fixture.Factory.CreateClient())
        {
            var register = await bootstrap.PostAsJsonAsync(
                "/api/identity/register",
                new { email, password, careerPlanId = AcademicSeedData.Careers[2].Plan.Id.Value });
            register.EnsureSuccessStatusCode();

            // 2) Resolver el id por email y forzar verified via SQL: la respuesta del registro
            // no trae id (ADR-0076: es identica exista o no la cuenta), y el test no quiere
            // depender del flow verify-email completo cuando solo necesita una sesion valida.
            UserId userId;
            using (var scope = fixture.Factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
                var emailVo = EmailAddress.Create(email).Value;
                userId = (await db.Users.SingleAsync(u => u.Email == emailVo)).Id;
                await db.Database.ExecuteSqlRawAsync(
                    "UPDATE identity.users SET email_verified_at = NOW() WHERE id = {0}",
                    userId.Value);

                // Mint a staff role when asked (para testear endpoints gateados por rol). Vía EF,
                // no SQL crudo: así queda agnóstico a si el enum se persiste como int o string. El
                // sign-in de abajo lee el rol ya actualizado y lo mete en el JWT.
                if (role is not null)
                {
                    var user = await db.Users.FirstAsync(u => u.Id == userId);
                    db.Entry(user).Property(u => u.Role).CurrentValue = role.Value;
                    await db.SaveChangesAsync();
                }
            }

            // 3) Sign-in real (vía API) para capturar las cookies que el endpoint genera.
            using var signInClient = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                HandleCookies = false,
            });
            var signIn = await signInClient.PostAsJsonAsync(
                "/api/identity/sign-in",
                new { email, password });
            signIn.EnsureSuccessStatusCode();

            var setCookies = signIn.Headers.GetValues("Set-Cookie").ToList();
            var access = ExtractCookieValue(setCookies, "planb_session");
            var refresh = ExtractCookieValue(setCookies, "planb_refresh");

            // 4) Cliente final con las cookies pre-cargadas. Reuses la factory para que comparta
            // el mismo TestServer + DB que ya configuró el fixture.
            var client = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                HandleCookies = false, // las metemos manualmente para evitar redirect handling
            });
            client.DefaultRequestHeaders.Add(
                "Cookie",
                $"planb_session={access}; planb_refresh={refresh}");

            return new AuthenticatedClient(client, userId, access, refresh);
        }
    }

    /// <summary>
    /// Sign-in-only variant para cuentas que YA existen (ej. personas de staff seedeadas). Saltea el
    /// register; asume la cuenta verificada. Captura las mismas cookies de sesión que CreateAsync.
    /// </summary>
    public static async Task<AuthenticatedClient> SignInAsync(
        RegisterApiFixture fixture, string email, string password)
    {
        UserId userId;
        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
            var emailVo = EmailAddress.Create(email).Value;
            var user = await db.Users.AsNoTracking().FirstAsync(u => u.Email == emailVo);
            userId = user.Id;
        }

        using var signInClient = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });
        var signIn = await signInClient.PostAsJsonAsync(
            "/api/identity/sign-in", new { email, password });
        signIn.EnsureSuccessStatusCode();

        var setCookies = signIn.Headers.GetValues("Set-Cookie").ToList();
        var access = ExtractCookieValue(setCookies, "planb_session");
        var refresh = ExtractCookieValue(setCookies, "planb_refresh");

        var client = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });
        client.DefaultRequestHeaders.Add(
            "Cookie", $"planb_session={access}; planb_refresh={refresh}");

        return new AuthenticatedClient(client, userId, access, refresh);
    }

    private static string ExtractCookieValue(IEnumerable<string> setCookieHeaders, string name)
    {
        var header = setCookieHeaders.FirstOrDefault(c => c.StartsWith($"{name}="))
            ?? throw new InvalidOperationException(
                $"Sign-in response did not contain Set-Cookie for '{name}'.");

        // El header tiene shape `name=value; Path=/; HttpOnly; ...`. Extraemos el valor.
        var firstSemicolon = header.IndexOf(';');
        var keyValue = firstSemicolon < 0 ? header : header[..firstSemicolon];
        var equalsAt = keyValue.IndexOf('=');
        return equalsAt < 0 ? string.Empty : keyValue[(equalsAt + 1)..];
    }

}
