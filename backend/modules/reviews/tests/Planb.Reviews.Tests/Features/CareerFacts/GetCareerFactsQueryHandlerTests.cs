using NSubstitute;
using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.CareerFacts;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Features.CareerFacts;

/// <summary>
/// Handler unit tests de <see cref="GetCareerFactsQueryHandler"/> (US-134). Cubre lo que el
/// handler decide por sí mismo (el 404 cuando la carrera no existe, el cálculo del porcentaje de
/// cobertura sin dividir por cero) sin levantar base: identidad y cobertura llegan mockeadas.
/// </summary>
public class GetCareerFactsQueryHandlerTests
{
    private sealed record Deps(IAcademicQueryService Academic, ICareerCoverageQueryService Coverage);

    private static Deps NewDeps() =>
        new(Substitute.For<IAcademicQueryService>(), Substitute.For<ICareerCoverageQueryService>());

    private static Task<Result<GetCareerFactsResponse>> Invoke(Deps deps, Guid careerId) =>
        GetCareerFactsQueryHandler.Handle(
            new GetCareerFactsQuery(careerId), deps.Academic, deps.Coverage, CancellationToken.None);

    private static CareerDetailItem Career(Guid id, int? durationYears = null) =>
        new(id, "Tecnicatura Universitaria en Desarrollo y Calidad de Software", durationYears,
            "Universidad del Norte Santo Tomás de Aquino");

    [Fact]
    public async Task Handle_CareerDoesNotExist_ReturnsNotFoundWithoutQueryingCoverage()
    {
        var deps = NewDeps();
        var careerId = Guid.NewGuid();
        deps.Academic.GetCareerByIdAsync(careerId, Arg.Any<CancellationToken>())
            .Returns((CareerDetailItem?)null);

        var result = await Invoke(deps, careerId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerFactsErrors.CareerNotFound);
        await deps.Coverage.DidNotReceive().GetCoverageAsync(
            Arg.Any<Guid>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CareerExists_ReturnsIdentityAndCoverage()
    {
        var deps = NewDeps();
        var careerId = Guid.NewGuid();
        deps.Academic.GetCareerByIdAsync(careerId, Arg.Any<CancellationToken>())
            .Returns(Career(careerId, durationYears: 3));
        deps.Coverage.GetCoverageAsync(careerId, PublishingRules.ChairMinimumReviews, Arg.Any<CancellationToken>())
            .Returns(new CareerCoverage(TotalSubjects: 21, CoveredSubjects: 1));

        var result = await Invoke(deps, careerId);

        result.IsSuccess.ShouldBeTrue();
        var facts = result.Value;
        facts.CareerId.ShouldBe(careerId);
        facts.CareerName.ShouldBe("Tecnicatura Universitaria en Desarrollo y Calidad de Software");
        facts.UniversityName.ShouldBe("Universidad del Norte Santo Tomás de Aquino");
        facts.DurationYears.ShouldBe(3);
        facts.TotalSubjects.ShouldBe(21);
        facts.CoveredSubjects.ShouldBe(1);
        // 1/21 = 4,76...%, redondeado hacia arriba (AwayFromZero) da 5.
        facts.CoveragePercent.ShouldBe(5);
    }

    [Fact]
    public async Task Handle_DurationYearsNotSet_ReturnsNullWithoutInventingAValue()
    {
        var deps = NewDeps();
        var careerId = Guid.NewGuid();
        deps.Academic.GetCareerByIdAsync(careerId, Arg.Any<CancellationToken>())
            .Returns(Career(careerId, durationYears: null));
        deps.Coverage.GetCoverageAsync(careerId, PublishingRules.ChairMinimumReviews, Arg.Any<CancellationToken>())
            .Returns(new CareerCoverage(TotalSubjects: 0, CoveredSubjects: 0));

        var result = await Invoke(deps, careerId);

        result.IsSuccess.ShouldBeTrue();
        result.Value.DurationYears.ShouldBeNull();
    }

    [Fact]
    public async Task Handle_NoSubjectsInThePlan_ReturnsZeroPercentWithoutDividingByZero()
    {
        var deps = NewDeps();
        var careerId = Guid.NewGuid();
        deps.Academic.GetCareerByIdAsync(careerId, Arg.Any<CancellationToken>())
            .Returns(Career(careerId));
        deps.Coverage.GetCoverageAsync(careerId, PublishingRules.ChairMinimumReviews, Arg.Any<CancellationToken>())
            .Returns(new CareerCoverage(TotalSubjects: 0, CoveredSubjects: 0));

        var result = await Invoke(deps, careerId);

        result.IsSuccess.ShouldBeTrue();
        result.Value.CoveragePercent.ShouldBe(0);
    }
}
