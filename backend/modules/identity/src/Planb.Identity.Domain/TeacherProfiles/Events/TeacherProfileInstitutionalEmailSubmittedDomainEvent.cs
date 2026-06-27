using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.TeacherProfiles.Events;

/// <summary>
/// Levantado cuando el owner de un claim ingresa su email institucional y se le genera un token de
/// verificación (US-031). El handler lo usa como señal para enviar el mail con el link. Carga el
/// email destino (ya normalizado) para que el sender no tenga que volver a cargar el aggregate.
/// </summary>
public sealed record TeacherProfileInstitutionalEmailSubmittedDomainEvent(
    TeacherProfileId TeacherProfileId,
    UserId UserId,
    Guid TeacherId,
    string InstitutionalEmail,
    DateTimeOffset OccurredAt) : IDomainEvent;
