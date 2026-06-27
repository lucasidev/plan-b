namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Estado de una <see cref="TeacherResponse"/> (US-040). Hoy solo <see cref="Published"/>: la
/// respuesta es pública apenas se crea (el docente está identificado con su nombre real, hay
/// accountability, no pasa por content filter). <see cref="Removed"/> queda reservado para cuando
/// moderación pueda bajar una respuesta abusiva (no implementado todavía).
/// </summary>
public enum TeacherResponseStatus
{
    Published,
    Removed,
}
