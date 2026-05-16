namespace Planb.Academic.Domain.Subjects;

/// <summary>
/// Repo de Subject. US-088 lo usa para Add en bloque al materializar el import. La lectura
/// existente sigue via DapperAcademicQueryService.
/// </summary>
public interface ISubjectRepository
{
    Task AddRangeAsync(IEnumerable<Subject> subjects, CancellationToken ct = default);
}
