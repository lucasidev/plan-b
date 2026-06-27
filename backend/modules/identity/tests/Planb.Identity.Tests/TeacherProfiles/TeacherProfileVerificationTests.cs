using Planb.Identity.Domain.TeacherProfiles;
using Planb.Identity.Domain.TeacherProfiles.Events;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.TeacherProfiles;

/// <summary>
/// Domain unit tests del flow de verificación institucional del aggregate <see cref="TeacherProfile"/>
/// (US-031): submit del email institucional (valida dominio + emite token) y verify (consume token).
/// </summary>
public class TeacherProfileVerificationTests
{
    private static readonly DateTimeOffset T0 = new(2026, 6, 27, 12, 0, 0, TimeSpan.Zero);
    private static readonly IReadOnlyList<string> UnstaDomains = new[] { "unsta.edu.ar" };

    private static TeacherProfile PendingProfile()
    {
        var profile = TeacherProfile.InitiateClaim(UserId.New(), Guid.NewGuid(), new FixedClock(T0));
        profile.ClearDomainEvents();
        return profile;
    }

    [Fact]
    public void SubmitInstitutionalEmail_with_allowed_domain_sets_email_and_issues_token()
    {
        var profile = PendingProfile();

        var result = profile.SubmitInstitutionalEmail(
            "Ana.Brandt@UNSTA.edu.ar", UnstaDomains, "raw-tok", TimeSpan.FromHours(24), new FixedClock(T0));

        result.IsSuccess.ShouldBeTrue();
        profile.InstitutionalEmail.ShouldBe("ana.brandt@unsta.edu.ar"); // normalizado lowercase
        profile.VerificationMethod.ShouldBe(TeacherVerificationMethod.InstitutionalEmail);
        profile.IsVerified.ShouldBeFalse();
        var token = profile.Tokens.ShouldHaveSingleItem();
        token.Token.ShouldBe("raw-tok");
        token.Purpose.ShouldBe(TokenPurpose.TeacherInstitutionalVerification);
        token.IsActive.ShouldBeTrue();
        profile.DomainEvents.ShouldContain(e => e is TeacherProfileInstitutionalEmailSubmittedDomainEvent);
    }

    [Fact]
    public void SubmitInstitutionalEmail_rejects_domain_not_in_university()
    {
        var profile = PendingProfile();

        var result = profile.SubmitInstitutionalEmail(
            "ana@gmail.com", UnstaDomains, "raw-tok", TimeSpan.FromHours(24), new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherProfileErrors.InstitutionalEmailDomainNotAllowed);
        profile.InstitutionalEmail.ShouldBeNull();
        profile.Tokens.ShouldBeEmpty();
    }

    [Fact]
    public void SubmitInstitutionalEmail_invalidates_previous_active_token()
    {
        var profile = PendingProfile();

        profile.SubmitInstitutionalEmail(
            "ana@unsta.edu.ar", UnstaDomains, "tok-1", TimeSpan.FromHours(24), new FixedClock(T0));
        profile.SubmitInstitutionalEmail(
            "ana@unsta.edu.ar", UnstaDomains, "tok-2", TimeSpan.FromHours(24), new FixedClock(T0));

        profile.Tokens.Count.ShouldBe(2);
        profile.Tokens.Single(t => t.Token == "tok-1").IsInvalidated.ShouldBeTrue();
        profile.Tokens.Single(t => t.Token == "tok-2").IsActive.ShouldBeTrue();
    }

    [Fact]
    public void VerifyByInstitutionalEmail_with_valid_token_marks_verified()
    {
        var profile = PendingProfile();
        profile.SubmitInstitutionalEmail(
            "ana@unsta.edu.ar", UnstaDomains, "raw-tok", TimeSpan.FromHours(24), new FixedClock(T0));
        profile.ClearDomainEvents();

        var verifyAt = T0.AddMinutes(5);
        var result = profile.VerifyByInstitutionalEmail("raw-tok", new FixedClock(verifyAt));

        result.IsSuccess.ShouldBeTrue();
        profile.IsVerified.ShouldBeTrue();
        profile.VerifiedAt.ShouldBe(verifyAt);
        profile.Tokens.Single().IsConsumed.ShouldBeTrue();
        profile.DomainEvents.ShouldContain(e => e is TeacherProfileVerifiedDomainEvent);
    }

    [Fact]
    public void VerifyByInstitutionalEmail_rejects_unknown_token()
    {
        var profile = PendingProfile();
        profile.SubmitInstitutionalEmail(
            "ana@unsta.edu.ar", UnstaDomains, "raw-tok", TimeSpan.FromHours(24), new FixedClock(T0));

        var result = profile.VerifyByInstitutionalEmail("wrong-tok", new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherProfileErrors.VerificationTokenInvalid);
        profile.IsVerified.ShouldBeFalse();
    }

    [Fact]
    public void VerifyByInstitutionalEmail_rejects_expired_token()
    {
        var profile = PendingProfile();
        profile.SubmitInstitutionalEmail(
            "ana@unsta.edu.ar", UnstaDomains, "raw-tok", TimeSpan.FromHours(1), new FixedClock(T0));

        var result = profile.VerifyByInstitutionalEmail("raw-tok", new FixedClock(T0.AddHours(2)));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherProfileErrors.VerificationTokenExpired);
        profile.IsVerified.ShouldBeFalse();
    }

    [Fact]
    public void SubmitInstitutionalEmail_rejects_when_already_verified()
    {
        var profile = PendingProfile();
        profile.SubmitInstitutionalEmail(
            "ana@unsta.edu.ar", UnstaDomains, "raw-tok", TimeSpan.FromHours(24), new FixedClock(T0));
        profile.VerifyByInstitutionalEmail("raw-tok", new FixedClock(T0.AddMinutes(5)));

        var result = profile.SubmitInstitutionalEmail(
            "otra@unsta.edu.ar", UnstaDomains, "tok-2", TimeSpan.FromHours(24), new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherProfileErrors.AlreadyVerified);
    }

    [Fact]
    public void VerifyByInstitutionalEmail_is_idempotent_when_already_verified()
    {
        var profile = PendingProfile();
        profile.SubmitInstitutionalEmail(
            "ana@unsta.edu.ar", UnstaDomains, "raw-tok", TimeSpan.FromHours(24), new FixedClock(T0));
        profile.VerifyByInstitutionalEmail("raw-tok", new FixedClock(T0.AddMinutes(5)));

        // Segundo verify (doble click del link): no falla, no re-stampea.
        var result = profile.VerifyByInstitutionalEmail("raw-tok", new FixedClock(T0.AddMinutes(10)));

        result.IsSuccess.ShouldBeTrue();
        profile.VerifiedAt.ShouldBe(T0.AddMinutes(5));
    }
}
