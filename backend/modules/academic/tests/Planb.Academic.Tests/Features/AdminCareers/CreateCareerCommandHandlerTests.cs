using NSubstitute;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Application.Features.AdminCareers;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Features.AdminCareers;

/// <summary>
/// Handler unit tests de <see cref="CreateCareerCommandHandler"/> (US-061). Cubre el parent-existence
/// (University debe existir, ADR-0017) y los conflictos de unicidad (slug/code por universidad).
/// </summary>
public class CreateCareerCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 1, 12, 0, 0, TimeSpan.Zero);

    private sealed record Deps(
        ICareerRepository Careers,
        IAcademicQueryService Academic,
        IAcademicUnitOfWork UnitOfWork,
        FixedClock Clock);

    private static Deps NewDeps()
    {
        var deps = new Deps(
            Substitute.For<ICareerRepository>(),
            Substitute.For<IAcademicQueryService>(),
            Substitute.For<IAcademicUnitOfWork>(),
            new FixedClock(T0));

        // Defaults del happy path: la university existe y no hay colisión de slug/code.
        deps.Academic.UniversityExistsAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(true);
        deps.Careers.ExistsBySlugAsync(
            Arg.Any<UniversityId>(), Arg.Any<string>(), Arg.Any<CareerId?>(), Arg.Any<CancellationToken>())
            .Returns(false);
        deps.Careers.ExistsByCodeAsync(
            Arg.Any<UniversityId>(), Arg.Any<string>(), Arg.Any<CareerId?>(), Arg.Any<CancellationToken>())
            .Returns(false);
        return deps;
    }

    private static Task<Result<CreateCareerResponse>> Invoke(Deps deps, CreateCareerCommand command) =>
        CreateCareerCommandHandler.Handle(
            command, deps.Careers, deps.Academic, deps.UnitOfWork, deps.Clock, CancellationToken.None);

    private static CreateCareerCommand Cmd(Guid universityId) =>
        new(universityId, "Ingeniería en Sistemas", "ing-sis", "Ing. Sistemas", "ISI",
            null, null, null, null);

    [Fact]
    public async Task Handle_HappyPath_CreatesCareerAndSaves()
    {
        var deps = NewDeps();

        var result = await Invoke(deps, Cmd(Guid.NewGuid()));

        result.IsSuccess.ShouldBeTrue();
        await deps.Careers.Received(1).AddAsync(Arg.Any<Career>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_UniversityDoesNotExist_ReturnsUniversityNotFound()
    {
        var deps = NewDeps();
        var uniId = Guid.NewGuid();
        deps.Academic.UniversityExistsAsync(uniId, Arg.Any<CancellationToken>()).Returns(false);

        var result = await Invoke(deps, Cmd(uniId));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.UniversityNotFound);
        await deps.Careers.DidNotReceive().AddAsync(Arg.Any<Career>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SlugAlreadyTaken_ReturnsSlugAlreadyTaken()
    {
        var deps = NewDeps();
        deps.Careers.ExistsBySlugAsync(
            Arg.Any<UniversityId>(), "ing-sis", Arg.Any<CareerId?>(), Arg.Any<CancellationToken>())
            .Returns(true);

        var result = await Invoke(deps, Cmd(Guid.NewGuid()));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.SlugAlreadyTaken);
        await deps.Careers.DidNotReceive().AddAsync(Arg.Any<Career>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CodeAlreadyTaken_ReturnsCodeAlreadyTaken()
    {
        var deps = NewDeps();
        deps.Careers.ExistsByCodeAsync(
            Arg.Any<UniversityId>(), "ISI", Arg.Any<CareerId?>(), Arg.Any<CancellationToken>())
            .Returns(true);

        var result = await Invoke(deps, Cmd(Guid.NewGuid()));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.CodeAlreadyTaken);
    }

    [Fact]
    public async Task Handle_BlankCode_SkipsCodeUniquenessCheck()
    {
        var deps = NewDeps();
        var command = new CreateCareerCommand(
            Guid.NewGuid(), "Carrera", "carrera", null, "   ", null, null, null, null);

        var result = await Invoke(deps, command);

        result.IsSuccess.ShouldBeTrue();
        await deps.Careers.DidNotReceive().ExistsByCodeAsync(
            Arg.Any<UniversityId>(), Arg.Any<string>(), Arg.Any<CareerId?>(), Arg.Any<CancellationToken>());
    }
}
