namespace Planb.Academic.Application.Abstractions.Persistence;

/// <summary>
/// UoW boundary del módulo Academic. US-088 lo introduce porque hasta ahora Academic era
/// read-only para callers fuera del seeder. Mismo pattern que IEnrollmentsUnitOfWork.
/// </summary>
public interface IAcademicUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
