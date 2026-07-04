namespace Planb.Reviews.Application.Features.EditTeacherResponse;

/// <summary>Respuesta de PATCH /api/reviews/{id}/teacher-response (US-041): el texto ya editado.</summary>
public sealed record EditTeacherResponseResponse(
    Guid ReviewId, Guid TeacherId, string Text, DateTimeOffset UpdatedAt);
