namespace Planb.Enrollments.Domain.EnrollmentRecords;

/// <summary>
/// Estado del enrollment al momento del alta o edición. Refleja un hecho que reporta el alumno
/// (ADR-0004: enrollment guarda hechos, no estados derivados del grafo de correlativas).
///
/// <list type="bullet">
///   <item><see cref="Cursando"/>: cursándola ahora. Sin grade ni approval_method.</item>
///   <item><see cref="Regular"/>: regularizó la cursada (asistencia + parciales OK) sin haber
///         rendido final. Lleva grade pero no approval_method (eso se setea cuando rinde).</item>
///   <item><see cref="Aprobada"/>: aprobada definitivamente. Lleva grade + approval_method.</item>
///   <item><see cref="Reprobada"/>: cursó pero no aprobó. Sin grade (final no rendido o
///         desaprobado en final, lo capturamos en el lifecycle, no acá).</item>
///   <item><see cref="Abandonada"/>: se anotó pero no terminó la cursada. Sin grade.</item>
/// </list>
/// </summary>
public enum EnrollmentStatus
{
    Cursando,
    Regular,
    Aprobada,
    Reprobada,
    Abandonada,
}
