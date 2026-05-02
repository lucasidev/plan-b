using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

/// <summary>
/// Levantado cuando un User se asocia a un CareerPlan + año de ingreso (US-012). Carga los IDs
/// derivados (CareerPlanId + CareerId denormalizado) para que un eventual handler downstream
/// pueda actualizar projections / cache sin tener que cargar el aggregate.
/// </summary>
public sealed record StudentProfileCreatedDomainEvent(
    UserId UserId,
    StudentProfileId StudentProfileId,
    Guid CareerPlanId,
    Guid CareerId,
    int EnrollmentYear,
    DateTimeOffset OccurredAt) : IDomainEvent;
