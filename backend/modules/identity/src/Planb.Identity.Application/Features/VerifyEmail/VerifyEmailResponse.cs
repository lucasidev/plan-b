namespace Planb.Identity.Application.Features.VerifyEmail;

public sealed record VerifyEmailResponse(Guid UserId, DateTimeOffset VerifiedAt);
