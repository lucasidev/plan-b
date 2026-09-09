using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// Carga (o "corrige") una afirmación oficial (ADR-0090, US-194, US-202). No hay comando de Update:
/// corregir es cargar una afirmación nueva con una fecha de relevamiento más reciente, que pasa a
/// ser la vigente (<see cref="OfficialFactCurrency"/>); la vieja queda como historia para Método.
/// </summary>
public sealed record CreateOfficialFactCommand(
    OfficialFactSubjectType SubjectType,
    Guid SubjectId,
    string Field,
    OfficialFactStatus Status,
    string? Value,
    string? Unit,
    string? Period,
    string SourceName,
    string SourceUrl,
    string? SourceDocument,
    DateTimeOffset SourceRetrievedAt,
    string? DerivationRuleId,
    string? Note,
    DateTimeOffset RelievedAt,
    Guid RelievedBy);
