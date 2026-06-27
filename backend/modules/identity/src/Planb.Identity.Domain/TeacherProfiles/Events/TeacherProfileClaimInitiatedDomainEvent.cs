using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.TeacherProfiles.Events;

/// <summary>
/// Levantado cuando un member reclama identidad sobre un docente del catálogo (US-030). El profile
/// nace pending (<c>verified_at=null</c>): no desbloquea capabilities hasta verificarse (ADR-0008).
/// Carga el <see cref="TeacherId"/> (cross-BC, raw Guid) para que un eventual consumer de audit /
/// telemetría reaccione sin cargar el aggregate.
/// </summary>
public sealed record TeacherProfileClaimInitiatedDomainEvent(
    TeacherProfileId TeacherProfileId,
    UserId UserId,
    Guid TeacherId,
    DateTimeOffset OccurredAt) : IDomainEvent;
