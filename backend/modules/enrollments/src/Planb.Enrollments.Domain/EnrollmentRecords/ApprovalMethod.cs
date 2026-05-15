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
///   <item><see cref="Cursada"/> / <see cref="Promocion"/> / <see cref="Final"/>: cursó la
///         materia, hay <c>commission_id</c> y <c>term_id</c>.</item>
///   <item><see cref="FinalLibre"/>: rindió libre en un cuatri específico, sin cursar comisión.
///         <c>commission_id</c> NULL, <c>term_id</c> NOT NULL.</item>
///   <item><see cref="Equivalencia"/>: reconocimiento académico, no hay cursada ni cuatri.
///         <c>commission_id</c> NULL, <c>term_id</c> NULL.</item>
/// </list>
/// </summary>
public enum ApprovalMethod
{
    Cursada,
    Promocion,
    Final,
    FinalLibre,
    Equivalencia,
}
