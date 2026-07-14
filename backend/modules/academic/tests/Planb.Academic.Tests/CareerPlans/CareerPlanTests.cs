using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.CareerPlans;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.CareerPlans;

public class CareerPlanTests
{
    private static readonly CareerId AnyCareer = CareerId.New();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    [Fact]
    public void Create_HappyPath_ReturnsActivePlanWithGivenYear()
    {
        var result = CareerPlan.Create(AnyCareer, 2024, Clock);

        result.IsSuccess.ShouldBeTrue();
        var plan = result.Value;
        plan.CareerId.ShouldBe(AnyCareer);
        plan.Year.ShouldBe(2024);
        plan.Status.ShouldBe(CareerPlanStatus.Active);
        plan.IsOfficial.ShouldBeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Create_YearNotPositive_ReturnsYearOutOfRange(int year)
    {
        var result = CareerPlan.Create(AnyCareer, year, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanErrors.YearOutOfRange);
    }

    [Fact]
    public void Create_YearAfterCurrentYear_ReturnsYearOutOfRange()
    {
        var result = CareerPlan.Create(AnyCareer, Clock.UtcNow.Year + 1, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanErrors.YearOutOfRange);
    }

    [Fact]
    public void MarkOfficial_WhenNotOfficial_PromotesToOfficial()
    {
        var plan = CareerPlan.Create(AnyCareer, 2024, Clock, isOfficial: false).Value;

        plan.MarkOfficial();

        plan.IsOfficial.ShouldBeTrue();
    }

    [Fact]
    public void MarkOfficial_WhenAlreadyOfficial_IsIdempotent()
    {
        var plan = CareerPlan.Create(AnyCareer, 2024, Clock, isOfficial: true).Value;

        plan.MarkOfficial();

        plan.IsOfficial.ShouldBeTrue();
    }
}
