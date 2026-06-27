using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.VerifyTeacherClaim;

/// <summary>US-031 paso 2: el owner (<see cref="UserId"/>) consume el <see cref="RawToken"/> del link de mail.</summary>
public sealed record VerifyTeacherClaimCommand(UserId UserId, string RawToken);
