namespace Planb.SharedKernel.Abstractions.RateLimiting;

/// <summary>
/// Sliding-window rate limiter (Patrón #2 of <c>docs/architecture/redis-key-patterns.md</c>).
///
/// Key shape is opaque to the caller: callers compose a stable string with the relevant
/// dimensions (operation + IP hash, operation + email hash, etc.). Implementations may add
/// their own prefix (e.g. <c>identity:ratelimit:{key}</c>) but the caller must not depend
/// on the wire shape.
///
/// Failure mode: per ADR-0034 patrón #2, when the backing store is unreachable the limiter
/// fails open (<see cref="RateLimitResult.Allowed"/> with <see cref="RateLimitResult.Available"/>
/// equal to <c>maxRequests</c>) and the implementation logs a warning. Better to serve a few
/// extra requests than to lock everyone out of the app when Redis flaps.
///
/// <para>
/// Vive en SharedKernel y no en un módulo porque no tiene semántica de ninguno: nació en Identity
/// (forgot-password, reenvío de verificación) y terminó throttleando la búsqueda del catálogo, el
/// reporte de reseñas y el guardado de borradores. Tres módulos referenciando
/// <c>Planb.Identity.Application</c> para pedir un contador de intentos describía una dependencia
/// que no existe: nada de lo que hace este contrato sabe qué es un usuario.
/// </para>
/// </summary>
public interface IRateLimiter
{
    /// <summary>
    /// Records an attempt at <paramref name="key"/> and returns whether it is allowed.
    /// The implementation is responsible for atomically purging entries older than
    /// <paramref name="window"/>, recording the new attempt, and comparing against
    /// <paramref name="maxRequests"/>.
    /// </summary>
    /// <param name="key">Stable identifier for the bucket (caller-composed).</param>
    /// <param name="window">Sliding window length (e.g. 1h for forgot-password).</param>
    /// <param name="maxRequests">Allowed attempts within the window.</param>
    Task<RateLimitResult> TryAcquireAsync(
        string key,
        TimeSpan window,
        int maxRequests,
        CancellationToken ct = default);
}

/// <summary>
/// Outcome of a <see cref="IRateLimiter.TryAcquireAsync"/> call.
/// </summary>
/// <param name="Allowed">
/// True when the attempt counts within the configured ceiling. False means the caller
/// should reject the request with 429 (or equivalent).
/// </param>
/// <param name="Available">Remaining attempts in the current window after this call.</param>
public readonly record struct RateLimitResult(bool Allowed, int Available);
