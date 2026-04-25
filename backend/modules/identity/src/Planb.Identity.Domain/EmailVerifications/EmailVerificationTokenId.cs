namespace Planb.Identity.Domain.EmailVerifications;

public readonly record struct EmailVerificationTokenId
{
    public Guid Value { get; private init; }

    public EmailVerificationTokenId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException(
                "EmailVerificationTokenId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static EmailVerificationTokenId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
