using Planb.Identity.Infrastructure.Security;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Security;

public class BCryptPasswordHasherTests
{
    private readonly BCryptPasswordHasher _hasher = new();

    [Fact]
    public void Hash_then_verify_with_same_password_returns_true()
    {
        var hash = _hasher.Hash("correctHorseBattery");

        _hasher.Verify("correctHorseBattery", hash).ShouldBeTrue();
    }

    [Fact]
    public void Verify_with_wrong_password_returns_false()
    {
        var hash = _hasher.Hash("correctHorseBattery");

        _hasher.Verify("wrong-password", hash).ShouldBeFalse();
    }

    [Fact]
    public void Hashing_same_password_twice_produces_different_hashes_due_to_salt()
    {
        var a = _hasher.Hash("samepassword");
        var b = _hasher.Hash("samepassword");

        a.ShouldNotBe(b);
        _hasher.Verify("samepassword", a).ShouldBeTrue();
        _hasher.Verify("samepassword", b).ShouldBeTrue();
    }

    [Fact]
    public void Verify_with_garbage_hash_returns_false_without_throwing()
    {
        _hasher.Verify("anything", "not-a-valid-bcrypt-hash").ShouldBeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Hash_rejects_blank_password(string? password)
    {
        Should.Throw<ArgumentException>(() => _hasher.Hash(password!));
    }
}
