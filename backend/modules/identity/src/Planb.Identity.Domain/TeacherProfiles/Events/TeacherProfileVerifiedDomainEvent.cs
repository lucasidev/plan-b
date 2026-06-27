using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.TeacherProfiles.Events;

/// <summary>
/// Levantado cuando un <see cref="TeacherProfile"/> queda verificado (US-031). Desbloquea la
/// capability <c>review:respond</c> (US-040). Un eventual translator lo convierte en integration
/// event para Reviews; por ahora no hay consumer (US-040 valida la capability vía query síncrona).
/// </summary>
public sealed record TeacherProfileVerifiedDomainEvent(
    TeacherProfileId TeacherProfileId,
    UserId UserId,
    Guid TeacherId,
    DateTimeOffset OccurredAt) : IDomainEvent;
