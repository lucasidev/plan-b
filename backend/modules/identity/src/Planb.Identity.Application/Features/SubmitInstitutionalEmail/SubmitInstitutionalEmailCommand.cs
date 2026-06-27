using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.SubmitInstitutionalEmail;

/// <summary>
/// US-031 paso 1: el owner (<see cref="UserId"/>, del JWT) ingresa su <see cref="Email"/> institucional
/// para el claim <see cref="ClaimId"/>.
/// </summary>
public sealed record SubmitInstitutionalEmailCommand(UserId UserId, Guid ClaimId, string Email);
