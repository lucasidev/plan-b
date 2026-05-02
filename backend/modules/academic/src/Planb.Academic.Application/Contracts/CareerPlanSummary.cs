namespace Planb.Academic.Application.Contracts;

/// <summary>
/// DTO plano para reads cross-bounded-context. Contiene el mínimo que un caller (Identity al
/// validar StudentProfile, Reviews al validar materias del plan, etc.) necesita sin exponer
/// el aggregate completo de Academic. Se extiende cuando un caller real requiera campos
/// adicionales; agregar fields preventivamente filtra info que no debería cruzar boundaries.
/// </summary>
public sealed record CareerPlanSummary(
    Guid Id,
    Guid CareerId,
    Guid UniversityId,
    int Year);
