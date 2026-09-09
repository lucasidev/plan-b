using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Resuelve el id real de una cuenta sembrada por su mail, para las personas a las que
/// <see cref="Planb.Reviews.Application.Seeding.CorpusSeeder"/> les suma reseñas propias
/// (lucia.mansilla@gmail.com, matias.ledesma@gmail.com). Compartido entre
/// <see cref="CorpusSeedHostedService"/> (Development) y <see cref="SeedDbCommand"/> (el verbo
/// `seed-db` del stage) para que los dos resuelvan la misma cuenta de la misma forma.
/// </summary>
public static class SeededPersonaAccountResolver
{
    /// <summary>
    /// Tiene que matchear el mail de <c>seed-data/personas.json</c>.
    /// </summary>
    public const string LuciaEmail = "lucia.mansilla@gmail.com";

    /// <summary>
    /// Tiene que matchear el mail de <c>seed-data/personas.json</c>.
    /// </summary>
    public const string MatiasEmail = "matias.ledesma@gmail.com";

    /// <summary>
    /// Nace random al registrarse (<c>User.Register</c> no acepta un id determinístico), así que no
    /// hay forma de conocerlo de antemano: hay que resolverlo contra identity en cada corrida. Null
    /// si por algún motivo la persona no está sembrada (el corpus sigue igual, solo sin su reseña
    /// propia).
    /// </summary>
    public static async Task<Guid?> ResolveAsync(IServiceProvider services, string email, CancellationToken ct)
    {
        var emailResult = EmailAddress.Create(email);
        if (emailResult.IsFailure)
        {
            return null;
        }

        var users = services.GetRequiredService<IUserRepository>();
        var persona = await users.FindByEmailAsync(emailResult.Value, ct);
        return persona?.Id.Value;
    }
}
