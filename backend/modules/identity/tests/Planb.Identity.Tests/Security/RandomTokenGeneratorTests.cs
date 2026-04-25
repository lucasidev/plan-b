using Planb.Identity.Infrastructure.Security;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Security;

public class RandomTokenGeneratorTests
{
    private readonly RandomTokenGenerator _generator = new();

    [Fact]
    public void Generate_default_length_returns_url_safe_string_long_enough()
    {
        var token = _generator.Generate();

        // Base64Url of 32 bytes = 43 chars (256 bits, no padding).
        token.Length.ShouldBe(43);
        token.ShouldMatch("^[A-Za-z0-9_-]+$");
    }

    [Fact]
    public void Generate_returns_distinct_values_across_calls()
    {
        var tokens = Enumerable.Range(0, 100).Select(_ => _generator.Generate()).ToHashSet();

        tokens.Count.ShouldBe(100);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Generate_rejects_non_positive_length(int byteLength)
    {
        Should.Throw<ArgumentOutOfRangeException>(() => _generator.Generate(byteLength));
    }
}
