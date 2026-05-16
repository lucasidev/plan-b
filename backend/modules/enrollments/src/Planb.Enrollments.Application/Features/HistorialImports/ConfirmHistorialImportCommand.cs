namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Comando del POST /confirm. El user envía los items que decidió importar, con sus eventuales
/// overrides de campos (cambió la nota, eligió otro term, ajustó status, etc.).
///
/// Cada <see cref="ConfirmedItem"/> resulta en un <c>EnrollmentRecord</c> nuevo (o un skip
/// silencioso si ya existía uno con la triple (student, subject, term) — conflict resolution
/// per ADR-0006 reseñas: el import respeta lo que el alumno ya cargó manualmente).
/// </summary>
public sealed record ConfirmHistorialImportCommand(
    Guid UserId,
    Guid ImportId,
    IReadOnlyList<ConfirmedItem> Items);

public sealed record ConfirmedItem(
    Guid SubjectId,
    Guid? TermId,
    string Status,
    string? ApprovalMethod,
    decimal? Grade);
