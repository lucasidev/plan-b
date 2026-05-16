namespace Planb.Academic.Domain.CareerPlanImports;

/// <summary>
/// Confianza del parser por item. Mismas semánticas que <c>ParseConfidence</c> de
/// <c>HistorialImport</c>: High = todos los campos clave detectados, Medium = la mayoría,
/// Low = solo el código.
/// </summary>
public enum SubjectParseConfidence
{
    Low,
    Medium,
    High,
}

/// <summary>
/// Una materia detectada por el parser desde el PDF/texto del plan. Cada item es un candidato:
/// el alumno revisa el preview, edita lo que detecte mal (o agrega lo que falte), y al confirmar
/// el endpoint /approve los materializa como <c>Subject</c>s reales en el plan creado.
///
/// <para>
/// El parser solo detecta los campos del MVP: código, nombre, año en plan, cuatrimestre. No
/// detecta correlativas (out of scope per US-088). Las hours quedan en defaults conservadores:
/// 4 hs semanales / 60 totales para cuatrimestre, 4/120 para anual. El alumno los puede ajustar
/// en el preview.
/// </para>
/// </summary>
public sealed record ParsedSubjectItem(
    int Index,
    string RawRow,
    string? DetectedCode,
    string? DetectedName,
    int? DetectedYearInPlan,
    int? DetectedTermInYear,
    string? DetectedTermKind,
    SubjectParseConfidence Confidence,
    IReadOnlyList<string> Issues);

/// <summary>
/// Counts agregados del resultado del parser. Render rápido en el preview ("detectamos 32, 24
/// con confianza alta") y útil para los tests.
/// </summary>
public sealed record CareerPlanImportSummary(
    int TotalDetected,
    int HighConfidence,
    int MediumConfidence,
    int LowConfidence);

/// <summary>
/// Output completo del parser. Se persiste en el aggregate <c>CareerPlanImport.Payload</c> como
/// JSONB (ADR-0006).
/// </summary>
public sealed record CareerPlanImportPayload(
    string RawText,
    IReadOnlyList<ParsedSubjectItem> Items,
    CareerPlanImportSummary Summary);
