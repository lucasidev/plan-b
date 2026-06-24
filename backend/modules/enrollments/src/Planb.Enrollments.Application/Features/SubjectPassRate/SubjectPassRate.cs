namespace Planb.Enrollments.Application.Features.SubjectPassRate;

/// <summary>
/// Aprobación histórica de una materia (ADR-0047). <see cref="PassRate"/> es el porcentaje (0-100)
/// de aprobación entre las cursadas con verdicto, o <c>null</c> si la muestra es menor al gate
/// mínimo (anti re-identificación). <see cref="SampleSize"/> es ese denominador (aprobadas no
/// equivalencia + reprobadas), siempre presente para el disclaimer y el estado "datos insuficientes".
/// </summary>
public sealed record SubjectPassRate(double? PassRate, int SampleSize);
