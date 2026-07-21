namespace Planb.Enrollments.Domain.EnrollmentRecords;

/// <summary>
/// Forma en que el alumno aprobó la materia. Es nullable a nivel agregado:
/// <list type="bullet">
///   <item>Status=Aprobada → approval_method requerido.</item>
///   <item>Status=Regular → approval_method NULL (regular ≠ aprobado todavía).</item>
///   <item>Status ∈ {Cursando, Reprobada, Abandonada} → approval_method NULL.</item>
/// </list>
///
/// <para>Reglas de combinación con commission/term (data-model):</para>
/// <list type="bullet">
///   <item><see cref="Coursework"/> / <see cref="Promotion"/> / <see cref="FinalExam"/>: cursó la
///         materia, hay <c>commission_id</c> y <c>term_id</c>.</item>
///   <item><see cref="IndependentFinalExam"/>: rindió libre en un cuatri específico, sin cursar
///         comisión. <c>commission_id</c> NULL, <c>term_id</c> NOT NULL.</item>
///   <item><see cref="CreditTransfer"/>: reconocimiento académico, no hay cursada ni cuatri.
///         <c>commission_id</c> NULL, <c>term_id</c> NULL.</item>
/// </list>
/// </summary>
public enum ApprovalMethod
{
    Coursework,
    Promotion,
    FinalExam,
    IndependentFinalExam,
    CreditTransfer,
}
