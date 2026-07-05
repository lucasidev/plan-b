namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// Fila del listado admin de docentes. Record property-init (no posicional): Dapper mapea por
/// nombre de columna y tolera los nullables sin romper como haría un ctor posicional.
/// </summary>
public sealed record AdminTeacherListItem
{
    public Guid Id { get; init; }
    public Guid UniversityId { get; init; }
    public string UniversityName { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Title { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
