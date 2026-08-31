namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Con qué otras materias se llevó una, y cómo les fue a los que las llevaron juntas (US-143).
///
/// <para>
/// Es el dato que la lapicera no puede calcular. Armar el horario lo resuelve cualquiera en quince
/// minutos; saber que 18 de 40 dejaron una de las dos no lo resuelve nadie solo.
/// </para>
///
/// <para>
/// No le pide nada a nadie: sale de lo que las reseñas ya traen. Dos reseñas de la misma cuenta en
/// el mismo período son dos materias llevadas juntas, y el desenlace que cada una guarda dice quién
/// dejó alguna. Por eso el read cuenta y no decide: el piso y qué se publica los resuelve el
/// dominio.
/// </para>
/// </summary>
public interface ISubjectPairQueryService
{
    Task<IReadOnlyList<SubjectPairTally>> ListForSubjectAsync(
        Guid subjectId, CancellationToken ct = default);
}

/// <summary>
/// Un par de materias en un período, con lo que la base contó.
///
/// <para>
/// <paramref name="DroppedCount"/> son las cuentas donde <b>al menos una de las dos</b> no llegó al
/// final. Una cursada sin desenlace contestado no cuenta como dejada: saltear vale, y tratar el
/// silencio como abandono inventaría el dato que el producto promete no inventar.
/// </para>
/// </summary>
public sealed record SubjectPairTally(
    Guid OtherSubjectId,
    Guid TermId,
    int TogetherCount,
    int DroppedCount);
