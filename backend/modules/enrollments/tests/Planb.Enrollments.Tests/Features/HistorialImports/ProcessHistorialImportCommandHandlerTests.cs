using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Planb.Academic.Application.Contracts;
using Planb.Enrollments.Application.Abstractions.Pdf;
using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Application.Features.HistorialImports;
using Planb.Enrollments.Application.Services.HistorialParser;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Identity.Application.Contracts;
using Shouldly;
using Xunit;

namespace Planb.Enrollments.Tests.Features.HistorialImports;

/// <summary>
/// Fake de mano (no NSubstitute) para <see cref="IPdfTextExtractor"/>. NSubstitute/Castle
/// DynamicProxy no puede generar un proxy para un método con parámetro <c>ReadOnlySpan&lt;byte&gt;</c>
/// (falla en runtime con <c>InvalidProgramException</c>: los ref structs no se pueden pasar por el
/// mecanismo de interceptación). Un fake escrito a mano no tiene ese problema porque el método se
/// implementa en IL estático, no generado dinámicamente.
/// </summary>
file sealed class FakePdfTextExtractor : IPdfTextExtractor
{
    private readonly PdfExtractionResult? _result;
    private readonly Exception? _toThrow;

    private FakePdfTextExtractor(PdfExtractionResult? result, Exception? toThrow)
    {
        _result = result;
        _toThrow = toThrow;
    }

    public static FakePdfTextExtractor Returning(PdfExtractionResult result) => new(result, null);

    public static FakePdfTextExtractor Throwing(Exception ex) => new(null, ex);

    /// <summary>Para tests donde el flujo no debería llegar a invocar el extractor.</summary>
    public static FakePdfTextExtractor NeverCalled() => new(null, null);

    public PdfExtractionResult Extract(ReadOnlySpan<byte> pdfBytes) => _toThrow is not null
        ? throw _toThrow
        : _result ?? throw new InvalidOperationException(
            "FakePdfTextExtractor.Extract no debería haberse invocado en este test.");
}

