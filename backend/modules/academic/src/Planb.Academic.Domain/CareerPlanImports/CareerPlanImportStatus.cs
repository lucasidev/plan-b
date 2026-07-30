namespace Planb.Academic.Domain.CareerPlanImports;

/// <summary>
/// Lifecycle del aggregate. Pending → Parsing → Parsed → Approved (terminal).
/// Parsing → Failed (terminal). Parsed → Rejected (terminal): el staff revisó el preview y decidió
/// no incorporarlo al catálogo (motivo distinto del parseo, lo redacta una persona). Mismo pattern
/// que HistorialImport de US-014.
/// </summary>
public enum CareerPlanImportStatus
{
    Pending,
    Parsing,
    Parsed,
    Failed,
    Approved,
    Rejected,
}
