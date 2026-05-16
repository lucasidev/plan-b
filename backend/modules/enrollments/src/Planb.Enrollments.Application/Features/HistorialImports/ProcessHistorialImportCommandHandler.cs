using Microsoft.Extensions.Logging;
using Planb.Academic.Application.Contracts;
using Planb.Enrollments.Application.Abstractions.Pdf;
using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Application.Services.HistorialParser;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Worker async que procesa un import. Lo dispara Wolverine al recibir un
/// <see cref="ProcessHistorialImportCommand"/>.
///
/// <list type="number">
///   <item>Cargar el aggregate por id. Si no existe, log + drop (mensaje desactualizado).</item>
///   <item>Transicionar a <c>Parsing</c>.</item>
///   <item>Si PDF: extraer texto con <see cref="IPdfTextExtractor"/>. Si encriptado o roto,
///         marcar <c>Failed</c>.</item>
///   <item>Resolver subjects + terms del student (cross-BC).</item>
///   <item>Correr el parser heurístico.</item>
///   <item>Transicionar a <c>Parsed</c> con el payload.</item>
///   <item>SaveChanges. El user puede ahora hacer GET y ver el preview.</item>
/// </list>
///
/// <para>
/// El handler no llama al endpoint de confirm — eso lo hace el user manualmente desde el
/// frontend después de revisar el preview.
/// </para>
/// </summary>
public sealed class ProcessHistorialImportCommandHandler
{
    private readonly IHistorialImportRepository _imports;
    private readonly IEnrollmentsUnitOfWork _unitOfWork;
    private readonly IIdentityQueryService _identity;
    private readonly IAcademicQueryService _academic;
    private readonly IPdfTextExtractor _pdfExtractor;
    private readonly IHistorialParser _parser;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<ProcessHistorialImportCommandHandler> _log;

    public ProcessHistorialImportCommandHandler(
        IHistorialImportRepository imports,
        IEnrollmentsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IAcademicQueryService academic,
        IPdfTextExtractor pdfExtractor,
        IHistorialParser parser,
        IDateTimeProvider clock,
        ILogger<ProcessHistorialImportCommandHandler> log)
    {
        _imports = imports;
        _unitOfWork = unitOfWork;
        _identity = identity;
        _academic = academic;
        _pdfExtractor = pdfExtractor;
        _parser = parser;
        _clock = clock;
        _log = log;
    }

    public async Task Handle(ProcessHistorialImportCommand cmd, CancellationToken ct)
    {
        var import = await _imports.FindByIdAsync(new HistorialImportId(cmd.ImportId), ct);
        if (import is null)
        {
            _log.LogWarning(
                "ProcessHistorialImport: import {Id} not found (stale message?). Dropping.",
                cmd.ImportId);
            return;
        }

        var transitionToParsing = import.MarkParsing(_clock);
        if (transitionToParsing.IsFailure)
        {
            // Aggregate ya está en otro estado (Parsed/Failed/Confirmed). Si esto sucede
            // es porque el mensaje se reentregó. Drop, no retry.
            _log.LogInformation(
                "ProcessHistorialImport: import {Id} no está en Pending (status={Status}). Drop.",
                cmd.ImportId, import.Status);
            return;
        }

        // ── Extract text ────────────────────────────────────────────────
        string rawText;
        try
        {
            if (cmd.SourceType == HistorialImportSourceType.Pdf)
            {
                if (cmd.PdfBytes is null || cmd.PdfBytes.Length == 0)
                {
                    await FailAndSaveAsync(import, "PDF vacío.", ct);
                    return;
                }

                var extracted = _pdfExtractor.Extract(cmd.PdfBytes);
                if (extracted.IsEncrypted)
                {
                    await FailAndSaveAsync(import,
                        "El PDF está protegido con contraseña. Subí el original sin contraseña.",
                        ct);
                    return;
                }
                if (extracted.PageCount == 0 || string.IsNullOrWhiteSpace(extracted.Text))
                {
                    await FailAndSaveAsync(import,
                        "No pudimos extraer texto del PDF. Puede ser una imagen escaneada sin OCR.",
                        ct);
                    return;
                }
                rawText = extracted.Text;
            }
            else
            {
                rawText = cmd.RawText ?? string.Empty;
                if (string.IsNullOrWhiteSpace(rawText))
                {
                    await FailAndSaveAsync(import, "El texto enviado está vacío.", ct);
                    return;
                }
            }
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "PDF extraction failed para import {Id}", cmd.ImportId);
            await FailAndSaveAsync(import,
                "No pudimos leer el archivo. Probá con otro PDF o pegá el texto manualmente.",
                ct);
            return;
        }

        // ── Cross-BC reads: profile + subjects + terms del plan del student ───────
        // El aggregate guarda el studentProfileId; resolvemos el profile completo cross-BC
        // para acceder al careerPlanId. El universityId sale del CareerPlan vía Academic.
        var profile = await _identity.GetStudentProfileByIdAsync(import.StudentProfileId, ct);
        if (profile is null)
        {
            await FailAndSaveAsync(import,
                "Tu perfil de estudiante ya no existe.",
                ct);
            return;
        }

        var planSummary = await _academic.GetCareerPlanByIdAsync(profile.CareerPlanId, ct);
        if (planSummary is null)
        {
            await FailAndSaveAsync(import,
                "Tu plan de estudios no está disponible en el catálogo. Contactá soporte.",
                ct);
            return;
        }

        var subjects = await _academic.ListSubjectsByCareerPlanAsync(profile.CareerPlanId, ct);
        var terms = await _academic.ListAcademicTermsByUniversityAsync(planSummary.UniversityId, ct);

        var subjectsByCode = subjects.ToDictionary(s => s.Code, StringComparer.OrdinalIgnoreCase);
        var parserInputs = new HistorialParserInputs(subjectsByCode, terms);

        // ── Parse ────────────────────────────────────────────────────────
        HistorialImportPayload payload;
        try
        {
            payload = _parser.Parse(rawText, parserInputs);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Parser bug para import {Id}", cmd.ImportId);
            await FailAndSaveAsync(import,
                "Hubo un error procesando el contenido. Reintentá o cargá manualmente.",
                ct);
            return;
        }

        // ── Persist parsed result ────────────────────────────────────────
        var transition = import.MarkParsed(payload, _clock);
        if (transition.IsFailure)
        {
            _log.LogWarning(
                "ProcessHistorialImport: MarkParsed falló para {Id}: {Error}",
                cmd.ImportId, transition.Error.Code);
            return;
        }

        await _unitOfWork.SaveChangesAsync(ct);
        _log.LogInformation(
            "Import {Id} procesado. Detectados={Total} (high={H}, medium={M}, low={L}).",
            cmd.ImportId,
            payload.Summary.TotalDetected,
            payload.Summary.HighConfidence,
            payload.Summary.MediumConfidence,
            payload.Summary.LowConfidence);
    }

    private async Task FailAndSaveAsync(HistorialImport import, string error, CancellationToken ct)
    {
        var transition = import.MarkFailed(error, _clock);
        if (transition.IsFailure)
        {
            _log.LogWarning(
                "MarkFailed inválido para import {Id}: {Code}",
                import.Id.Value, transition.Error.Code);
            return;
        }
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
