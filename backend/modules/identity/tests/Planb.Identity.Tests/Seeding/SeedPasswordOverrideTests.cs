using Planb.Identity.Application.Seeding;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Seeding;

public class SeedPasswordOverrideTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Resolve_undefined_or_empty_returns_no_override(string? environmentValue)
    {
        var result = SeedPasswordOverride.Resolve(environmentValue);

        result.Value.ShouldBeNull();
    }

    [Theory]
    [InlineData("123456789012")] // exactamente 12: el mínimo, no tiene que fallar
    [InlineData("stage-personas-16ch")]
    public void Resolve_defined_with_12_or_more_chars_returns_that_value(string environmentValue)
    {
        var result = SeedPasswordOverride.Resolve(environmentValue);

        result.Value.ShouldBe(environmentValue);
    }

    [Theory]
    [InlineData("short")]
    [InlineData("eleven-char")] // 11 caracteres: justo debajo del mínimo
    public void Resolve_defined_with_fewer_than_12_chars_throws_naming_the_variable(
        string environmentValue)
    {
        var ex = Should.Throw<InvalidOperationException>(
            () => SeedPasswordOverride.Resolve(environmentValue));

        ex.Message.ShouldContain(SeedPasswordOverride.EnvironmentVariableName);
    }
}
