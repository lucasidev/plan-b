namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// Fila del listado admin de períodos lectivos de una universidad. Record property-init (no
/// posicional): Dapper mapea por nombre de columna.
/// </summary>
public sealed record AdminAcademicTermListItem
{
    public Guid Id { get; init; }
    public int Year { get; init; }
    public int Number { get; init; }
    public string Kind { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
}
