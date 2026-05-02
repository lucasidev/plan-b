using Planb.Identity.Domain.Users.Events;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Aggregate root for an authenticated account. See ADR-0008 for role semantics.
/// The aggregate treats <see cref="PasswordHash"/> as an opaque string — the hashing algorithm
/// lives in the infrastructure layer (see the PasswordHasher port). Per ADR-0033 verification
/// tokens are child entities of this aggregate, not a separate aggregate.
/// </summary>
public sealed class User : Entity<UserId>, IAggregateRoot
{
    public EmailAddress Email { get; private set; }
    public string PasswordHash { get; private set; } = null!;
    public DateTimeOffset? EmailVerifiedAt { get; private set; }
    public UserRole Role { get; private set; }
    public DateTimeOffset? DisabledAt { get; private set; }
    public string? DisabledReason { get; private set; }
    public Guid? DisabledBy { get; private set; }
    public DateTimeOffset? ExpiredAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<VerificationToken> _tokens = new();
    public IReadOnlyCollection<VerificationToken> Tokens => _tokens.AsReadOnly();

    private readonly List<StudentProfile> _studentProfiles = new();
    public IReadOnlyCollection<StudentProfile> StudentProfiles => _studentProfiles.AsReadOnly();

    public bool IsEmailVerified => EmailVerifiedAt is not null;
    public bool IsDisabled => DisabledAt is not null;
    public bool IsExpired => ExpiredAt is not null;
    public bool IsActive => !IsDisabled && !IsExpired && IsEmailVerified;

    private User() { }

    /// <summary>
    /// Public self-registration (UC-010). Always creates a <see cref="UserRole.Member"/>
    /// with a pending-verification status (<see cref="EmailVerifiedAt"/> = null).
    /// Staff accounts (moderator / admin / university_staff) are created through a distinct
    /// factory because of ADR-0008 (staff cannot self-register).
    /// </summary>
    public static Result<User> Register(
        EmailAddress email,
        string passwordHash,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            return UserErrors.PasswordHashRequired;
        }

