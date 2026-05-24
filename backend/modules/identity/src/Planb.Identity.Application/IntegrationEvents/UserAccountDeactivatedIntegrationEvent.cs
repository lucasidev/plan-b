using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Identity.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement de un user que se dio de baja (ADR-0044). El user row sobrevive en
/// Identity con la PII anonimizada; los consumers deben **anonimizar referencias** en lugar
/// de cascade-deletear:
///
/// <list type="bullet">
///   <item><b>Reviews</b> (S5): las reseñas quedan, el display layer renderea autor como
///         "Ex-miembro". El <c>author_user_id</c> sigue apuntando al user anonimizado.</item>
///   <item><b>Moderation</b>: reports del user quedan; los flags de "reported by user X"
///         pierden la identidad pero el report sigue siendo decisión válida.</item>
///   <item><b>Enrollments</b>: los enrollment records del user (carrera, plan) quedan.</item>
/// </list>
///
/// <para>
/// Distinto de <see cref="UserAccountDeletedIntegrationEvent"/>: ese se emite SOLO en el hard
/// delete interno (uso admin/test/script). Cuando aterricen módulos nuevos, suscribir al
/// <c>UserAccountDeactivated</c>, NO al <c>UserAccountDeleted</c> (ese cascadea por design).
/// </para>
///
/// <para>
/// El integration event NO lleva el email (anonimizado ni original): cualquier consumer que
/// necesite info del user la lee del User vía read service, después de ver el event.
/// </para>
/// </summary>
public sealed record UserAccountDeactivatedIntegrationEvent(
    Guid EventId,
    Guid UserId,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
