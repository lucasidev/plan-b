namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Estado de una Review per data-model. Persiste como text via EF
/// <c>HasConversion&lt;string&gt;</c> para que las migraciones no rompan si agregamos un
/// valor nuevo.
///
/// <list type="bullet">
///   <item><c>Published</c>: visible en feed público. Estado por default cuando el filter
///         de contenido (<c>IReviewContentFilter</c>) marca clean al crear.</item>
///   <item><c>UnderReview</c>: oculta del feed público, esperando decision de moderator.
///         Se entra acá por dos caminos: (a) el filter de contenido marcó triggered al
///         crear o al editar (US-018), (b) los reports open superan el threshold (US-019).</item>
///   <item><c>Removed</c>: moderator decidió que viola política. No vuelve a feed.</item>
///   <item><c>Deleted</c>: soft delete por el autor (US-055). Mantenemos el row para
///         audit + cascade de TeacherResponse, pero no aparece en lecturas.</item>
/// </list>
/// </summary>
public enum ReviewStatus
{
    Published,
    UnderReview,
    Removed,
    Deleted,
}
