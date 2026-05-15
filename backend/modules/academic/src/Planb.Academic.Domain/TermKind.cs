namespace Planb.Academic.Domain;

/// <summary>
/// Cadencia académica de una unidad lectiva. Se usa cross-aggregate (Subject lo declara como
/// requirement de cursada, AcademicTerm lo declara como su tipo, futuro CareerPlan lo declara
/// como cadencia default del plan). Vive en el namespace root porque no es propiedad exclusiva
/// de ningún aggregate.
///
/// <para>
/// El valor <see cref="Anual"/> es distinto en semántica: la materia/term cubre todo el año y
/// no tiene número de cuatrimestre/bimestre. Los aggregates lo enforcan con CHECK constraints
/// app-level.
/// </para>
/// </summary>
public enum TermKind
{
    Bimestral,
    Cuatrimestral,
    Semestral,
    Anual,
}
