using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Value object representing a user email. Immutable, lowercase-normalized, equatable by the
/// normalized value. Validation and normalization live here so every consumer sees a canonical form.
/// </summary>
public readonly record struct EmailAddress : IValueObject
{
    public string Value { get; private init; }

    private EmailAddress(string value) => Value = value;

    public static Result<EmailAddress> Create(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return UserErrors.EmailRequired;
        }

        var trimmed = raw.Trim();

        if (trimmed.Length > 254)
        {
            return UserErrors.EmailTooLong;
        }

        var at = trimmed.IndexOf('@');
        if (at <= 0 || at != trimmed.LastIndexOf('@') || at == trimmed.Length - 1)
        {
            return UserErrors.EmailInvalidFormat;
        }

        var domain = trimmed[(at + 1)..];
        if (!domain.Contains('.') || domain.StartsWith('.') || domain.EndsWith('.'))
        {
            return UserErrors.EmailInvalidFormat;
        }

        return new EmailAddress(trimmed.ToLowerInvariant());
    }

    public string Domain
    {
        get
        {
            var at = Value.IndexOf('@');
            return Value[(at + 1)..];
        }
    }

    public override string ToString() => Value;
}
