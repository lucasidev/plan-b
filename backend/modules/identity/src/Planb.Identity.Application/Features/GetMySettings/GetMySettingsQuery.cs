using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.GetMySettings;

/// <summary>
/// Query del GET /api/users/me/settings (US-072). El endpoint extrae el UserId del JWT y
/// arma el query. El handler devuelve los settings persistidos o defaults sanos si el user
/// aún no personalizó nada (lazy creation pattern: el row se materializa solo en PATCH).
/// </summary>
public sealed record GetMySettingsQuery(UserId UserId);
