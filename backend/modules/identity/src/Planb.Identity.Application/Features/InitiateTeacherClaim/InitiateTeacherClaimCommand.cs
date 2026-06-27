using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.InitiateTeacherClaim;

/// <summary>
/// US-030: el <see cref="UserId"/> se deriva del JWT (no del body); <see cref="TeacherId"/> es el
/// docente del catálogo que el member reclama.
/// </summary>
public sealed record InitiateTeacherClaimCommand(UserId UserId, Guid TeacherId);
