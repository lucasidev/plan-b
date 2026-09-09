namespace Planb.Academic.Domain.OfficialFacts;

/// <summary>
/// Lo mínimo para decidir cuál de varias afirmaciones sobre el mismo sujeto y campo es la vigente
/// (ADR-0090). El aggregate <see cref="OfficialFact"/> lo implementa, y también lo implementa
/// cualquier fila de un read Dapper: así <see cref="OfficialFactCurrency.SelectCurrent{T}"/> corre
/// igual en el dominio (testeado sin base) y en la lectura (sin duplicar el criterio en el SQL).
/// </summary>
public interface IRelievedClaim
{
    /// <summary>Cuándo se relevó el dato (lo declara quien carga la afirmación), distinto de cuándo se guardó la fila.</summary>
    DateTimeOffset RelievedAt { get; }

    /// <summary>Cuándo se insertó la fila. Desempata cuando dos afirmaciones comparten <see cref="RelievedAt"/>.</summary>
    DateTimeOffset CreatedAt { get; }
}
