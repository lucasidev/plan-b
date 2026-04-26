namespace Planb.Identity.Domain.Users;

/// <summary>
/// Purpose of a <see cref="VerificationToken"/>. Per ADR-0033 tokens live as child entity
/// of <see cref="User"/> parameterized by purpose. The aggregate enforces "one active token
/// per purpose" — issuing a new token of an existing purpose invalidates the previous one.
/// </summary>
public enum TokenPurpose
{
    UserEmailVerification,
    TeacherInstitutionalVerification,
    PasswordReset,
}
