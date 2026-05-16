using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Planb.Academic.Application.Abstractions.Security;

/// <summary>
/// Helper para extraer el UserId del JWT validado por el JwtBearer middleware (post US-T05).
/// Replicado del homónimo en Identity.Application porque Academic no puede referenciar Identity
/// (Identity ya referencia Academic, sería cycle). TODO: mover ambos a SharedKernel cuando un
/// tercer caller lo justifique.
///
/// El método devuelve un <c>Guid?</c> (no el VO <c>UserId</c> de Identity) para no acoplar
/// Academic al tipo interno del otro BC; los handlers de Academic ya consumen Guid en sus
/// commands (cross-BC reference por id sin nav).
/// </summary>
public static class CurrentUser
{
    public static Guid? GetUserId(HttpContext http)
    {
        ArgumentNullException.ThrowIfNull(http);
        var raw =
            http.User.FindFirstValue("sub")
            ?? http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var guid) && guid != Guid.Empty ? guid : null;
    }

    public static Guid RequireUserId(HttpContext http) =>
        GetUserId(http)
        ?? throw new InvalidOperationException(
            "No authenticated user. Did you forget .RequireAuthorization() on this endpoint?");
}
