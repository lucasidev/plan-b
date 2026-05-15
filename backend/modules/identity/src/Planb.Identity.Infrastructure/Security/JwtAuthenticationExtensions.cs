using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Planb.Identity.Infrastructure.Security;

/// <summary>
/// Wire del middleware JwtBearer del módulo Identity. Cierra el workaround pre-JWT donde los
/// endpoints <c>/api/me/*</c> aceptaban <c>userId</c> explícito en body/query.
///
/// <para>
/// Convenciones:
/// <list type="bullet">
///   <item>Usa los mismos <see cref="JwtOptions"/> que <see cref="JwtIssuer"/>: si Issuer/Audience
///         o Secret cambian, ambos lados se actualizan en bloque.</item>
///   <item>Reads del token: primero <c>Authorization: Bearer</c> (cliente API), después la
///         cookie <c>planb_session</c> (frontend de Next.js que setea httpOnly cookies post
///         sign-in/refresh, ver SignInEndpoint).</item>
///   <item><c>MapInboundClaims = false</c>: queremos el claim raw <c>sub</c> y no la versión
///         ASP.NET-mapped <c>ClaimTypes.NameIdentifier</c>. Esto matchea cómo
///         <see cref="JwtIssuer"/> setea los claims y simplifica <c>CurrentUser.GetUserId</c>.</item>
/// </list>
/// </para>
/// </summary>
public static class JwtAuthenticationExtensions
{
    /// <summary>Cookie name del access token (espejo de <c>SignInEndpoint.AccessCookieName</c>).</summary>
    public const string AccessCookieName = "planb_session";

    public static IServiceCollection AddIdentityJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        var jwt = jwtSection.Get<JwtOptions>()
            ?? throw new InvalidOperationException(
                "JWT configuration is missing. Set JWT__Secret + JWT__Issuer + JWT__Audience.");

        // Validamos shape mínimo para fallar fast en startup, no en la primera request.
        if (string.IsNullOrWhiteSpace(jwt.Secret) || jwt.Secret.Length < 32)
        {
            throw new InvalidOperationException(
                "JWT__Secret must be at least 32 chars (HS256 + 256-bit symmetric key).");
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret));

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opts =>
            {
                // No queremos el remap automático de `sub` → `ClaimTypes.NameIdentifier`.
                // Mantenemos los claims raw del JWT para que `CurrentUser` lea exactamente
                // lo que `JwtIssuer` emitió.
                opts.MapInboundClaims = false;

                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey,
                    ValidateLifetime = true,
                    // ClockSkew default es 5 min. Como nuestros access tokens duran 15 min y
                    // tenemos refresh token, lo bajamos a 30s: detectamos expiración casi en
                    // tiempo real y forzamos refresh, sin tolerar exceso de drift.
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = JwtRegisteredClaimNames.Sub,
                };

                opts.Events = new JwtBearerEvents
                {
                    // Si el cliente no manda Authorization header pero sí cookie planb_session,
                    // tomamos el token de ahí. Mantiene compat con el frontend que usa httpOnly
                    // cookies (ADR-0023) sin exigir doble-storage en el cliente.
                    OnMessageReceived = context =>
                    {
                        if (string.IsNullOrEmpty(context.Token)
                            && context.Request.Cookies.TryGetValue(AccessCookieName, out var fromCookie)
                            && !string.IsNullOrWhiteSpace(fromCookie))
                        {
                            context.Token = fromCookie;
                        }
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorization();
        return services;
    }

    /// <summary>
    /// Conveniencia para wirear los dos middlewares en el orden correcto desde
    /// <c>Program.cs</c>: Authentication antes que Authorization, y ambos antes que MapCarter.
    /// </summary>
    public static WebApplication UseIdentityJwtAuthentication(this WebApplication app)
    {
        app.UseAuthentication();
        app.UseAuthorization();
        return app;
    }
}