/// <summary>
/// Handler unit tests para <see cref="ProcessHistorialImportCommandHandler"/> (US-014). Cubre
/// las ramas de fallo del worker async: todas transicionan el aggregate a
/// <see cref="HistorialImportStatus.Failed"/> vía <c>MarkFailed</c> + <c>SaveChanges</c>.
///
/// <para>
/// La rama de timeout (60s, <see cref="ProcessHistorialImportCommandHandler.ProcessingTimeout"/>)
/// no está cubierta acá: el timeout depende de un <c>CancellationTokenSource(TimeSpan)</c> interno
/// al método con un valor hardcodeado de 60 segundos reales, no inyectable. Ejercitarla
/// requeriría esperar 60+ segundos reales en el test (impracticable para un unit test) o tocar
/// producción para inyectar el timeout/TimeProvider, fuera de alcance de este cambio.
/// </para>
/// </summary>
public class ProcessHistorialImportCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 20, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid StudentProfileId = Guid.NewGuid();
    private static readonly Guid CareerPlanId = Guid.NewGuid();
    private static readonly Guid UniversityId = Guid.NewGuid();

    private sealed record Deps(
        IHistorialImportRepository Imports,
        IEnrollmentsUnitOfWork UnitOfWork,
        IIdentityQueryService Identity,
        IAcademicQueryService Academic,
        IPdfTextExtractor PdfExtractor,
        IHistorialParser Parser,
        FixedClock Clock);

    private static Deps NewDeps(IPdfTextExtractor? pdfExtractor = null) => new(
        Substitute.For<IHistorialImportRepository>(),
        Substitute.For<IEnrollmentsUnitOfWork>(),
        Substitute.For<IIdentityQueryService>(),
        Substitute.For<IAcademicQueryService>(),
        pdfExtractor ?? FakePdfTextExtractor.NeverCalled(),
        Substitute.For<IHistorialParser>(),
        new FixedClock(T0));

    private static ProcessHistorialImportCommandHandler NewHandler(Deps deps) => new(
        deps.Imports,
        deps.UnitOfWork,
        deps.Identity,
        deps.Academic,
        deps.PdfExtractor,
        deps.Parser,
        deps.Clock,
        NullLogger<ProcessHistorialImportCommandHandler>.Instance);

    private static HistorialImport NewPendingImport(FixedClock clock, HistorialImportSourceType sourceType) =>
        HistorialImport.Create(StudentProfileId, sourceType, clock);

    private static StudentProfileSummary ActiveProfile() =>
        new(StudentProfileId, Guid.NewGuid(), Guid.NewGuid(), CareerPlanId, IsActive: true);

    private static void GivenImport(Deps deps, HistorialImport import) =>
        deps.Imports.FindByIdAsync(
                Arg.Is<HistorialImportId>(id => id.Value == import.Id.Value), Arg.Any<CancellationToken>())
            .Returns(import);

    // ── PDF: bytes vacíos (guard clause, ni siquiera llama al extractor) ────

    [Fact]
    public async Task Handle_PdfBytesEmpty_MarksFailed_WithoutCallingExtractor()
    {
        var deps = NewDeps(); // extractor NeverCalled(): si el handler lo invocara, el test explota.
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Pdf);
        GivenImport(deps, import);

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Pdf, PdfBytes: [], RawText: null);

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error.ShouldBe("PDF vacío.");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ── PDF: encriptado ──────────────────────────────────────────────────

    [Fact]
    public async Task Handle_PdfEncrypted_MarksFailed()
    {
        var extractor = FakePdfTextExtractor.Returning(new PdfExtractionResult(Text: "", PageCount: 1, IsEncrypted: true));
        var deps = NewDeps(extractor);
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Pdf);
        GivenImport(deps, import);

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Pdf, PdfBytes: [1, 2, 3], RawText: null);

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error!.ShouldContain("contraseña");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ── PDF: sin texto extraíble ─────────────────────────────────────────

    [Theory]
    [InlineData(0, "algo de texto")]
    [InlineData(2, "   ")]
    public async Task Handle_PdfWithoutExtractableText_MarksFailed(int pageCount, string text)
    {
        var extractor = FakePdfTextExtractor.Returning(
            new PdfExtractionResult(Text: text, PageCount: pageCount, IsEncrypted: false));
        var deps = NewDeps(extractor);
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Pdf);
        GivenImport(deps, import);

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Pdf, PdfBytes: [1, 2, 3], RawText: null);

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error!.ShouldContain("extraer texto");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ── PDF: excepción de extracción ─────────────────────────────────────

    [Fact]
    public async Task Handle_PdfExtractionThrows_MarksFailed()
    {
        var extractor = FakePdfTextExtractor.Throwing(new InvalidOperationException("PDF corrupto"));
        var deps = NewDeps(extractor);
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Pdf);
        GivenImport(deps, import);

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Pdf, PdfBytes: [1, 2, 3], RawText: null);

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error!.ShouldContain("No pudimos leer el archivo");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ── Texto pegado: vacío ──────────────────────────────────────────────

    [Fact]
    public async Task Handle_RawTextEmpty_MarksFailed()
    {
        var deps = NewDeps();
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Text);
        GivenImport(deps, import);

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Text, PdfBytes: null, RawText: "   ");

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error.ShouldBe("El texto enviado está vacío.");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ── Profile inexistente ──────────────────────────────────────────────

    [Fact]
    public async Task Handle_StudentProfileNoLongerExists_MarksFailed()
    {
        var deps = NewDeps();
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Text);
        GivenImport(deps, import);
        deps.Identity.GetStudentProfileByIdAsync(StudentProfileId, Arg.Any<CancellationToken>())
            .Returns((StudentProfileSummary?)null);

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Text, PdfBytes: null, RawText: "MAT101 8 Aprobada");

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error!.ShouldContain("perfil de estudiante ya no existe");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ── Plan no disponible ───────────────────────────────────────────────

    [Fact]
    public async Task Handle_CareerPlanNotInCatalog_MarksFailed()
    {
        var deps = NewDeps();
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Text);
        GivenImport(deps, import);
        deps.Identity.GetStudentProfileByIdAsync(StudentProfileId, Arg.Any<CancellationToken>())
            .Returns(ActiveProfile());
        deps.Academic.GetCareerPlanByIdAsync(CareerPlanId, Arg.Any<CancellationToken>())
            .Returns((CareerPlanSummary?)null);

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Text, PdfBytes: null, RawText: "MAT101 8 Aprobada");

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error!.ShouldContain("plan de estudios no está disponible");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ── Excepción del parser ─────────────────────────────────────────────

    [Fact]
    public async Task Handle_ParserThrows_MarksFailed()
    {
        var deps = NewDeps();
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Text);
        GivenImport(deps, import);
        deps.Identity.GetStudentProfileByIdAsync(StudentProfileId, Arg.Any<CancellationToken>())
            .Returns(ActiveProfile());
        deps.Academic.GetCareerPlanByIdAsync(CareerPlanId, Arg.Any<CancellationToken>())
            .Returns(new CareerPlanSummary(CareerPlanId, Guid.NewGuid(), UniversityId, 2024));
        deps.Academic.ListSubjectsByCareerPlanAsync(
            CareerPlanId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<SubjectListItem>());
        deps.Academic.ListAcademicTermsByUniversityAsync(UniversityId, Arg.Any<CancellationToken>())
            .Returns(Array.Empty<AcademicTermListItem>());
        deps.Parser.Parse(Arg.Any<string>(), Arg.Any<HistorialParserInputs>())
            .Returns(_ => throw new InvalidOperationException("parser bug"));

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Text, PdfBytes: null, RawText: "MAT101 8 Aprobada");

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        import.Status.ShouldBe(HistorialImportStatus.Failed);
        import.Error!.ShouldContain("error procesando el contenido");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ── Materias archivadas (US-062) ─────────────────────────────────────

    [Fact]
    public async Task Handle_AsksCatalogIncludingArchivedSubjects()
    {
        // El historial es pasado: si el backoffice archivó una materia (soft delete de US-062)
        // después de que el alumno la cursó, el parser igual tiene que poder matchearla por
        // código. Pedirle al catálogo solo las activas la volvería inimportable en silencio.
        var deps = NewDeps();
        var import = NewPendingImport(deps.Clock, HistorialImportSourceType.Text);
        GivenImport(deps, import);
        deps.Identity.GetStudentProfileByIdAsync(StudentProfileId, Arg.Any<CancellationToken>())
            .Returns(ActiveProfile());
        deps.Academic.GetCareerPlanByIdAsync(CareerPlanId, Arg.Any<CancellationToken>())
            .Returns(new CareerPlanSummary(CareerPlanId, Guid.NewGuid(), UniversityId, 2024));
        deps.Academic.ListSubjectsByCareerPlanAsync(
            CareerPlanId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<SubjectListItem>());
        deps.Academic.ListAcademicTermsByUniversityAsync(UniversityId, Arg.Any<CancellationToken>())
            .Returns(Array.Empty<AcademicTermListItem>());
        // El parser corre después de leer el catálogo, así que su resultado no importa acá: lo
        // que se afirma es con qué argumentos se pidió el catálogo.
        deps.Parser.Parse(Arg.Any<string>(), Arg.Any<HistorialParserInputs>())
            .Returns(_ => throw new InvalidOperationException("irrelevante para este test"));

        var cmd = new ProcessHistorialImportCommand(
            import.Id.Value, HistorialImportSourceType.Text, PdfBytes: null, RawText: "MAT101 8 Aprobada");

        await NewHandler(deps).Handle(cmd, CancellationToken.None);

        await deps.Academic.Received(1).ListSubjectsByCareerPlanAsync(
            CareerPlanId, true, Arg.Any<CancellationToken>());
    }
}
