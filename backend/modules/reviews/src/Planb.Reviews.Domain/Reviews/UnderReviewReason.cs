namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Por qué una reseña está en <see cref="ReviewStatus.UnderReview"/>. Persiste como text via EF
/// <c>HasConversion&lt;string&gt;</c> (mismo patrón que <see cref="ReviewStatus"/> y
/// <see cref="ReviewDeletedReason"/>) para que agregar un valor no rompa migraciones.
///
/// <para>
/// Reemplaza al bool <c>QuarantinedByContentFilter</c>, que solo alcanzaba a distinguir dos
/// causas y no dejaba lugar para la tercera: una reseña invalidada porque la cursada que la
/// respalda cambió (ADR-0063). El invariante del aggregate es
/// <c>Review.Status == ReviewStatus.UnderReview</c> si y solo si
/// <c>Review.UnderReviewReason is not null</c>.
/// </para>
///
/// <list type="bullet">
///   <item><c>ContentFilter</c>: el filtro de contenido la frenó al publicar (US-017) o al
///         editar (US-018).</item>
///   <item><c>Reports</c>: los reports abiertos cruzaron el threshold (US-019).</item>
///   <item><c>EnrollmentChanged</c>: el <c>EnrollmentRecord</c> que la respalda cambió de forma
///         destructiva (ADR-0063). Sin escritor todavía: el modelo ya lo representa, pero el
///         consumer cross-BC que lo dispara no está implementado.</item>
/// </list>
/// </summary>
public enum UnderReviewReason
{
    ContentFilter,
    Reports,
    EnrollmentChanged,
}
