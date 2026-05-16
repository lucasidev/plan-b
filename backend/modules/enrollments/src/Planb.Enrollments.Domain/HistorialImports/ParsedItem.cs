namespace Planb.Enrollments.Domain.HistorialImports;

/// <summary>
/// Confianza del parser sobre un ítem detectado. Se computa según cuántos campos pudo extraer
/// con regex/heurística:
/// <list type="bullet">
///   <item><see cref="High"/>: código + nota + estado + período detectados todos.</item>
///   <item><see cref="Medium"/>: código + 2-3 campos. Faltan algunos.</item>
///   <item><see cref="Low"/>: solo el código detectado, el resto es inferencia o falta.</item>
/// </list>
/// La UI usa esta clasificación para indicar visualmente (verde / amarillo / rojo) y para
/// decidir si pre-checkear el item en el preview.
/// </summary>
public enum ParseConfidence
{
    Low,
    Medium,
    High,
}

/// <summary>
/// Una fila detectada por el parser heurístico. <see cref="RawRow"/> es la línea original
/// del texto extraído (para que el user pueda verificar qué pieza del PDF/texto se mapeó).
/// Todos los campos detectados son nullables: el parser hace su mejor esfuerzo pero no
/// garantiza completitud — el preview UI deja que el user complete lo que falta.
///
/// <para>
/// <see cref="SubjectId"/> y <see cref="TermId"/> son los resueltos contra el catálogo
/// Academic (si <see cref="DetectedCode"/> matchea un Subject del plan; idem para term).
/// Null si no se pudo resolver. El user puede elegir manualmente en el dropdown del preview.
/// </para>
///
/// <para>
/// <see cref="Issues"/> es una lista plana de strings con notas para el user. Ejemplos:
/// "código MAT999 no está en tu plan", "no detectamos nota", "período ambiguo".
/// El frontend los muestra como warnings inline en cada fila.
/// </para>
/// </summary>
public sealed record ParsedItem(
    int Index,
    string RawRow,
    string? DetectedCode,
    decimal? DetectedGrade,
    string? DetectedStatus,
    string? DetectedApprovalMethod,
    int? DetectedYear,
    int? DetectedTermNumber,
    Guid? SubjectId,
    string? SubjectName,
    Guid? TermId,
    string? TermLabel,
    ParseConfidence Confidence,
    IReadOnlyList<string> Issues);
