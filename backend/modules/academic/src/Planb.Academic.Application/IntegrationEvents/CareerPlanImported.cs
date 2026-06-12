using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Academic.Application.IntegrationEvents;

/// <summary>
/// Emitido cuando un alumno aprueba un import crowdsourced de plan de estudios (US-088). El
/// CareerPlan + sus Subjects ya están materializados (isOfficial=false) en el catálogo. Lo
/// consume el módulo moderation/admin (cuando exista) para audit trail "este plan lo subió
/// un alumno, no un admin".
///
/// Cross-BC via Wolverine outbox. Mismo pattern que los otros integration events del proyecto.
/// </summary>
public sealed record CareerPlanImported(
    Guid CareerPlanImportId,
    Guid CareerPlanId,
    Guid CareerId,
    Guid UniversityId,
    Guid UploadedByUserId,
    int SubjectCount,
    DateTimeOffset ApprovedAt,
    Guid EventId,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
