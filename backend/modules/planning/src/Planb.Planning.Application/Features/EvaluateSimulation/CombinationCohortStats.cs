namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Cuántos otros alumnos cursaron exactamente este mismo conjunto de materias en un mismo
/// período, y cómo les fue (US-016). "Exactamente" es match exacto del subject set: mismos ids,
/// sin importar orden (ver <c>DapperSimulatorEvaluationReader</c>).
///
/// <para>
/// Con el corpus actual esto va a dar <see cref="SampleSize"/> 0, 1 o 2 la mayoría de las veces:
/// es una limitación de datos documentada en la US, no un bug. Por eso las tasas viajan como
/// <c>double?</c>: sin muestra, "no sabemos" y no "0%" (que insinuaría que a todos les fue mal).
/// </para>
///
/// <para>
/// <b>Gate de muestra mínima (ADR-0047, extendido a esta feature por decisión explícita del
/// dueño del proyecto):</b> con <see cref="SampleSize"/> menor a
/// <c>DapperSimulatorEvaluationReader.MinSampleSize</c> (5), <see cref="PassRate"/> y
/// <see cref="DropoutRate"/> van <c>null</c> aunque haya 1 o más alumnos en la cohorte.
/// <see cref="SampleSize"/> sí se muestra siempre (es informativo y no identifica a nadie). El
/// riesgo acá es más agudo que en el pass-rate público de una materia (ADR-0047 original): al
/// agrupar por combo EXACTO de materias, las muestras van a ser casi siempre 1 o 2, que es
/// justo el peor caso de re-identificación ("1 alumno cursó este combo y lo abandonó" es
/// atribuible en una carrera chica: quien consulta sabe quiénes cursaron con él).
/// </para>
/// </summary>
/// <param name="SampleSize">
/// Cuántos (alumno, período) cursaron exactamente este combo, excluyendo al alumno que simula.
/// Siempre presente, incluso cuando las tasas están gateadas a null.
/// </param>
/// <param name="PassRate">
/// % (escala 0-100, mismo criterio que <c>SubjectPassRate</c> de Enrollments y
/// <c>RecommendPercentage</c> de Reviews) de esas cursadas que terminaron en estado Aprobada.
/// Null si <see cref="SampleSize"/> es 0, o si es menor al piso anti-reidentificación (ver arriba).
/// </param>
/// <param name="DropoutRate">
/// % (escala 0-100) que terminaron en estado Abandonada. Mismas condiciones de null que
/// <see cref="PassRate"/>.
/// </param>
public sealed record CombinationCohortStats(int SampleSize, double? PassRate, double? DropoutRate);
