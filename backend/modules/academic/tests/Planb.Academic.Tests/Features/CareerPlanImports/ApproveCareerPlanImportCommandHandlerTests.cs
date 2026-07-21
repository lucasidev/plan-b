using System.Linq;
using NSubstitute;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Features.CareerPlanImports;
using Planb.Academic.Application.IntegrationEvents;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Wolverine;
using Xunit;

namespace Planb.Academic.Tests.Features.CareerPlanImports;

/// <summary>
/// Handler unit tests de <see cref="ApproveCareerPlanImportCommandHandler"/> (US-088). Cubre:
/// reuse-or-create de Career por (universityId, slug); skip silencioso de materias inválidas
/// (Subject.Create falla → continue); NoItemsSelected cuando todas las materias son inválidas;
/// y la materialización completa (CareerPlan + Subjects isOfficial=false, MarkApproved en el
/// aggregate, publish del integration event).
/// </summary>
public class ApproveCareerPlanImportCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 1, 12, 0, 0, TimeSpan.Zero);

    private sealed record Deps(
        ICareerPlanImportRepository Imports,
        ICareerRepository Careers,
        ICareerPlanRepository Plans,
        ISubjectRepository Subjects,
        IAcademicUnitOfWork UnitOfWork,
        IMessageBus Bus,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<ICareerPlanImportRepository>(),
        Substitute.For<ICareerRepository>(),
        Substitute.For<ICareerPlanRepository>(),
        Substitute.For<ISubjectRepository>(),
        Substitute.For<IAcademicUnitOfWork>(),
        Substitute.For<IMessageBus>(),
        new FixedClock(T0));

    private static Task<Result<ApproveCareerPlanImportResponse>> Invoke(
        Deps deps, ApproveCareerPlanImportCommand command) =>
        ApproveCareerPlanImportCommandHandler.Handle(
            command, deps.Imports, deps.Careers, deps.Plans, deps.Subjects,
            deps.UnitOfWork, deps.Bus, deps.Clock, CancellationToken.None);

    private static CareerPlanImport ParsedImport(
        FixedClock clock, Guid userId, UniversityId universityId,
        string careerName = "TUDCS", int planYear = 2024)
    {
        var import = CareerPlanImport.Create(
            userId, universityId, careerName, planYear, planYear,
            CareerPlanImportSourceType.Text, clock).Value;
        import.MarkParsing(clock);
        import.MarkParsed(new CareerPlanImportPayload("raw", [], new CareerPlanImportSummary(0, 0, 0, 0)), clock);
        return import;
    }

    private static ApproveSubjectItem ValidItem(string code, int yearInPlan = 1) =>
        new(code, $"Materia {code}", yearInPlan, 1, "FourMonth");

    // Code en blanco: Subject.Create rechaza con CodeRequired.
    private static ApproveSubjectItem InvalidItem() =>
        new("", "Materia inválida", 1, 1, "FourMonth");

    // ── Reuse-or-create de Career ────────────────────────────────────────

    [Fact]
    public async Task Handle_ReusesExistingCareer_WhenUniversityAndSlugMatch()
    {
        var deps = NewDeps();
        var userId = Guid.NewGuid();
        var universityId = UniversityId.New();
        var import = ParsedImport(deps.Clock, userId, universityId);
        deps.Imports.FindByIdForOwnerAsync(import.Id, userId, Arg.Any<CancellationToken>()).Returns(import);

        var existingCareer = Career.Create(universityId, "TUDCS", "tudcs", deps.Clock).Value;
        deps.Careers.FindByUniversityAndSlugAsync(universityId, "tudcs", Arg.Any<CancellationToken>())
            .Returns(existingCareer);
        deps.Plans.FindByCareerAndYearAsync(existingCareer.Id, import.PlanYear, Arg.Any<CancellationToken>())
            .Returns((CareerPlan?)null);

        var command = new ApproveCareerPlanImportCommand(userId, import.Id.Value, [ValidItem("MAT101")]);
        var result = await Invoke(deps, command);

        result.IsSuccess.ShouldBeTrue();
        result.Value.CareerId.ShouldBe(existingCareer.Id.Value);
        await deps.Careers.DidNotReceive().AddAsync(Arg.Any<Career>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CreatesNewCareer_WhenNoExistingMatchesUniversityAndSlug()
    {
        var deps = NewDeps();
        var userId = Guid.NewGuid();
        var universityId = UniversityId.New();
        var import = ParsedImport(deps.Clock, userId, universityId);
        deps.Imports.FindByIdForOwnerAsync(import.Id, userId, Arg.Any<CancellationToken>()).Returns(import);

        deps.Careers.FindByUniversityAndSlugAsync(universityId, "tudcs", Arg.Any<CancellationToken>())
            .Returns((Career?)null);
        deps.Plans.FindByCareerAndYearAsync(Arg.Any<CareerId>(), import.PlanYear, Arg.Any<CancellationToken>())
            .Returns((CareerPlan?)null);

        var command = new ApproveCareerPlanImportCommand(userId, import.Id.Value, [ValidItem("MAT101")]);
        var result = await Invoke(deps, command);

        result.IsSuccess.ShouldBeTrue();
        await deps.Careers.Received(1).AddAsync(
            Arg.Is<Career>(c => c!.UniversityId == universityId && c.Name == "TUDCS" && !c.IsOfficial),
            Arg.Any<CancellationToken>());
    }

    // ── Skip de materias inválidas ───────────────────────────────────────

    [Fact]
    public async Task Handle_SkipsInvalidItems_AndCreatesSubjectsOnlyForValidOnes()
    {
        var deps = NewDeps();
        var userId = Guid.NewGuid();
        var universityId = UniversityId.New();
        var import = ParsedImport(deps.Clock, userId, universityId);
        deps.Imports.FindByIdForOwnerAsync(import.Id, userId, Arg.Any<CancellationToken>()).Returns(import);

        var existingCareer = Career.Create(universityId, "TUDCS", "tudcs", deps.Clock).Value;
        deps.Careers.FindByUniversityAndSlugAsync(universityId, "tudcs", Arg.Any<CancellationToken>())
            .Returns(existingCareer);
        deps.Plans.FindByCareerAndYearAsync(existingCareer.Id, import.PlanYear, Arg.Any<CancellationToken>())
            .Returns((CareerPlan?)null);

        var command = new ApproveCareerPlanImportCommand(
            userId, import.Id.Value, [ValidItem("MAT101"), InvalidItem()]);
        var result = await Invoke(deps, command);

        result.IsSuccess.ShouldBeTrue();
        result.Value.SubjectCount.ShouldBe(1);
        await deps.Subjects.Received(1).AddRangeAsync(
            Arg.Is<IEnumerable<Subject>>(list => list!.Count() == 1 && list!.Single().Code == "MAT101"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ReturnsNoItemsSelected_WhenAllItemsAreInvalid()
    {
        var deps = NewDeps();
        var userId = Guid.NewGuid();
        var universityId = UniversityId.New();
        var import = ParsedImport(deps.Clock, userId, universityId);
        deps.Imports.FindByIdForOwnerAsync(import.Id, userId, Arg.Any<CancellationToken>()).Returns(import);

        var existingCareer = Career.Create(universityId, "TUDCS", "tudcs", deps.Clock).Value;
        deps.Careers.FindByUniversityAndSlugAsync(universityId, "tudcs", Arg.Any<CancellationToken>())
            .Returns(existingCareer);
        deps.Plans.FindByCareerAndYearAsync(existingCareer.Id, import.PlanYear, Arg.Any<CancellationToken>())
            .Returns((CareerPlan?)null);

        var command = new ApproveCareerPlanImportCommand(
            userId, import.Id.Value, [InvalidItem(), InvalidItem()]);
        var result = await Invoke(deps, command);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerPlanImportErrors.NoItemsSelected);
        await deps.Subjects.DidNotReceive().AddRangeAsync(Arg.Any<IEnumerable<Subject>>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        await deps.Bus.DidNotReceive().PublishAsync(Arg.Any<CareerPlanImported>());
    }

    // ── Materialización completa ─────────────────────────────────────────

    [Fact]
    public async Task Handle_HappyPath_MaterializesPlanAndSubjectsMarksApprovedAndPublishesEvent()
    {
        var deps = NewDeps();
        var userId = Guid.NewGuid();
        var universityId = UniversityId.New();
        var import = ParsedImport(deps.Clock, userId, universityId);
        deps.Imports.FindByIdForOwnerAsync(import.Id, userId, Arg.Any<CancellationToken>()).Returns(import);

        var existingCareer = Career.Create(universityId, "TUDCS", "tudcs", deps.Clock).Value;
        deps.Careers.FindByUniversityAndSlugAsync(universityId, "tudcs", Arg.Any<CancellationToken>())
            .Returns(existingCareer);
        deps.Plans.FindByCareerAndYearAsync(existingCareer.Id, import.PlanYear, Arg.Any<CancellationToken>())
            .Returns((CareerPlan?)null);

        var command = new ApproveCareerPlanImportCommand(
            userId, import.Id.Value, [ValidItem("MAT101"), ValidItem("ALG101")]);
        var result = await Invoke(deps, command);

        result.IsSuccess.ShouldBeTrue();
        result.Value.CareerId.ShouldBe(existingCareer.Id.Value);
        result.Value.SubjectCount.ShouldBe(2);

        await deps.Plans.Received(1).AddAsync(
            Arg.Is<CareerPlan>(p => p!.CareerId == existingCareer.Id && !p.IsOfficial && p.Year == import.PlanYear),
            Arg.Any<CancellationToken>());
        await deps.Subjects.Received(1).AddRangeAsync(
            Arg.Is<IEnumerable<Subject>>(list => list!.Count() == 2 && list!.All(s => !s.IsOfficial)),
            Arg.Any<CancellationToken>());

        import.Status.ShouldBe(CareerPlanImportStatus.Approved);
        import.ApprovedCareerPlanId.ShouldBe(result.Value.CareerPlanId);

        await deps.Bus.Received(1).PublishAsync(Arg.Is<CareerPlanImported>(e =>
            e!.CareerPlanImportId == import.Id.Value &&
            e.CareerId == existingCareer.Id.Value &&
            e.SubjectCount == 2));
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
