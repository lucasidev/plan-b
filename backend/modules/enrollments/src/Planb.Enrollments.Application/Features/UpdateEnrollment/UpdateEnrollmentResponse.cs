namespace Planb.Enrollments.Application.Features.UpdateEnrollment;

/// <summary>
/// La cursada como quedó. <c>Changed</c> en false significa que el payload era idéntico a lo que ya
/// estaba guardado: el request fue un no-op, no se selló <c>UpdatedAt</c> y no se emitió ningún
/// evento. Viaja explícito para que el cliente no tenga que deducirlo comparando timestamps.
/// </summary>
public sealed record UpdateEnrollmentResponse(
    Guid Id,
    Guid StudentProfileId,
    Guid SubjectId,
    Guid? CommissionId,
    Guid? TermId,
    string Status,
    string? ApprovalMethod,
    decimal? Grade,
    DateTimeOffset UpdatedAt,
    bool Changed);
