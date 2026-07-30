namespace Planb.Enrollments.Application.Features.GetMyTranscript;

/// <summary>
/// Grupo de materias de un mismo período académico, para GET /api/me/enrollment-records.
///
/// <see cref="Label"/>, <see cref="Year"/> y <see cref="Number"/> son null en conjunto para el
/// grupo de cursadas sin período (term_id null en el data-model: equivalencias, pero también
/// Regularized/Failed/Dropped sin cuatrimestre conocido, ver EnrollmentRecordConfiguration). Ese
/// grupo es identificable por el consumidor precisamente porque <see cref="Label"/> es null: no se
/// descarta, viaja como un grupo más.
///
/// <see cref="Average"/> es el promedio de las notas del período (null cuando ninguna materia del
/// grupo tiene nota todavía, nunca 0: ADR-0054, una métrica sin sustento viaja null).
/// </summary>
public sealed record TranscriptPeriod(
    string? Label,
    int? Year,
    int? Number,
    decimal? Average,
    IReadOnlyList<TranscriptEntry> Items);
