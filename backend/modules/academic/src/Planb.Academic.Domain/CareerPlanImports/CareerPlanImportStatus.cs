namespace Planb.Academic.Domain.CareerPlanImports;

/// <summary>
/// Lifecycle del aggregate. Pending → Parsing → Parsed → Approved (terminal).
/// Parsing → Failed (terminal). Mismo pattern que HistorialImport de US-014.
/// </summary>
public enum CareerPlanImportStatus
{
    Pending,
    Parsing,
    Parsed,
    Failed,
    Approved,
}
