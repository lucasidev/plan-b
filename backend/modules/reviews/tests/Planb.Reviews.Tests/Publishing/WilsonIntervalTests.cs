using Planb.Reviews.Domain.Publishing;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Publishing;

/// <summary>
/// Domain unit tests de <see cref="WilsonInterval"/> (ADR-0083): el intervalo de confianza al 95 %
/// que decide si un contraste entre dos grupos se publica o se calla. Cubre
/// <see cref="WilsonInterval.For"/> (entradas inválidas, límites en [0, 1], por qué hace falta
/// Wilson y no la proporción cruda, y cómo se angosta con más voces) y
/// <see cref="WilsonInterval.Separated"/> (la regla de publicación de todo contraste).
/// </summary>
public class WilsonIntervalTests
{
    // -------------------------------------------------------------------
    // For
    // -------------------------------------------------------------------

    [Theory]
    [InlineData(0, 0)]    // sin respuestas: no hay proporción que estimar
    [InlineData(0, -5)]   // total negativo
    [InlineData(-1, 10)]  // successes negativo
    [InlineData(11, 10)]  // successes mayor al total
    public void For_InvalidInputs_ReturnsNull(int successes, int total)
    {
        var interval = WilsonInterval.For(successes, total);

        interval.ShouldBeNull();
    }

    [Theory]
    [InlineData(0, 10)]   // ninguno de diez
    [InlineData(10, 10)]  // todos de diez
    public void For_ExtremeProportions_StaysWithinZeroToOne(int successes, int total)
    {
        var interval = WilsonInterval.For(successes, total)!.Value;

        interval.Lower.ShouldBeGreaterThanOrEqualTo(0d);
        interval.Upper.ShouldBeLessThanOrEqualTo(1d);
    }

    /// <summary>
    /// El caso que justifica usar Wilson en vez de la proporción cruda: con 4 de 4 la proporción da
    /// exactamente 1, pero afirmar el intervalo [1, 1] sería decir que cualquier cátedra con 4
    /// reseñas es unánime para siempre. Wilson tira el piso del intervalo bien por debajo de 1
    /// (aprox 0,51).
    /// </summary>
    [Fact]
    public void For_FourOfFourSuccesses_LowerIsClearlyBelowOne()
    {
        var interval = WilsonInterval.For(4, 4)!.Value;

        interval.Proportion.ShouldBe(1d);
        interval.Lower.ShouldBeLessThan(0.6d);
    }

    /// <summary>Con la misma proporción, más voces angostan el intervalo: es la señal de más certeza.</summary>
    [Fact]
    public void For_MoreVoicesAtTheSameProportion_NarrowsTheInterval()
    {
        var fewVoices = WilsonInterval.For(6, 10)!.Value;
        var manyVoices = WilsonInterval.For(60, 100)!.Value;

        var fewVoicesWidth = fewVoices.Upper - fewVoices.Lower;
        var manyVoicesWidth = manyVoices.Upper - manyVoices.Lower;

        manyVoicesWidth.ShouldBeLessThan(fewVoicesWidth);
    }

    // -------------------------------------------------------------------
    // Separated
    // -------------------------------------------------------------------

    [Fact]
    public void Separated_EitherIntervalIsNull_ReturnsFalse()
    {
        var interval = WilsonInterval.For(5, 10);

        WilsonInterval.Separated(null, interval).ShouldBeFalse();
        WilsonInterval.Separated(interval, null).ShouldBeFalse();
        WilsonInterval.Separated(null, null).ShouldBeFalse();
    }

    [Fact]
    public void Separated_IntervalsOverlap_ReturnsFalse()
    {
        var a = WilsonInterval.For(5, 10);
        var b = WilsonInterval.For(6, 10);

        WilsonInterval.Separated(a, b).ShouldBeFalse();
    }

    [Fact]
    public void Separated_IntervalsDoNotTouch_ReturnsTrue()
    {
        var a = WilsonInterval.For(20, 100);
        var b = WilsonInterval.For(80, 100);

        WilsonInterval.Separated(a, b).ShouldBeTrue();
    }

    /// <summary>
    /// El corazón de la regla: 75 % contra 25 % es una diferencia enorme, pero con solo 4 voces de
    /// cada lado el intervalo es tan ancho que se solapan. Con pocas voces no se afirma nada.
    /// </summary>
    [Fact]
    public void Separated_SmallSamplesWithVeryDifferentProportions_ReturnsFalse()
    {
        var a = WilsonInterval.For(3, 4); // 75 %
        var b = WilsonInterval.For(1, 4); // 25 %

        WilsonInterval.Separated(a, b).ShouldBeFalse();
    }
}
