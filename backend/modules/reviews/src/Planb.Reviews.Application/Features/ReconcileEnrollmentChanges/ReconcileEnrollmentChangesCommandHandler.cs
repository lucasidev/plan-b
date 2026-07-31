using System.Text.Json;
using Planb.Enrollments.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.AuditLog;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.ReconcileEnrollmentChanges;

/// <summary>
/// Handler del barrido de reconciliación (US-015). Para cada reseña publicada le pregunta a
/// Enrollments en qué estado quedó su cursada; si volvió a estar en curso, aplica la misma
/// cuarentena que habría aplicado el consumer del evento.
///
/// <para>
/// La dirección de la pregunta no es casual: Reviews ya referencia a Enrollments porque la reseña
/// se ancla a la cursada (ADR-0005), así que preguntar para este lado es gratis. Al revés cerraría
/// un ciclo de assemblies.
/// </para>
///
/// <para>
/// Una consulta por reseña en vez de un join: el join cruzaría schemas, que es lo que ADR-0017
/// prohíbe. Con el volumen de hoy y un barrido que corre a mano, el costo es irrelevante; si algún
/// día pesa, la salida es un endpoint batch en el contrato de Enrollments, no un join.
/// </para>
///
/// <para>
/// Es idempotente: correrlo dos veces seguidas no cambia nada la segunda vez, porque
/// <c>QuarantineByEnrollmentChange</c> es no-op sobre una reseña que ya no está publicada.
/// </para>
/// </summary>
public static class ReconcileEnrollmentChangesCommandHandler
{
    public static async Task<Result<ReconcileEnrollmentChangesResponse>> Handle(
        ReconcileEnrollmentChangesCommand command,
        IReviewRepository reviews,
        IReviewAuditLogRepository auditLog,
        IReviewsUnitOfWork unitOfWork,
        IEnrollmentsQueryService enrollments,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var published = await reviews.ListPublishedAsync(ct);

        var quarantined = 0;
        var orphaned = 0;

        foreach (var review in published)
        {
            var enrollment = await enrollments.GetEnrollmentByIdAsync(review.EnrollmentId, ct);

            if (enrollment is null)
            {
                // Referencia rota, no una cursada reabierta. Cuarentenar acá taparía un problema
                // distinto bajo el mismo estado, así que solo se cuenta.
                orphaned++;
                continue;
            }

            if (enrollment.Status != EnrollmentStatusSnapshot.InProgress)
            {
                continue;
            }

            if (!review.QuarantineByEnrollmentChange(clock))
            {
                continue;
            }

            var changesJson = JsonSerializer.Serialize(new
            {
                reason = "enrollment_changed",
                detectedBy = "reconciliation",
            });

            auditLog.Add(ReviewAuditLog.Record(
                review.Id,
                ReviewAuditAction.Edited,
                changesJson,
                review.AuthorUserId,
                clock.UtcNow));

            quarantined++;
        }

        if (quarantined > 0)
        {
            await unitOfWork.SaveChangesAsync(ct);
        }

        return new ReconcileEnrollmentChangesResponse(published.Count, quarantined, orphaned);
    }
}
