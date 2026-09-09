namespace Planb.Academic.Domain.OfficialFacts;

/// <summary>Cuánto vale la afirmación (ADR-0090). Cada valor gobierna qué otros campos exige <see cref="OfficialFact.Create"/>.</summary>
public enum OfficialFactStatus
{
    /// <summary>El valor está tal cual en la fuente.</summary>
    Published,

    /// <summary>Calculado con una regla escrita en Método; cita su id en <see cref="OfficialFact.DerivationRuleId"/>.</summary>
    Derived,

    /// <summary>Se buscó y no está publicado. La fuente sigue siendo obligatoria: ahí es dónde se buscó.</summary>
    NotPublished,

    /// <summary>Se pidió por Ley 27.275 o al DIU, sin respuesta todavía.</summary>
    Requested,

    /// <summary>El campo no existe para ese sujeto (ej. acreditación CONEAU en una tecnicatura). La razón va en <see cref="OfficialFact.Note"/>.</summary>
    NotApplicable,
}
