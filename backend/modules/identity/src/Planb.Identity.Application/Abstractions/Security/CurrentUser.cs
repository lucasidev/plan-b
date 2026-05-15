using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Security;

// JwtRegisteredClaimNames.Sub = "sub". Lo hardcodeamos como literal acá para no traer el
// System.IdentityModel.Tokens.Jwt package al Application layer (vive solo en Infrastructure).

/// <summary>
/// Helpers para extraer la identidad del caller desde el JWT validado por el middleware
/// JwtBearer (US-T05 / cierre del workaround pre-JWT). Se usa desde los endpoints que viven
/// bajo <c>/api/me/*</c> en lugar de aceptar <c>userId</c> en body o query string.
///
/// <para>
/// Si el endpoint corre <c>.RequireAuthorization()</c>, el middleware ya rechazó las requests
/// sin token válido con 401, así que <see cref="GetUserId"/> nunca devuelve null cuando el
/// pipeline llegó al handler. Igual exponemos versión nullable + throw helper para que cada
/// caller elija la semántica clara (un endpoint que olvidó marcar RequireAuthorization
/// preferimos que pegue contra una InvalidOperationException temprana, no contra un
/// Guid.Empty silencioso).
/// </para>
/// </summary>
public static class CurrentUser
{
    /// <summary>
    /// Devuelve el <see cref="UserId"/> del JWT (claim <c>sub</c>) o null si no hay user
    /// autenticado / el claim falta / no parsea como Guid.
    /// </summary>
    public static UserId? GetUserId(HttpContext http)
    {
        ArgumentNullException.ThrowIfNull(http);

        // Buscamos primero el claim estándar `sub` y luego el `nameidentifier` (ASP.NET map por
        // default `sub` → `ClaimTypes.NameIdentifier` salvo que lo deshabilitemos, lo cual lo
        // hacemos en `JwtAuthenticationExtensions`).
        var raw =
            http.User.FindFirstValue("sub")
            ?? http.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var guid) && guid != Guid.Empty
            ? new UserId(guid)
            : null;
    }

    /// <summary>
    /// Versión strict que lanza si no hay user autenticado. Usar después de
    /// <c>.RequireAuthorization()</c> para acceder al UserId sin guard adicional.
    /// </summary>
    public static UserId RequireUserId(HttpContext http) =>
        GetUserId(http)
        ?? throw new InvalidOperationException(
            "No authenticated user. Did you forget .RequireAuthorization() on this endpoint?");
}
