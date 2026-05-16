namespace Planb.Enrollments.Domain.HistorialImports;

/// <summary>
/// Shape completo del <c>raw_payload</c> JSONB. Se construye después del parseo y queda
/// guardado en el aggregate hasta el confirm. Cuando el user confirma, los items que
/// seleccionó (con eventuales overrides) se materializan como <c>EnrollmentRecord</c>.
///
/// <para>
/// <see cref="RawText"/> es el texto crudo extraído del PDF (o el texto pegado por el user
/// directamente si <c>SourceType=Text</c>). Lo guardamos por dos razones:
/// <list type="bullet">
///   <item><b>Reproducibilidad</b>: si mejoramos las heurísticas, podemos re-parsear sin
///         requerir que el user vuelva a subir el archivo.</item>
///   <item><b>Auditoría</b>: el user puede revisar qué texto vió el parser si el resultado
///         no es lo que esperaba.</item>
/// </list>
/// El raw text puede ser largo. Trade-off aceptable: una columna JSONB con 50-200 KB por
/// import no es problema para el volumen MVP.
/// </para>
/// </summary>
public sealed record HistorialImportPayload(
    string RawText,
    IReadOnlyList<ParsedItem> Items,
    HistorialImportSummary Summary);

/// <summary>
/// Resumen agregado del parseo. Se usa para mostrar al user en el preview header
/// ("Detectamos 12 materias: 10 resueltas, 2 con dudas, 0 no encontradas").
/// </summary>
public sealed record HistorialImportSummary(
    int TotalDetected,
    int HighConfidence,
    int MediumConfidence,
    int LowConfidence);
