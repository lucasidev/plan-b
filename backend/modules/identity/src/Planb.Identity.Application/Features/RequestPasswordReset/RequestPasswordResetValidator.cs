using FluentValidation;

namespace Planb.Identity.Application.Features.RequestPasswordReset;

internal sealed class RequestPasswordResetValidator : AbstractValidator<RequestPasswordResetCommand>
{
    public const int MaxEmailLength = 254;

    public RequestPasswordResetValidator()
    {
        // Don't validate format here. Anti-enumeration: malformed input goes down the same
        // silent-success path as unknown emails. The handler is the one that maps malformed
        // input to "do nothing" without telling the caller why.
        RuleFor(c => c.Email).NotEmpty().MaximumLength(MaxEmailLength);
    }
}
