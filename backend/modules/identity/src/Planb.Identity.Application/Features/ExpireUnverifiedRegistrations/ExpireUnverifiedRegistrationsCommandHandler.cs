using Microsoft.Extensions.Logging;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Reading;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.ExpireUnverifiedRegistrations;

/// <summary>
/// Handler del scheduled job de US-022. Política:
///   1. Pedir candidatos al read service (users sin verificar, no disabled, no expired,
///      created_at &lt;= now - 7d).
///   2. Para cada candidato, cargar el aggregate, llamar <c>User.ExpireRegistration</c>,
///      tolerar fallos individuales.
///   3. Persistir en una sola transacción al final.
///
/// La cutoff de 7 días vive aquí (no en el read service) porque es regla de negocio. El read
/// service sólo expone la query con un cutoff parametrizable que el dominio le entrega.
///
/// Tolerancia: si un user falla en mutar (porque otro proceso ya lo verificó entre el SELECT y
/// el UPDATE, por ejemplo), se logea warning y se sigue con el resto. La idempotencia del job
/// (corre todos los días) garantiza que si una corrida falla parcial, la próxima la cubre.
/// </summary>
public static class ExpireUnverifiedRegistrationsCommandHandler
{
    /// <summary>Ventana de gracia entre Register y expiración. Documenado en US-022.</summary>
    private static readonly TimeSpan UnverifiedGracePeriod = TimeSpan.FromDays(7);

    public static async Task<Result> Handle(
        ExpireUnverifiedRegistrationsCommand _,
        IUserRepository users,
        IIdentityReadService reads,
        IIdentityUnitOfWork unitOfWork,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        ILogger<ExpireUnverifiedRegistrationsCommandLogger> logger,
        CancellationToken ct)
    {
        var cutoff = clock.UtcNow - UnverifiedGracePeriod;
        var candidateIds = await reads.GetUnverifiedExpirationCandidatesAsync(cutoff, ct);

        if (candidateIds.Count == 0)
        {
            logger.LogInformation(
                "ExpireUnverifiedRegistrations: 0 candidates at cutoff {Cutoff:o}", cutoff);
            return Result.Success();
        }

        var expired = new List<User>(candidateIds.Count);
        var skipped = 0;

        foreach (var id in candidateIds)
        {
            var user = await users.FindByIdAsync(id, ct);
            if (user is null)
            {
                // Race: el user existía cuando el SELECT corrió pero ya no está. Imposible hoy
                // porque no hay hard-delete, pero defendemos la rama por si el modelo cambia.
                skipped++;
                continue;
            }

            var result = user.ExpireRegistration(clock);
            if (result.IsFailure)
            {
                // El aggregate sólo rechaza cuando el user ya no es elegible (verificó entre
                // SELECT y carga, ya estaba expired, etc). Loggeamos y seguimos.
                logger.LogWarning(
                    "ExpireUnverifiedRegistrations: user {UserId} skipped: {ErrorCode}",
                    id, result.Error.Code);
                skipped++;
                continue;
            }

            expired.Add(user);
        }

        if (expired.Count > 0)
        {
            await DomainEventDispatcher.DispatchAsync(expired, publisher, ct);
            await unitOfWork.SaveChangesAsync(ct);
        }

        logger.LogInformation(
            "ExpireUnverifiedRegistrations: {Expired} expired, {Skipped} skipped (cutoff {Cutoff:o})",
            expired.Count, skipped, cutoff);

        return Result.Success();
    }
}

/// <summary>
/// Marcador para tipar el ILogger del handler. Wolverine resuelve el ILogger&lt;T&gt; usando este
/// tipo, asi sale como categoría legible en los sinks.
/// </summary>
public sealed class ExpireUnverifiedRegistrationsCommandLogger;
