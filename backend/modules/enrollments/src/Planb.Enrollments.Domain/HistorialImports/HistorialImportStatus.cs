namespace Planb.Enrollments.Domain.HistorialImports;

/// <summary>
/// Lifecycle del import. Transiciones lineales (no se vuelve atrás):
/// <list type="bullet">
///   <item><see cref="Pending"/> → upload aceptado, no procesado todavía.</item>
///   <item><see cref="Parsing"/> → worker tomó el job, está extrayendo + parseando.</item>
///   <item><see cref="Parsed"/> → parser terminó. <c>raw_payload</c> tiene el resultado: items
///         detectados, matches, no-resueltos. El user revisa en el preview.</item>
///   <item><see cref="Failed"/> → algo falló (PDF encriptado, timeout, parser explotó).
///         <c>error</c> tiene la causa.</item>
///   <item><see cref="Confirmed"/> → user revisó el preview, ajustó, confirmó. Los
///         <c>EnrollmentRecord</c> ya están creados. Terminal.</item>
/// </list>
///
/// No incluimos un estado <c>Rejected</c>: si el user no quiere confirmar, simplemente no llama
/// al endpoint de confirm. El import queda en <see cref="Parsed"/> indefinidamente (cleanup
/// post-MVP cuando aterricen políticas de retención).
/// </summary>
public enum HistorialImportStatus
{
    Pending,
    Parsing,
    Parsed,
    Failed,
    Confirmed,
}
