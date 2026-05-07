using Planb.Identity.Domain.Users;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Users;

/// <summary>
/// Domain unit tests for <see cref="UserDeletionLog"/>. Focus on the immutable contract: the
/// log carries a hashed email (never plain), and the hash is stable across casing variants of
/// the same address.
/// </summary>
public class UserDeletionLogTests
{
    private static readonly DateTimeOffset DeletedAt = new(2026, 5, 7, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw) => EmailAddress.Create(raw).Value;

    [Fact]
    public void Create_stores_hashed_email_not_plain()
    {
        var userId = UserId.New();
        var email = Email("lucia@unsta.edu.ar");

        var log = UserDeletionLog.Create(userId, email, DeletedAt);

        log.UserId.ShouldBe(userId);
        log.DeletedAt.ShouldBe(DeletedAt);
        log.EmailHash.ShouldNotContain("lucia");
        log.EmailHash.ShouldNotContain("unsta");
        log.EmailHash.Length.ShouldBe(64); // SHA-256 hex
    }

    [Fact]
    public void HashEmail_is_case_insensitive()
    {
        // EmailAddress.Create normalizes lowercase already, but we re-normalize defensively in
        // the hasher. This test guarantees that contract holds even if the VO stops normalizing
        // for some reason.
        var lower = Email("lucia@unsta.edu.ar");
        var hash = UserDeletionLog.HashEmail(lower);

        hash.ShouldBe(UserDeletionLog.HashEmail(Email("LUCIA@UNSTA.EDU.AR")));
        hash.ShouldBe(UserDeletionLog.HashEmail(Email("Lucia@Unsta.Edu.Ar")));
    }

    [Fact]
    public void HashEmail_is_deterministic()
    {
        var email = Email("mateo@gmail.com");
        UserDeletionLog.HashEmail(email).ShouldBe(UserDeletionLog.HashEmail(email));
    }

    [Fact]
    public void HashEmail_differs_for_different_emails()
    {
        UserDeletionLog.HashEmail(Email("a@a.com"))
            .ShouldNotBe(UserDeletionLog.HashEmail(Email("b@b.com")));
    }

    [Fact]
    public void Create_assigns_a_new_id_each_time()
    {
        var userId = UserId.New();
        var email = Email("lucia@unsta.edu.ar");

        var log1 = UserDeletionLog.Create(userId, email, DeletedAt);
        var log2 = UserDeletionLog.Create(userId, email, DeletedAt);

        log1.Id.ShouldNotBe(log2.Id);
    }
}
