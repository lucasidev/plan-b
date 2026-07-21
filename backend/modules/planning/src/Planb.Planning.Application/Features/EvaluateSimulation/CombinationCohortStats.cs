namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Cuántos otros alumnos cursaron exactamente este mismo conjunto de materias en un mismo
/// período, y cómo les fue (US-016). "Exactamente" es match exacto del subject set: mismos ids,
/// sin importar orden (ver <c>DapperSimulatorEvaluationReader</c>).
///
/// <para>
/// Con el corpus actual esto va a dar <see cref="SampleSize"/> 0 o 1 la mayoría de las veces: es
/// una limitación de datos documentada en la US, no un bug. Por eso las tasas viajan como
/// <c>double?</c>: sin muestra, "no sabemos" y no "0%" (que insinuaría que a todos les fue mal).
/// </para>
/// </summary>
/// <param name="SampleSize">
/// Cuántos (alumno, período) cursaron exactamente este combo, excluyendo al alumno que simula.
/// </param>
/// <param name="PassRate">
/// % (escala 0-100, mismo criterio que <c>SubjectPassRate</c> de Enrollments y
/// <c>RecommendPercentage</c> de Reviews) de esas cursadas que terminaron en estado Aprobada.
/// Null si <see cref="SampleSize"/> es 0.
/// </param>
/// <param name="DropoutRate">
/// % (escala 0-100) que terminaron en estado Abandonada. Null si <see cref="SampleSize"/> es 0.
/// </param>
public sealed record CombinationCohortStats(int SampleSize, double? PassRate, double? DropoutRate);
