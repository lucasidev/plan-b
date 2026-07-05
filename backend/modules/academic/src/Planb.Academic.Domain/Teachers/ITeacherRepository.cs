namespace Planb.Academic.Domain.Teachers;

/// <summary>
/// Write-side del aggregate <see cref="Teacher"/> (US-063, admin CRUD). Los reads del catálogo van
/// por el query service Dapper (público) o el reader del backoffice (admin); este repo es solo para
/// cargar el aggregate a mutar y agregarlo. El SaveChanges lo hace el <c>IAcademicUnitOfWork</c>.
/// </summary>
public interface ITeacherRepository
{
    Task AddAsync(Teacher teacher, CancellationToken ct = default);

    /// <summary>Carga el aggregate por id para editar/desactivar/reactivar. Null si no existe.</summary>
    Task<Teacher?> GetByIdAsync(TeacherId id, CancellationToken ct = default);
}
