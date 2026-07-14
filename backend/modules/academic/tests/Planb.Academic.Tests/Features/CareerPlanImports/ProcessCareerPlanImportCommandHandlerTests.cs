using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Planb.Academic.Application.Abstractions.Pdf;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Features.CareerPlanImports;
using Planb.Academic.Application.Services.CareerPlanParser;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.Universities;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Features.CareerPlanImports;

/// <summary>
/// Handler unit tests de <see cref="ProcessCareerPlanImportCommandHandler"/> (US-088). Cubre las
/// ramas de MarkFailed (PDF vacío/encriptado/sin-texto, texto en blanco, excepción del extractor,
/// excepción del parser) y los dos "drop" silenciosos (import inexistente, MarkParsing sobre un
/// aggregate que ya no está Pending).
///
/// <para>
/// <see cref="IPdfTextExtractor.Extract"/> toma un <c>ReadOnlySpan&lt;byte&gt;</c>: NSubstitute no
/// puede generar un proxy para ese método (Castle tira <c>InvalidProgramException</c> al intentar
/// interceptarlo, verificado). Por eso este archivo usa <see cref="FakePdfTextExtractor"/>, un test
/// double a mano, en vez de <c>Substitute.For&lt;IPdfTextExtractor&gt;()</c>.
/// </para>
///
/// <para>
/// La rama "timeout 60s → FailAndSave" no se testea acá: <c>ProcessingTimeout</c> es un
/// <c>static readonly TimeSpan</c> fijo en 60s sin punto de inyección, y el runtime actual rechaza
/// pisarlo por reflection (<c>FieldAccessException: Cannot set initonly static field</c>,
/// verificado). Ejercitarla de verdad requeriría esperar 60s reales por test, inaceptable para
/// esta capa; falta un seam en el handler (ej. inyectar el timeout) para cerrarla sin ese costo.
/// </para>
/// </summary>
public class ProcessCareerPlanImportCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 1, 12, 0, 0, TimeSpan.Zero);

    private sealed class FakePdfTextExtractor : IPdfTextExtractor
    {
        private readonly Func<PdfExtractionResult>? _resultFactory;
        private readonly Exception? _exception;

        private FakePdfTextExtractor(Func<PdfExtractionResult>? resultFactory, Exception? exception)
        {
            _resultFactory = resultFactory;
            _exception = exception;
        }

        public static FakePdfTextExtractor Returning(PdfExtractionResult result) => new(() => result, null);

        public static FakePdfTextExtractor Throwing(Exception exception) => new(null, exception);

        public PdfExtractionResult Extract(ReadOnlySpan<byte> pdfBytes) =>
            _exception is not null ? throw _exception : _resultFactory!();
    }

    private sealed record Deps(
        ICareerPlanImportRepository Imports,
        IAcademicUnitOfWork UnitOfWork,
        ICareerPlanParser Parser,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<ICareerPlanImportRepository>(),
        Substitute.For<IAcademicUnitOfWork>(),
        Substitute.For<ICareerPlanParser>(),
        new FixedClock(T0));

    private static ProcessCareerPlanImportCommandHandler NewHandler(Deps deps, IPdfTextExtractor? pdfExtractor = null) =>
        new(
            deps.Imports,
            deps.UnitOfWork,
            pdfExtractor ?? FakePdfTextExtractor.Returning(new PdfExtractionResult("MAT101 Analisis", 1, false)),
            deps.Parser,
            deps.Clock,
            NullLogger<ProcessCareerPlanImportCommandHandler>.Instance);

    private static CareerPlanImport PendingImport(FixedClock clock) =>
        CareerPlanImport.Create(
            Guid.NewGuid(), UniversityId.New(), "TUDCS", 2024, 2024,
            CareerPlanImportSourceType.Text, clock).Value;

    // ── PDF: payload vacío/encriptado/sin-texto ─────────────────────────

    [Theory]
    [InlineData(null)]
    [InlineData(new byte[0])]
    public async Task Handle_PdfWithEmptyBytes_MarksFailed(byte[]? pdfBytes)
    {
        var deps = NewDeps();
        var import = PendingImport(deps.Clock);
        deps.Imports.FindByIdAsync(import.Id, Arg.Any<CancellationToken>()).Returns(import);

        var handler = NewHandler(deps);
        await handler.Handle(
            new ProcessCareerPlanImportCommand(import.Id.Value, CareerPlanImportSourceType.Pdf, pdfBytes, null),
            CancellationToken.None);

        import.Status.ShouldBe(CareerPlanImportStatus.Failed);
        import.Error.ShouldBe("PDF vacío.");
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_EncryptedPdf_MarksFailed()
    {
        var deps = NewDeps();
        var import = PendingImport(deps.Clock);
        deps.Imports.FindByIdAsync(import.Id, Arg.Any<CancellationToken>()).Returns(import);
        var extractor = FakePdfTextExtractor.Returning(new PdfExtractionResult("", 1, IsEncrypted: true));

        var handler = NewHandler(deps, extractor);
        await handler.Handle(
            new ProcessCareerPlanImportCommand(
                import.Id.Value, CareerPlanImportSourceType.Pdf, new byte[] { 1, 2, 3 }, null),
            CancellationToken.None);

        import.Status.ShouldBe(CareerPlanImportStatus.Failed);
        import.Error.ShouldBe("El PDF está protegido con contraseña. Subí el original sin contraseña.");
    }

    [Fact]
    public async Task Handle_PdfWithoutExtractableText_MarksFailed()
    {
        var deps = NewDeps();
        var import = PendingImport(deps.Clock);
        deps.Imports.FindByIdAsync(import.Id, Arg.Any<CancellationToken>()).Returns(import);
        // PageCount=0 simula una imagen escaneada sin OCR: PdfPig no encuentra texto.
        var extractor = FakePdfTextExtractor.Returning(new PdfExtractionResult("", 0, IsEncrypted: false));

        var handler = NewHandler(deps, extractor);
        await handler.Handle(
            new ProcessCareerPlanImportCommand(
                import.Id.Value, CareerPlanImportSourceType.Pdf, new byte[] { 1, 2, 3 }, null),
            CancellationToken.None);

        import.Status.ShouldBe(CareerPlanImportStatus.Failed);
        import.Error.ShouldBe("No pudimos extraer texto del PDF. Puede ser una imagen escaneada sin OCR.");
    }

    // ── Texto pegado en blanco ───────────────────────────────────────────

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Handle_TextSourceWithBlankRawText_MarksFailed(string? rawText)
    {
        var deps = NewDeps();
        var import = PendingImport(deps.Clock);
        deps.Imports.FindByIdAsync(import.Id, Arg.Any<CancellationToken>()).Returns(import);

        var handler = NewHandler(deps);
        await handler.Handle(
            new ProcessCareerPlanImportCommand(import.Id.Value, CareerPlanImportSourceType.Text, null, rawText),
            CancellationToken.None);

        import.Status.ShouldBe(CareerPlanImportStatus.Failed);
        import.Error.ShouldBe("El texto enviado está vacío.");
    }

    // ── Excepciones inesperadas ──────────────────────────────────────────

    [Fact]
    public async Task Handle_PdfExtractorThrows_MarksFailed()
    {
        var deps = NewDeps();
        var import = PendingImport(deps.Clock);
        deps.Imports.FindByIdAsync(import.Id, Arg.Any<CancellationToken>()).Returns(import);
        var extractor = FakePdfTextExtractor.Throwing(new InvalidOperationException("boom"));

        var handler = NewHandler(deps, extractor);
        await handler.Handle(
            new ProcessCareerPlanImportCommand(
                import.Id.Value, CareerPlanImportSourceType.Pdf, new byte[] { 1, 2, 3 }, null),
            CancellationToken.None);

        import.Status.ShouldBe(CareerPlanImportStatus.Failed);
        import.Error.ShouldBe("No pudimos leer el archivo. Probá con otro PDF o pegá el texto manualmente.");
    }

    [Fact]
    public async Task Handle_ParserThrows_MarksFailed()
    {
        var deps = NewDeps();
        var import = PendingImport(deps.Clock);
        deps.Imports.FindByIdAsync(import.Id, Arg.Any<CancellationToken>()).Returns(import);
        deps.Parser.Parse(Arg.Any<string>()).Returns(_ => throw new InvalidOperationException("parser boom"));

        var handler = NewHandler(deps);
        await handler.Handle(
            new ProcessCareerPlanImportCommand(
                import.Id.Value, CareerPlanImportSourceType.Text, null, "MAT101 Analisis"),
            CancellationToken.None);

        import.Status.ShouldBe(CareerPlanImportStatus.Failed);
        import.Error.ShouldBe("Hubo un error procesando el contenido. Reintentá o cargá manualmente.");
    }

    // ── Drops silenciosos ────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ImportNotFound_DropsWithoutSideEffects()
    {
        var deps = NewDeps();
        var importId = Guid.NewGuid();
        deps.Imports.FindByIdAsync(Arg.Any<CareerPlanImportId>(), Arg.Any<CancellationToken>())
            .Returns((CareerPlanImport?)null);

        var handler = NewHandler(deps);
        await handler.Handle(
            new ProcessCareerPlanImportCommand(importId, CareerPlanImportSourceType.Text, null, "MAT101 Analisis"),
            CancellationToken.None);

        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        deps.Parser.DidNotReceive().Parse(Arg.Any<string>());
    }

    [Fact]
    public async Task Handle_ImportNotPending_DropsWithoutSideEffects()
    {
        var deps = NewDeps();
        var import = PendingImport(deps.Clock);
        import.MarkParsing(deps.Clock); // simula que otro worker ya lo está procesando
        deps.Imports.FindByIdAsync(import.Id, Arg.Any<CancellationToken>()).Returns(import);

        var handler = NewHandler(deps);
        await handler.Handle(
            new ProcessCareerPlanImportCommand(import.Id.Value, CareerPlanImportSourceType.Text, null, "MAT101 Analisis"),
            CancellationToken.None);

        import.Status.ShouldBe(CareerPlanImportStatus.Parsing); // sin cambios
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        deps.Parser.DidNotReceive().Parse(Arg.Any<string>());
    }
}
