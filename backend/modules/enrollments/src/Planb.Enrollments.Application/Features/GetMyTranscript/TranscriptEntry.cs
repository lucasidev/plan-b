namespace Planb.Enrollments.Application.Features.GetMyTranscript;

/// <summary>
/// Una materia dentro de un grupo de período del historial (GET /api/me/enrollment-records).
///
/// <see cref="Status"/> viaja con los cinco valores reales de <c>EnrollmentStatus</c> (Passed,
/// Regularized, InProgress, Failed, Dropped), no una simplificación binaria. <see cref="Grade"/> y
/// <see cref="ApprovalMethod"/> son null salvo que el status los requiera (mismo invariante que el
/// aggregate <c>EnrollmentRecord</c>).
///
/// <see cref="TeacherLastName"/> es null cuando la cursada no tiene comisión, o la comisión no tiene
/// titular cargado: el enrollment mismo no guarda docente, así que no hay nada que inventar en esos
/// casos (ver el reader para el detalle de cómo se deriva cuando sí está disponible).
/// </summary>
public sealed record TranscriptEntry(
    string SubjectCode,
    string SubjectName,
    string Status,
    string? ApprovalMethod,
    decimal? Grade,
    string? TeacherLastName);
