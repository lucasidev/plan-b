namespace Planb.Academic.Domain.OfficialFacts;

/// <summary>
/// A qué se afirma (ADR-0090): la institución, la unidad académica, o la oferta (una carrera en una
/// institución). El sujeto se guarda como este tipo más un id plano (<see cref="OfficialFact.SubjectId"/>),
/// sin FK: el id referencia a <c>University</c>, <c>AcademicUnit</c> o <c>Career</c> según el valor.
/// </summary>
public enum OfficialFactSubjectType
{
    /// <summary>El sujeto es una <c>University</c> completa.</summary>
    Institution,

    /// <summary>El sujeto es una <c>AcademicUnit</c> (facultad).</summary>
    AcademicUnit,

    /// <summary>El sujeto es una <c>Career</c>: una carrera dictada en una institución puntual.</summary>
    Offering,
}
