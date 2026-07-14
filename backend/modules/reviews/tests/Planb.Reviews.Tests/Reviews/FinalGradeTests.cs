using Planb.Reviews.Domain.Reviews;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Reviews;

/// <summary>
/// Domain unit tests de <see cref="FinalGrade.Create"/>: cotas [0, 10] y el redondeo a dos
/// decimales con <see cref="MidpointRounding.AwayFromZero"/> (para alinear con la columna
/// <c>NUMERIC(4,2)</c> de Postgres).
/// </summary>
public class FinalGradeTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(5.5)]
    [InlineData(10)]
    public void Create_accepts_values_within_the_valid_range(decimal value)
    {
        var result = FinalGrade.Create(value);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Value.ShouldBe(value);
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(10.01)]
    [InlineData(99)]
    public void Create_rejects_values_outside_the_valid_range(decimal value)
    {
        var result = FinalGrade.Create(value);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.FinalGradeOutOfRange);
    }

    [Fact]
    public void Create_rounds_a_midpoint_away_from_zero()
    {
        // 7.855 -> 7.86: el tercer decimal es exactamente un empate (5), AwayFromZero redondea
        // hacia arriba (no trunca ni redondea al par).
        var result = FinalGrade.Create(7.855m);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Value.ShouldBe(7.86m);
    }

    [Fact]
    public void Create_rounds_away_from_zero_even_when_banker_rounding_would_round_down()
    {
        // 7.845: con MidpointRounding.ToEven (banker's) quedaría en 7.84 (4 es par). Con
        // AwayFromZero (el que usa FinalGrade) redondea hacia arriba, a 7.85.
        var result = FinalGrade.Create(7.845m);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Value.ShouldBe(7.85m);
    }

    [Fact]
    public void Create_rounds_a_non_midpoint_value_to_two_decimals()
    {
        var result = FinalGrade.Create(7.123m);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Value.ShouldBe(7.12m);
    }
}
