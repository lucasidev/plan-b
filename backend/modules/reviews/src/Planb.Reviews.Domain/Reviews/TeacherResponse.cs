using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Respuesta de un docente verificado a una reseña sobre él (US-040). Child entity de
/// <see cref="Review"/>: una sola por reseña, su lifecycle vive dentro del aggregate Review (no
/// tiene identidad de aggregate propia). A diferencia del autor de la reseña (anónimo, ADR-0009),
/// el docente que responde aparece con su nombre: esa visibilidad es lo que lo motiva a responder.
///
/// <para>
/// <see cref="TeacherId"/> es el docente que respondió (cross-BC, raw Guid); coincide con el
/// <c>docente_reseñado_id</c> de la reseña. La autorización (que ese user sea un TeacherProfile
/// verificado de ese docente) la valida el handler vía <c>IIdentityQueryService</c> antes de invocar
/// <see cref="Review.Respond"/>.
/// </para>
/// </summary>
public sealed class TeacherResponse : Entity<TeacherResponseId>
{
    public Guid TeacherId { get; private set; }
    public ReviewText Text { get; private set; }
    public TeacherResponseStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private TeacherResponse() { }

    internal TeacherResponse(
        TeacherResponseId id, Guid teacherId, ReviewText text, DateTimeOffset now)
    {
        Id = id;
        TeacherId = teacherId;
        Text = text;
        Status = TeacherResponseStatus.Published;
        CreatedAt = now;
        UpdatedAt = now;
    }
}
