using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Persistence;

/// <summary>
/// Repositorio del aggregate <see cref="UserSettings"/>. Settings tienen lifecycle independiente
/// del User: se crean lazy en el primer PATCH (no en el Register). Si el user nunca personalizó
/// nada, no hay row, y el query handler devuelve los defaults sin tocar la DB.
/// </summary>
public interface IUserSettingsRepository
{
    void Add(UserSettings settings);

    Task<UserSettings?> FindByUserIdAsync(UserId userId, CancellationToken ct = default);
}
