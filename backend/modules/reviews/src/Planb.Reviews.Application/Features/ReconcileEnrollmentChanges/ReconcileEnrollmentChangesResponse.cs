namespace Planb.Reviews.Application.Features.ReconcileEnrollmentChanges;

/// <summary>
/// Qué encontró y qué corrigió el barrido.
///
/// <para>
/// <c>Quarantined</c> en cero es el resultado sano y el que se espera casi siempre: significa que
/// el evento de edición viene llegando bien. Un número distinto de cero no es solo trabajo hecho,
/// es la señal de que hubo entregas perdidas y de que conviene mirar el dead-letter de Wolverine.
/// </para>
///
/// <para>
/// <c>OrphanedEnrollments</c> cuenta las reseñas publicadas cuya cursada Enrollments no encuentra.
/// No se tocan: una referencia rota no es lo mismo que una cursada que volvió a en curso, y
/// silenciarla cuarentenando la reseña taparía un problema distinto. Se informa para que se vea.
/// </para>
/// </summary>
public sealed record ReconcileEnrollmentChangesResponse(
    int PublishedReviewsChecked,
    int Quarantined,
    int OrphanedEnrollments);
