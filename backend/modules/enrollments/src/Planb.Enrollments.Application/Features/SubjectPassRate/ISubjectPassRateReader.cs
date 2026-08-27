namespace Planb.Enrollments.Application.Features.SubjectPassRate;

/// <summary>
/// Read-side de la aprobación histórica de una materia (funcionalidad de la versión anterior del
/// producto, en retiro: ADR-0063). Agrega el historial privado de
/// enrollments en un stat público, anonimizado y gateado. El gate de muestra mínima se aplica en el
/// read (devuelve <c>PassRate=null</c> si N &lt; umbral) para que la UI no conozca el umbral.
/// </summary>
public interface ISubjectPassRateReader
{
    Task<SubjectPassRate> GetForSubjectAsync(Guid subjectId, CancellationToken ct = default);
}
