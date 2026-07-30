namespace Planb.Enrollments.Application.Features.GetMyTranscript;

/// <summary>
/// Read-side del historial académico propio de un alumno (GET /api/me/enrollment-records).
/// Agrupa las cursadas del student por período académico, ordenadas de la más reciente a la más
/// vieja, con las cursadas sin período (term_id null) en su propio grupo al final.
/// </summary>
public interface IMyTranscriptReader
{
    Task<IReadOnlyList<TranscriptPeriod>> GetForStudentAsync(
        Guid studentProfileId, CancellationToken ct = default);
}
