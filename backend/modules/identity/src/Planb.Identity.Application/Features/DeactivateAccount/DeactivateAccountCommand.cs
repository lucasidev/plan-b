using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.DeactivateAccount;

/// <summary>
/// Command del DELETE /api/me/account (ADR-0044, soft delete con anonimización). El endpoint
/// extrae el <see cref="UserId"/> del JWT y arma el comando — no acepta userId externo.
/// </summary>
public sealed record DeactivateAccountCommand(UserId UserId);
