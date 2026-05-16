using Microsoft.Extensions.Logging;
using Planb.Academic.Application.Abstractions.Pdf;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Services.CareerPlanParser;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// Worker async para procesar imports de plan (US-088). Mismo pattern que el de US-014.
/// Carga aggregate → MarkParsing → extrae texto → parsea → MarkParsed o MarkFailed → SaveChanges.
/// Timeout 60s via linked CancellationTokenSource.
/// </summary>
public sealed class ProcessCareerPlanImportCommandHandler
{
    public static readonly TimeSpan ProcessingTimeout = TimeSpan.FromSeconds(60);

    private readonly ICareerPlanImportRepository _imports;
    private readonly IAcademicUnitOfWork _unitOfWork;
    private readonly IPdfTextExtractor _pdfExtractor;
    private readonly ICareerPlanParser _parser;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<ProcessCareerPlanImportCommandHandler> _log;

    public ProcessCareerPlanImportCommandHandler(
        ICareerPlanImportRepository imports,
        IAcademicUnitOfWork unitOfWork,
        IPdfTextExtractor pdfExtractor,
        ICareerPlanParser parser,
        IDateTimeProvider clock,
        ILogger<ProcessCareerPlanImportCommandHandler> log)
    {
        _imports = imports;
        _unitOfWork = unitOfWork;
        _pdfExtractor = pdfExtractor;
        _parser = parser;
        _clock = clock;
        _log = log;
    }

    public async Task Handle(ProcessCareerPlanImportCommand cmd, CancellationToken ct)
    {
        using var timeoutCts = new CancellationTokenSource(ProcessingTimeout);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        try
        {
            await HandleCore(cmd, linkedCts.Token);
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !ct.IsCancellationRequested)
        {
            _log.LogWarning(
                "ProcessCareerPlanImport: import {Id} excedió los {Seconds}s.",
                cmd.ImportId, ProcessingTimeout.TotalSeconds);
            try
            {
                var import = await _imports.FindByIdAsync(new CareerPlanImportId(cmd.ImportId), ct);
                if (import is not null)
                {
                    await FailAndSaveAsync(import,
                        "El procesamiento se pasó del tiempo límite (60s). Reintentá o pegá menos materias.",
                        ct);
                }
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "ProcessCareerPlanImport: fallo marcar Failed post-timeout para {Id}", cmd.ImportId);
            }
        }
    }

    private async Task HandleCore(ProcessCareerPlanImportCommand cmd, CancellationToken ct)
    {
        var import = await _imports.FindByIdAsync(new CareerPlanImportId(cmd.ImportId), ct);
        if (import is null)
        {
            _log.LogWarning("ProcessCareerPlanImport: {Id} not found. Drop.", cmd.ImportId);
            return;
        }

        var toParsing = import.MarkParsing(_clock);
        if (toParsing.IsFailure)
        {
            _log.LogInformation(
                "ProcessCareerPlanImport: {Id} no está en Pending (status={Status}). Drop.",
                cmd.ImportId, import.Status);
            return;
        }

        string rawText;
        try
        {
            if (cmd.SourceType == CareerPlanImportSourceType.Pdf)
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
            _log.LogError(ex, "PDF extraction failed para career-plan-import {Id}", cmd.ImportId);
            await FailAndSaveAsync(import,
                "No pudimos leer el archivo. Probá con otro PDF o pegá el texto manualmente.",
                ct);
            return;
        }

        CareerPlanImportPayload payload;
        try
        {
            payload = _parser.Parse(rawText);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Parser bug para career-plan-import {Id}", cmd.ImportId);
            await FailAndSaveAsync(import,
                "Hubo un error procesando el contenido. Reintentá o cargá manualmente.",
                ct);
            return;
        }

        var toParsed = import.MarkParsed(payload, _clock);
        if (toParsed.IsFailure)
        {
            _log.LogWarning(
                "MarkParsed falló para career-plan-import {Id}: {Error}",
                cmd.ImportId, toParsed.Error.Code);
            return;
        }

        await _unitOfWork.SaveChangesAsync(ct);
        _log.LogInformation(
            "CareerPlanImport {Id} procesado. Detectados={Total} (high={H}, medium={M}, low={L}).",
            cmd.ImportId,
            payload.Summary.TotalDetected,
            payload.Summary.HighConfidence,
            payload.Summary.MediumConfidence,
            payload.Summary.LowConfidence);
    }

    private async Task FailAndSaveAsync(CareerPlanImport import, string error, CancellationToken ct)
    {
        var transition = import.MarkFailed(error, _clock);
        if (transition.IsFailure)
        {
            _log.LogWarning(
                "MarkFailed inválido para career-plan-import {Id}: {Code}",
                import.Id.Value, transition.Error.Code);
            return;
        }
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
