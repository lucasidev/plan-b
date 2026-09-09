using NSubstitute;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Features.OfficialFacts;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Features.OfficialFacts;

/// <summary>
/// Handler unit tests de <see cref="CreateOfficialFactCommandHandler"/> (ADR-0090). Cubre el
/// parent-existence por cada uno de los tres tipos de sujeto (institución, unidad académica,
/// oferta), sin FK cross-aggregate (ADR-0017).
/// </summary>
public class CreateOfficialFactCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 9, 7, 12, 0, 0, TimeSpan.Zero);

    private sealed record Deps(
        IUniversityRepository Universities,
        IAcademicUnitRepository AcademicUnits,
        ICareerRepository Careers,
        IOfficialFactRepository OfficialFacts,
        IAcademicUnitOfWork UnitOfWork,
        FixedClock Clock);

    private static Deps NewDeps()
    {
        var deps = new Deps(
            Substitute.For<IUniversityRepository>(),
            Substitute.For<IAcademicUnitRepository>(),
            Substitute.For<ICareerRepository>(),
            Substitute.For<IOfficialFactRepository>(),
            Substitute.For<IAcademicUnitOfWork>(),
            new FixedClock(T0));

        // Defaults del happy path: los tres tipos de sujeto existen.
        deps.Universities.FindByIdAsync(Arg.Any<UniversityId>(), Arg.Any<CancellationToken>())
            .Returns(University.Create("UNSTA", "unsta", null, deps.Clock).Value);
        deps.AcademicUnits.FindByIdAsync(Arg.Any<AcademicUnitId>(), Arg.Any<CancellationToken>())
            .Returns(AcademicUnit.Create(
                new UniversityId(Guid.NewGuid()), "Facultad de Ingeniería", "ingenieria",
                "Av. Perón 2085 - Yerba Buena - Tucumán", deps.Clock).Value);
        deps.Careers.FindByIdAsync(Arg.Any<CareerId>(), Arg.Any<CancellationToken>())
            .Returns(Career.Create(
                new UniversityId(Guid.NewGuid()), "Tecnicatura", "tecnicatura", deps.Clock).Value);
        return deps;
    }

    private static Task<Result<CreateOfficialFactResponse>> Invoke(Deps deps, CreateOfficialFactCommand command) =>
        CreateOfficialFactCommandHandler.Handle(
            command, deps.Universities, deps.AcademicUnits, deps.Careers, deps.OfficialFacts,
            deps.UnitOfWork, deps.Clock, CancellationToken.None);

    private static CreateOfficialFactCommand Cmd(OfficialFactSubjectType subjectType, Guid subjectId) =>
        new(
            subjectType, subjectId, OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2,5 años", Unit: "years", Period: "plan vigente",
            SourceName: "Sitio UNSTA", SourceUrl: "https://unsta.edu.ar/ingenieria/tecnicatura",
            SourceDocument: null, SourceRetrievedAt: T0,
            DerivationRuleId: null, Note: null, RelievedAt: T0, RelievedBy: Guid.NewGuid());

    [Theory]
    [InlineData(OfficialFactSubjectType.Institution)]
    [InlineData(OfficialFactSubjectType.AcademicUnit)]
    [InlineData(OfficialFactSubjectType.Offering)]
    public async Task Handle_HappyPath_AnySubjectType_CreatesFactAndSaves(OfficialFactSubjectType subjectType)
    {
        var deps = NewDeps();

        var result = await Invoke(deps, Cmd(subjectType, Guid.NewGuid()));

        result.IsSuccess.ShouldBeTrue();
        await deps.OfficialFacts.Received(1).AddAsync(Arg.Any<OfficialFact>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_InstitutionDoesNotExist_ReturnsSubjectNotFound()
    {
        var deps = NewDeps();
        deps.Universities.FindByIdAsync(Arg.Any<UniversityId>(), Arg.Any<CancellationToken>())
            .Returns((University?)null);

        var result = await Invoke(deps, Cmd(OfficialFactSubjectType.Institution, Guid.NewGuid()));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SubjectNotFound);
        await deps.OfficialFacts.DidNotReceive().AddAsync(Arg.Any<OfficialFact>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_AcademicUnitDoesNotExist_ReturnsSubjectNotFound()
    {
        var deps = NewDeps();
        deps.AcademicUnits.FindByIdAsync(Arg.Any<AcademicUnitId>(), Arg.Any<CancellationToken>())
            .Returns((AcademicUnit?)null);

        var result = await Invoke(deps, Cmd(OfficialFactSubjectType.AcademicUnit, Guid.NewGuid()));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SubjectNotFound);
        await deps.OfficialFacts.DidNotReceive().AddAsync(Arg.Any<OfficialFact>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_OfferingDoesNotExist_ReturnsSubjectNotFound()
    {
        var deps = NewDeps();
        deps.Careers.FindByIdAsync(Arg.Any<CareerId>(), Arg.Any<CancellationToken>())
            .Returns((Career?)null);

        var result = await Invoke(deps, Cmd(OfficialFactSubjectType.Offering, Guid.NewGuid()));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SubjectNotFound);
        await deps.OfficialFacts.DidNotReceive().AddAsync(Arg.Any<OfficialFact>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DomainRejectsTheClaim_ReturnsDomainErrorWithoutSaving()
    {
        // El sujeto existe, pero la afirmación en sí es inválida (sin fuente): el aggregate la
        // rechaza y el handler no debe persistir nada.
        var deps = NewDeps();
        var command = Cmd(OfficialFactSubjectType.Offering, Guid.NewGuid()) with { SourceName = "" };

        var result = await Invoke(deps, command);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SourceNameRequired);
        await deps.OfficialFacts.DidNotReceive().AddAsync(Arg.Any<OfficialFact>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
