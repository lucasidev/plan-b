namespace Planb.Academic.Domain.Prerequisites;

/// <summary>
/// Tipo de correlativa (ADR-0003). El sistema universitario argentino distingue dos requisitos
/// distintos sobre la misma materia, y son dos grafos separados sobre los mismos subjects: una
/// materia puede tener a A como correlativa <see cref="ToEnroll"/> y a B <see cref="ToTakeFinal"/>
/// sin que se mezclen.
/// </summary>
public enum PrerequisiteType
{
    /// <summary>Requiere la materia regularizada (cursada aprobada) para inscribirse a cursar.</summary>
    ToEnroll = 1,

    /// <summary>Requiere la materia aprobada (final rendido) para poder rendir el final.</summary>
    ToTakeFinal = 2,
}
