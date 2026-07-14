using NSubstitute;
using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Application.Features.HistorialImports;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Enrollments.Tests.Features.HistorialImports;

/// <summary>
/// Handler unit tests para <see cref="ConfirmHistorialImportCommandHandler"/> (US-014). Cubre el
/// valor central del confirm: crear un <c>EnrollmentRecord</c> por item, saltear los que ya
/// tienen un record con la misma triple (student, subject, term), y devolver los conteos
/// correctos. También los guard clauses de ownership/estado previos al loop.
/// </summary>
public class ConfirmHistorialImportCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 20, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid CallerUserId = Guid.NewGuid();
    private static readonly Guid StudentProfileId = Guid.NewGuid();
    private static readonly Guid SubjectIdCreated = Guid.NewGuid();
    private static readonly Guid SubjectIdSkipped = Guid.NewGuid();
    private static readonly Guid TermId = Guid.NewGuid();

    private sealed record Deps(
        IHistorialImportRepository Imports,
        IEnrollmentRecordRepository Records,
        IEnrollmentsUnitOfWork UnitOfWork,
        IIdentityQueryService Identity,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<IHistorialImportRepository>(),
        Substitute.For<IEnrollmentRecordRepository>(),
        Substitute.For<IEnrollmentsUnitOfWork>(),
        Substitute.For<IIdentityQueryService>(),
        new FixedClock(T0));

    private static StudentProfileSummary ActiveProfile() =>
        new(StudentProfileId, CallerUserId, Guid.NewGuid(), Guid.NewGuid(), IsActive: true);

    private static HistorialImport ParsedImport(FixedClock clock)
    {
        var import = HistorialImport.Create(StudentProfileId, HistorialImportSourceType.Text, clock);
        import.MarkParsing(clock);
        var payload = new HistorialImportPayload(
            RawText: "raw",
            Items: [],
            Summary: new HistorialImportSummary(0, 0, 0, 0));
        import.MarkParsed(payload, clock);
        return import;
    }

    private static Task<Result<ConfirmHistorialImportResponse>> InvokeAsync(
        Deps deps, ConfirmHistorialImportCommand command) =>
        ConfirmHistorialImportCommandHandler.Handle(
            command, deps.Imports, deps.Records, deps.UnitOfWork, deps.Identity, deps.Clock, CancellationToken.None);

    [Fact]
    public async Task Handle_StudentProfileMissing_ReturnsStudentProfileRequired()
    {
        var deps = NewDeps();
        deps.Identity.GetStudentProfileForUserAsync(CallerUserId, Arg.Any<CancellationToken>())
            .Returns((StudentProfileSummary?)null);

        var result = await InvokeAsync(deps, new ConfirmHistorialImportCommand(CallerUserId, Guid.NewGuid(), []));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(HistorialImportErrors.StudentProfileRequired);
        await deps.Imports.DidNotReceive().FindByIdForOwnerAsync(
            Arg.Any<HistorialImportId>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_StudentProfileInactive_ReturnsStudentProfileRequired()
    {
        var deps = NewDeps();
        var inactive = ActiveProfile() with { IsActive = false };
        deps.Identity.GetStudentProfileForUserAsync(CallerUserId, Arg.Any<CancellationToken>())
            .Returns(inactive);

        var result = await InvokeAsync(deps, new ConfirmHistorialImportCommand(CallerUserId, Guid.NewGuid(), []));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(HistorialImportErrors.StudentProfileRequired);
    }

    [Fact]
    public async Task Handle_ImportNotFoundForOwner_ReturnsNotFound()
    {
        var deps = NewDeps();
        var profile = ActiveProfile();
        deps.Identity.GetStudentProfileForUserAsync(CallerUserId, Arg.Any<CancellationToken>()).Returns(profile);
        deps.Imports.FindByIdForOwnerAsync(
                Arg.Any<HistorialImportId>(), profile.Id, Arg.Any<CancellationToken>())
            .Returns((HistorialImport?)null);

        var result = await InvokeAsync(deps, new ConfirmHistorialImportCommand(CallerUserId, Guid.NewGuid(), []));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(HistorialImportErrors.NotFound);
    }

    [Fact]
    public async Task Handle_ImportNotParsed_ReturnsNotReadyForConfirm()
    {
        var deps = NewDeps();
        var profile = ActiveProfile();
        deps.Identity.GetStudentProfileForUserAsync(CallerUserId, Arg.Any<CancellationToken>()).Returns(profile);

        // Recién creado: Pending, no Parsed.
        var pendingImport = HistorialImport.Create(StudentProfileId, HistorialImportSourceType.Text, deps.Clock);
        deps.Imports.FindByIdForOwnerAsync(
                Arg.Any<HistorialImportId>(), profile.Id, Arg.Any<CancellationToken>())
            .Returns(pendingImport);

        var result = await InvokeAsync(
            deps, new ConfirmHistorialImportCommand(CallerUserId, pendingImport.Id.Value, []));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(HistorialImportErrors.NotReadyForConfirm);
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_HappyPath_CreatesNewRecords_SkipsExisting_AndReturnsCounts()
    {
        var deps = NewDeps();
        var profile = ActiveProfile();
        deps.Identity.GetStudentProfileForUserAsync(CallerUserId, Arg.Any<CancellationToken>()).Returns(profile);

        var import = ParsedImport(deps.Clock);
        deps.Imports.FindByIdForOwnerAsync(
                Arg.Is<HistorialImportId>(id => id.Value == import.Id.Value), profile.Id, Arg.Any<CancellationToken>())
            .Returns(import);

        // El primer item no tiene conflicto: se crea. El segundo ya existe: se saltea.
        deps.Records.ExistsAsync(profile.Id, SubjectIdCreated, TermId, Arg.Any<CancellationToken>())
            .Returns(false);
        deps.Records.ExistsAsync(profile.Id, SubjectIdSkipped, null, Arg.Any<CancellationToken>())
            .Returns(true);

        var items = new ConfirmedItem[]
        {
            new(SubjectIdCreated, TermId, "Aprobada", "FinalLibre", 7m),
            new(SubjectIdSkipped, null, "Aprobada", "Equivalencia", 8m),
        };

        var result = await InvokeAsync(deps, new ConfirmHistorialImportCommand(CallerUserId, import.Id.Value, items));

        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldBe(import.Id.Value);
        result.Value.CreatedCount.ShouldBe(1);
        result.Value.SkippedCount.ShouldBe(1);

        await deps.Records.Received(1).AddAsync(
            Arg.Is<EnrollmentRecord>(r => r!.SubjectId == SubjectIdCreated && r.StudentProfileId == profile.Id),
            Arg.Any<CancellationToken>());
        await deps.Records.DidNotReceive().AddAsync(
            Arg.Is<EnrollmentRecord>(r => r!.SubjectId == SubjectIdSkipped),
            Arg.Any<CancellationToken>());

        import.Status.ShouldBe(HistorialImportStatus.Confirmed);
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_AllItemsSkipped_CreatesNothing_ButStillConfirms()
    {
        var deps = NewDeps();
        var profile = ActiveProfile();
        deps.Identity.GetStudentProfileForUserAsync(CallerUserId, Arg.Any<CancellationToken>()).Returns(profile);

        var import = ParsedImport(deps.Clock);
        deps.Imports.FindByIdForOwnerAsync(
                Arg.Any<HistorialImportId>(), profile.Id, Arg.Any<CancellationToken>())
            .Returns(import);

        deps.Records.ExistsAsync(profile.Id, SubjectIdSkipped, TermId, Arg.Any<CancellationToken>())
            .Returns(true);

        var items = new ConfirmedItem[] { new(SubjectIdSkipped, TermId, "Aprobada", "Cursada", 7m) };

        var result = await InvokeAsync(deps, new ConfirmHistorialImportCommand(CallerUserId, import.Id.Value, items));

        result.IsSuccess.ShouldBeTrue();
        result.Value.CreatedCount.ShouldBe(0);
        result.Value.SkippedCount.ShouldBe(1);
        await deps.Records.DidNotReceive().AddAsync(Arg.Any<EnrollmentRecord>(), Arg.Any<CancellationToken>());
        import.Status.ShouldBe(HistorialImportStatus.Confirmed);
    }

    [Fact]
    public async Task Handle_InvalidEnrollmentInvariant_ReturnsErrorAndDoesNotConfirm()
    {
        var deps = NewDeps();
        var profile = ActiveProfile();
        deps.Identity.GetStudentProfileForUserAsync(CallerUserId, Arg.Any<CancellationToken>()).Returns(profile);

        var import = ParsedImport(deps.Clock);
        deps.Imports.FindByIdForOwnerAsync(
                Arg.Any<HistorialImportId>(), profile.Id, Arg.Any<CancellationToken>())
            .Returns(import);

        deps.Records.ExistsAsync(profile.Id, SubjectIdCreated, TermId, Arg.Any<CancellationToken>())
            .Returns(false);

        // Aprobada + Cursada exige commission_id, que el import nunca propaga: el aggregate
        // rechaza el invariante y el handler debe devolver el error, sin confirmar el import.
        var items = new ConfirmedItem[] { new(SubjectIdCreated, TermId, "Aprobada", "Cursada", 7m) };

        var result = await InvokeAsync(deps, new ConfirmHistorialImportCommand(CallerUserId, import.Id.Value, items));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.CursadaApprovalMissingCommissionOrTerm);
        import.Status.ShouldBe(HistorialImportStatus.Parsed);
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
