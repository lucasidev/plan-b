using NSubstitute;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Features.AdminCareerPlans;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Features.AdminCareerPlans;

/// <summary>
/// Handler unit tests de <see cref="CreateCareerPlanCommandHandler"/> (US-061). Cubre el
/// parent-existence (la Career debe existir, ADR-0017) y la unicidad de year por carrera.
/// </summary>
public class CreateCareerPlanCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 1, 12, 0, 0, TimeSpan.Zero);

    private sealed record Deps(
        ICareerPlanRepository Plans,
        ICareerRepository Careers,
        IAcademicUnitOfWork UnitOfWork,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<ICareerPlanRepository>(),
        Substitute.For<ICareerRepository>(),
        Substitute.For<IAcademicUnitOfWork>(),
        new FixedClock(T0));

    private static Task<Result<CreateCareerPlanResponse>> Invoke(
        Deps deps, CreateCareerPlanCommand command) =>
        CreateCareerPlanCommandHandler.Handle(
            command, deps.Plans, deps.Careers, deps.UnitOfWork, deps.Clock, CancellationToken.None);

    private static Career AnyCareer(FixedClock clock) =>
        Career.Create(UniversityId.New(), "Carrera", "carrera", clock).Value;

    [Fact]
    public async Task Handle_HappyPath_CreatesPlanAndSaves()
    {
        var deps = NewDeps();
        var career = AnyCareer(deps.Clock);
        deps.Careers.FindByIdAsync(career.Id, Arg.Any<CancellationToken>()).Returns(career);
        deps.Plans.FindByCareerAndYearAsync(career.Id, 2024, Arg.Any<CancellationToken>())
            .Returns((CareerPlan?)null);

        var result = await Invoke(deps, new CreateCareerPlanCommand(career.Id.Value, 2024));

        result.IsSuccess.ShouldBeTrue();
        await deps.Plans.Received(1).AddAsync(Arg.Any<CareerPlan>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CareerDoesNotExist_ReturnsNotFound()
    {
        var deps = NewDeps();
        deps.Careers.FindByIdAsync(Arg.Any<CareerId>(), Arg.Any<CancellationToken>())
            .Returns((Career?)null);

        var result = await Invoke(deps, new CreateCareerPlanCommand(Guid.NewGuid(), 2024));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.NotFound);
        await deps.Plans.DidNotReceive().AddAsync(Arg.Any<CareerPlan>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_YearAlreadyTaken_ReturnsYearAlreadyTaken()
    {
        var deps = NewDeps();
        var career = AnyCareer(deps.Clock);
        var existingPlan = CareerPlan.Create(career.Id, 2024, deps.Clock).Value;
        deps.Careers.FindByIdAsync(career.Id, Arg.Any<CancellationToken>()).Returns(career);
        deps.Plans.FindByCareerAndYearAsync(career.Id, 2024, Arg.Any<CancellationToken>())
            .Returns(existingPlan);

        var result = await Invoke(deps, new CreateCareerPlanCommand(career.Id.Value, 2024));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanErrors.YearAlreadyTaken);
        await deps.Plans.DidNotReceive().AddAsync(Arg.Any<CareerPlan>(), Arg.Any<CancellationToken>());
    }
}
