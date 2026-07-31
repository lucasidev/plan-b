using System.Text.Json;
using Planb.Enrollments.Application.IntegrationEvents;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Consumer of <see cref="EnrollmentRecordEditedIntegrationEvent"/> (US-015, ADR-0032). Enrollments
/// publishes the fact that a cursada went back to in-progress; Reviews decides what that means for
/// the review anchored to it, which is that it can no longer stay published: it describes a cursada
/// that, as far as the record now says, has not finished.
///
/// <para>
/// The quarantine reason is <c>EnrollmentChanged</c>, not <c>Reports</c>, and that difference is the
/// whole point: per the 2026-07-29 revision of ADR-0012 only a reports quarantine blocks editing, so
/// the author can fix the review (or the cursada) and get it back out. Nobody reported this review.
/// </para>
///
/// <para>
/// No-ops when there is no review for that enrollment, or when the review is not Published. That
/// makes duplicate and out-of-order deliveries harmless, which matters because the outbox guarantees
/// at-least-once and not exactly-once.
/// </para>
/// </summary>
public static class EnrollmentRecordEditedHandler
{
    public static async Task Handle(
        EnrollmentRecordEditedIntegrationEvent message,
        IReviewRepository reviews,
        IReviewAuditLogRepository auditLog,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var review = await reviews.FindByEnrollmentIdAsync(message.EnrollmentRecordId, ct);
        if (review is null)
        {
            return;
        }

        var quarantined = review.QuarantineByEnrollmentChange(clock);
        if (!quarantined)
        {
            return;
        }

        var changesJson = JsonSerializer.Serialize(new
        {
            reason = "enrollment_changed",
            previousStatus = message.PreviousStatus,
            newStatus = message.NewStatus,
        });

        // El actor es el propio autor: la edición de la cursada la hizo él, y el aggregate ya sabe
        // quién es, así que no hace falta que el evento cargue el userId (que además es de Identity,
        // no de Enrollments, que solo conoce el StudentProfileId).
        var entry = ReviewAuditLog.Record(
            review.Id,
            ReviewAuditAction.Edited,
            changesJson,
            review.AuthorUserId,
            clock.UtcNow);
        auditLog.Add(entry);

        await unitOfWork.SaveChangesAsync(ct);
    }
}