        var now = clock.UtcNow;
        var user = new User
        {
            Id = UserId.New(),
            Email = email,
            PasswordHash = passwordHash,
            Role = UserRole.Member,
            CreatedAt = now,
            UpdatedAt = now,
        };
        user.Raise(new UserRegisteredDomainEvent(user.Id, email, now));
        return user;
    }

    /// <summary>
    /// Issues a new <see cref="VerificationToken"/> for the given purpose. Any existing active
    /// token of the same purpose is invalidated (one active token per purpose, per ADR-0033).
    /// </summary>
    public Result<VerificationToken> IssueVerificationToken(
        TokenPurpose purpose,
        string token,
        TimeSpan ttl,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(token))
        {
            return UserErrors.VerificationTokenRequired;
        }

        if (ttl <= TimeSpan.Zero)
        {
            return UserErrors.VerificationTokenTtlMustBePositive;
        }

        var now = clock.UtcNow;

        foreach (var existing in _tokens.Where(t => t.Purpose == purpose && t.IsActive))
        {
            existing.Invalidate(now);
            Raise(new VerificationTokenInvalidatedDomainEvent(Id, existing.Id, purpose, now));
        }

        var newToken = new VerificationToken(
            Guid.NewGuid(), purpose, token, now, now.Add(ttl));
        _tokens.Add(newToken);
        UpdatedAt = now;
        Raise(new VerificationTokenIssuedDomainEvent(
            Id, newToken.Id, purpose, token, newToken.ExpiresAt, now));

        return newToken;
    }

    /// <summary>
    /// Consumes the verification token matching <paramref name="rawToken"/> for purpose
    /// <see cref="TokenPurpose.UserEmailVerification"/>, marks the email as verified and emits
    /// the corresponding domain event. Idempotent: re-verifying an already-verified user is a
    /// no-op when the token is missing or matches an already-consumed token of this user.
    /// </summary>
    public Result VerifyEmail(string rawToken, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return UserErrors.VerificationTokenRequired;
        }

        if (IsEmailVerified)
        {
            // Idempotent: don't fail double-clicks once the user is already verified.
            return Result.Success();
        }

        var token = _tokens.FirstOrDefault(
            t => t.Purpose == TokenPurpose.UserEmailVerification && t.Token == rawToken);

        if (token is null)
        {
            return UserErrors.VerificationTokenInvalid;
        }

        if (token.IsInvalidated)
        {
            return UserErrors.VerificationTokenInvalidated;
        }

        if (token.IsConsumed)
        {
            return UserErrors.VerificationTokenAlreadyConsumed;
        }

        var now = clock.UtcNow;
        if (token.IsExpired(now))
        {
            return UserErrors.VerificationTokenExpired;
        }

        token.Consume(now);
        EmailVerifiedAt = now;
        UpdatedAt = now;
        Raise(new UserEmailVerifiedDomainEvent(Id, now));
        return Result.Success();
    }

    /// <summary>
    /// Validates a sign-in attempt. Order matters for anti-enumeration: the password is
    /// checked first, so a wrong password always returns <see cref="UserErrors.InvalidCredentials"/>
    /// regardless of account state. Only when the password is correct does the response reveal
    /// whether the account is disabled or unverified — and at that point the caller already had
    /// the credentials, so leaking state is acceptable in exchange for a useful UX message.
    ///
    /// The hash verification is delegated to the caller via <paramref name="verifyHash"/> so the
    /// domain stays unaware of the hashing algorithm (lives in the infrastructure layer behind
    /// <c>IPasswordHasher</c>).
    /// </summary>
    public Result Authenticate(Func<string, bool> verifyHash, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(verifyHash);
        ArgumentNullException.ThrowIfNull(clock);

        if (!verifyHash(PasswordHash))
        {
            return UserErrors.InvalidCredentials;
        }

        if (IsDisabled)
        {
            return UserErrors.AccountDisabled;
        }

        if (!IsEmailVerified)
        {
            return UserErrors.EmailNotVerified;
        }

        Raise(new UserSignedInDomainEvent(Id, clock.UtcNow));
        return Result.Success();
    }

    /// <summary>
    /// Minimum length for a member-set password. Mirrors <c>RegisterUserValidator.MinPasswordLength</c>
    /// but lives on the aggregate so any path that accepts a password (register, reset) enforces it
    /// without going through a specific validator.
    /// </summary>
    public const int MinPasswordLength = 12;

    /// <summary>
    /// Issues a fresh password-reset token. Wraps <see cref="IssueVerificationToken"/> with
    /// <see cref="TokenPurpose.PasswordReset"/> and a 30-minute TTL (shorter than email
    /// verification because reset is more sensitive). Returns the token wrapped in a
    /// <see cref="Result{T}"/>; the caller emails the raw value to the user.
    ///
    /// Aggregate-level guarantees: any previously active password-reset token is invalidated
    /// (one active token per purpose, per ADR-0033). Disabled or unverified users still get a
    /// token issued at the aggregate level. The application handler is the one that decides
    /// whether to actually send the email (per anti-enumeration in US-033 AC).
    /// </summary>
    public Result<VerificationToken> RequestPasswordReset(
        string token, IDateTimeProvider clock) =>
        IssueVerificationToken(TokenPurpose.PasswordReset, token, TimeSpan.FromMinutes(30), clock);

    /// <summary>
    /// Issues a fresh email-verification token (US-021 resend flow). Wraps
    /// <see cref="IssueVerificationToken"/> with <see cref="TokenPurpose.UserEmailVerification"/>
    /// and a 24h TTL (same as the original token emitido en Register). Returns the token wrapped
    /// in a <see cref="Result{T}"/>; the caller emails the raw value to the user.
    ///
    /// Aggregate-level guarantees: cualquier token de email-verification activo previo se
    /// invalida (one-active-per-purpose, ADR-0033). Already-verified or disabled users still
    /// get a token issued at the aggregate level — the application handler is the one que decide
    /// whether to actually send the email (per anti-enumeration en US-021 AC).
    /// </summary>
    public Result<VerificationToken> RequestVerificationResend(
        string token, IDateTimeProvider clock) =>
        IssueVerificationToken(TokenPurpose.UserEmailVerification, token, TimeSpan.FromHours(24), clock);

    /// <summary>
    /// Consumes a password-reset token and replaces the password hash. Per US-033 AC the failure
    /// modes are explicit and order-sensitive:
    /// <list type="bullet">
    ///   <item>Token not found at all on this user → <see cref="UserErrors.VerificationTokenInvalid"/> (404).</item>
    ///   <item>Token belongs to this user but a different purpose → <see cref="UserErrors.VerificationWrongPurpose"/> (409).</item>
    ///   <item>Token already invalidated / consumed / expired → matching error (409).</item>
    ///   <item>Account disabled or unverified → matching error (409). Token isn't consumed in those branches.</item>
    ///   <item>New password under <see cref="MinPasswordLength"/> → <see cref="UserErrors.PasswordTooWeak"/> (400).</item>
    /// </list>
    /// On success: the token is consumed, the hash is replaced, <see cref="UpdatedAt"/> moves
    /// forward, and a <see cref="PasswordResetCompletedDomainEvent"/> is raised. Refresh-token
    /// revocation is *not* the aggregate's job; the handler does that against the Redis store.
    /// </summary>
    public Result ResetPassword(
        string rawToken,
        string newPlainPassword,
        Func<string, string> hashPassword,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(hashPassword);
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return UserErrors.VerificationTokenRequired;
        }

        var token = _tokens.FirstOrDefault(t => t.Token == rawToken);
        if (token is null)
        {
            return UserErrors.VerificationTokenInvalid;
        }

        if (token.Purpose != TokenPurpose.PasswordReset)
        {
            return UserErrors.VerificationWrongPurpose;
        }

        if (token.IsInvalidated)
        {
            return UserErrors.VerificationTokenInvalidated;
        }

        if (token.IsConsumed)
        {
            return UserErrors.VerificationTokenAlreadyConsumed;
        }

        var now = clock.UtcNow;
        if (token.IsExpired(now))
        {
            return UserErrors.VerificationTokenExpired;
        }

        if (IsDisabled)
        {
            return UserErrors.AccountDisabled;
        }

        if (!IsEmailVerified)
        {
            return UserErrors.EmailNotVerified;
        }

        if (string.IsNullOrEmpty(newPlainPassword) || newPlainPassword.Length < MinPasswordLength)
        {
            return UserErrors.PasswordTooWeak;
        }

        token.Consume(now);
        PasswordHash = hashPassword(newPlainPassword);
        UpdatedAt = now;
        Raise(new PasswordResetCompletedDomainEvent(Id, now));
        return Result.Success();
    }

    public Result Disable(Guid disabledBy, string reason, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(reason))
        {
            return UserErrors.DisableReasonRequired;
        }

        if (IsDisabled)
        {
            return UserErrors.AlreadyDisabled;
        }

        var now = clock.UtcNow;
        DisabledAt = now;
        DisabledReason = reason;
        DisabledBy = disabledBy;
        UpdatedAt = now;
        Raise(new UserDisabledDomainEvent(Id, disabledBy, reason, now));
        return Result.Success();
    }

    public Result Restore(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsDisabled)
        {
            return UserErrors.NotDisabled;
        }

        var now = clock.UtcNow;
        DisabledAt = null;
        DisabledReason = null;
        DisabledBy = null;
        UpdatedAt = now;
        Raise(new UserRestoredDomainEvent(Id, now));
        return Result.Success();
    }

    /// <summary>
    /// Marks an unverified registration as expired (US-022). El registro queda en la DB para
    /// trazabilidad (no se hard-delete) pero se trata como inexistente para el flow de sign-in
    /// (el handler convierte el check a <see cref="UserErrors.InvalidCredentials"/> per anti-enum).
    ///
    /// Precondiciones: <see cref="IsEmailVerified"/> false (un user verificado no expira nunca)
    /// y <see cref="IsExpired"/> false (idempotencia explícita: si ya está expirado, no se vuelve
    /// a expirar). Si el user está disabled, también se rechaza porque disabled es estado terminal
    /// y mezclar las dos transiciones perdería el reason original.
    ///
    /// Side effects:
    /// <list type="bullet">
    ///   <item>Setea <see cref="ExpiredAt"/> al now del clock.</item>
    ///   <item>Invalida cualquier token activo (no tiene sentido un verification token vivo en un
    ///         registro expirado; si después se re-registra el mismo email, el partial unique
    ///         index permite el INSERT y un token nuevo se emite desde Register).</item>
    ///   <item>Levanta <see cref="UnverifiedRegistrationExpiredDomainEvent"/>.</item>
    /// </list>
    /// </summary>
    public Result ExpireRegistration(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (IsEmailVerified || IsExpired || IsDisabled)
        {
            return UserErrors.NotEligibleForExpiration;
        }

        var now = clock.UtcNow;
        ExpiredAt = now;

        foreach (var token in _tokens.Where(t => t.IsActive))
        {
            token.Invalidate(now);
            Raise(new VerificationTokenInvalidatedDomainEvent(Id, token.Id, token.Purpose, now));
        }

        UpdatedAt = now;
        Raise(new UnverifiedRegistrationExpiredDomainEvent(Id, Email, now));
        return Result.Success();
    }

    /// <summary>
    /// Año mínimo de inscripción aceptado en US-012. La universidad puede no haber existido en la
    /// plataforma antes de 2010. Cualquier valor menor se rechaza para evitar tipos de inputs
    /// degenerados desde forms abiertos al member.
    /// </summary>
    public const int MinEnrollmentYear = 2010;

    /// <summary>
    /// Crea un <see cref="StudentProfile"/> activo asociando al user con un CareerPlan + año de
    /// ingreso (US-012). Aggregate-level invariants:
    /// <list type="bullet">
    ///   <item>El user debe estar verificado y no disabled / expired (un member sin verificar
    ///         no debería poder crear profiles aún).</item>
    ///   <item>Solo users con <see cref="UserRole.Member"/> tienen profiles. Staff
    ///         (moderator/admin/university_staff) no aplican (ADR-0008).</item>
    ///   <item>El año debe estar en [<see cref="MinEnrollmentYear"/>, año actual del clock].</item>
    ///   <item>No puede haber dos StudentProfiles activos del mismo user para la misma carrera.
    ///         Un mismo user sí puede tener profiles activos en carreras distintas (ej. doble
    ///         titulación).</item>
    /// </list>
    /// El handler valida ANTES que el <paramref name="careerPlanId"/> exista en Academic via
    /// <c>IAcademicQueryService</c> (ADR-0017: no FK cross-schema). El <paramref name="careerId"/>
    /// se denormaliza acá desde el plan para que el constraint UNIQUE(user_id, career_id) sea
    /// evaluable en DB sin JOIN cross-schema.
    /// </summary>
    public Result<StudentProfile> AddStudentProfile(
        Guid careerPlanId,
        Guid careerId,
        int enrollmentYear,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsEmailVerified)
        {
            return UserErrors.EmailNotVerified;
        }

        if (IsDisabled)
        {
            return UserErrors.AccountDisabled;
        }

        if (Role != UserRole.Member)
        {
            return UserErrors.OnlyMembersCanHaveProfiles;
        }

        var now = clock.UtcNow;
        if (enrollmentYear < MinEnrollmentYear || enrollmentYear > now.Year)
        {
            return UserErrors.EnrollmentYearOutOfRange;
        }

        var hasActiveForCareer = _studentProfiles.Any(sp =>
            sp.CareerId == careerId && sp.IsActive);
        if (hasActiveForCareer)
        {
            return UserErrors.DuplicateStudentProfile;
        }

        var profile = new StudentProfile(
            StudentProfileId.New(),
            careerPlanId,
            careerId,
            enrollmentYear,
            now);
        _studentProfiles.Add(profile);
        UpdatedAt = now;

        Raise(new StudentProfileCreatedDomainEvent(
            Id, profile.Id, careerPlanId, careerId, enrollmentYear, now));

        return profile;
    }
}
