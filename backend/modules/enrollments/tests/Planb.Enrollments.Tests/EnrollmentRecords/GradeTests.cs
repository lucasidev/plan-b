using Planb.Enrollments.Domain.EnrollmentRecords;
using Shouldly;
using Xunit;

namespace Planb.Enrollments.Tests.EnrollmentRecords;

public class GradeTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(5.5)]
    [InlineData(10)]
    public void Ctor_DentroDeRango_Acepta(decimal value)
    {
        var grade = new Grade(value);
        grade.Value.ShouldBe(value);
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(10.01)]
    [InlineData(99)]
    public void Ctor_FueraDeRango_Throws(decimal value)
    {
        Should.Throw<ArgumentOutOfRangeException>(() => new Grade(value));
    }

    [Fact]
    public void Ctor_RedondeaA2Decimales()
    {
        // 7.123 → 7.12 (HalfAwayFromZero, lo cual matchea NUMERIC(4,2) en Postgres).
        var grade = new Grade(7.123m);
        grade.Value.ShouldBe(7.12m);
    }

    [Fact]
    public void Ctor_RedondeaHaciaArriba()
    {
        var grade = new Grade(7.125m);
        grade.Value.ShouldBe(7.13m); // .5 round away from zero
    }

    [Fact]
    public void ToString_Formatea()
    {
        new Grade(8m).ToString().ShouldBe("8");
        new Grade(7.5m).ToString().ShouldBe("7.5");
    }
}
