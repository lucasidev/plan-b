namespace Planb.Enrollments.Application.Contracts;

/// <summary>
/// Vista cross-BC de un <c>EnrollmentRecord</c>. Diseñado para que módulos que necesitan
/// validar cursadas (caso canónico: Reviews al publicar una reseña) puedan tomar las dos
/// dimensiones que les importan, ownership (StudentProfileId) y estado lifecycle (Status,
/// CommissionId), sin hidratar el aggregate ni atravesar el schema (ADR-0017).
///
/// <list type="bullet">
///   <item><see cref="StudentProfileId"/>: el caller cruza este id con el StudentProfile
///         resuelto desde Identity para el user actual del request.</item>
///   <item><see cref="CommissionId"/>: nullable porque hay enrollments sin commission (ej.
///         equivalencias, finales libres). Reviews sólo permite reseñar enrollments que sí
///         tienen commission asociada.</item>
///   <item><see cref="Status"/>: el caller decide qué status habilita su comando.</item>
/// </list>
/// </summary>
public sealed record EnrollmentSummary(
    Guid Id,
    Guid StudentProfileId,
    Guid SubjectId,
    Guid? CommissionId,
    EnrollmentStatusSnapshot Status);

/// <summary>
/// Réplica del enum <c>EnrollmentStatus</c> del Domain en una superficie pública estable.
/// Mantenerla acá evita exponer el enum del Domain (que es interno del módulo) a callers
/// externos.
/// </summary>
public enum EnrollmentStatusSnapshot
{
    Cursando,
    Aprobada,
    Reprobada,
    Abandonada,
    Regular,
}
