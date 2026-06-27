using Planb.Identity.Domain.TeacherProfiles;
using Planb.Identity.Domain.TeacherProfiles.Events;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.TeacherProfiles;

/// <summary>
/// Domain unit tests del aggregate <see cref="TeacherProfile"/> (US-030). El claim nace pending y
/// solo se vuelve verified por los flows de US-031 / UC-066 (no cubiertos acá).
/// </summary>
public class TeacherProfileTests
{
    private static readonly DateTimeOffset T0 = new(2026, 6, 27, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void InitiateClaim_creates_a_pending_profile()
    {
        var userId = UserId.New();
        var teacherId = Guid.NewGuid();

        var profile = TeacherProfile.InitiateClaim(userId, teacherId, new FixedClock(T0));

        profile.UserId.ShouldBe(userId);
        profile.TeacherId.ShouldBe(teacherId);
        profile.VerifiedAt.ShouldBeNull();
        profile.IsVerified.ShouldBeFalse();
        profile.CreatedAt.ShouldBe(T0);
        profile.UpdatedAt.ShouldBe(T0);
        profile.Id.Value.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public void InitiateClaim_raises_claim_initiated_event()
    {
        var userId = UserId.New();
        var teacherId = Guid.NewGuid();

        var profile = TeacherProfile.InitiateClaim(userId, teacherId, new FixedClock(T0));

        var evt = profile.DomainEvents.ShouldHaveSingleItem()
            .ShouldBeOfType<TeacherProfileClaimInitiatedDomainEvent>();
        evt.TeacherProfileId.ShouldBe(profile.Id);
        evt.UserId.ShouldBe(userId);
        evt.TeacherId.ShouldBe(teacherId);
        evt.OccurredAt.ShouldBe(T0);
    }

    [Fact]
    public void Hydrate_roundtrips_a_verified_profile_without_raising_events()
    {
        var id = TeacherProfileId.New();
        var userId = UserId.New();
        var teacherId = Guid.NewGuid();
        var verifiedAt = T0.AddDays(1);

        var profile = TeacherProfile.Hydrate(
            id,
            userId,
            teacherId,
            "docente@unsta.edu.ar",
            TeacherVerificationMethod.InstitutionalEmail,
            verifiedAt,
            T0,
            verifiedAt);

        profile.Id.ShouldBe(id);
        profile.UserId.ShouldBe(userId);
        profile.TeacherId.ShouldBe(teacherId);
        profile.InstitutionalEmail.ShouldBe("docente@unsta.edu.ar");
        profile.VerificationMethod.ShouldBe(TeacherVerificationMethod.InstitutionalEmail);
        profile.VerifiedAt.ShouldBe(verifiedAt);
        profile.IsVerified.ShouldBeTrue();
        profile.DomainEvents.ShouldBeEmpty();
    }
}
