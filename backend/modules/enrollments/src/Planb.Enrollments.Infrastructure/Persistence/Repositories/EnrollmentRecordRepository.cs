using Microsoft.EntityFrameworkCore;
using Planb.Enrollments.Domain.EnrollmentRecords;

namespace Planb.Enrollments.Infrastructure.Persistence.Repositories;

internal sealed class EnrollmentRecordRepository : IEnrollmentRecordRepository
{
    private readonly EnrollmentsDbContext _db;

    public EnrollmentRecordRepository(EnrollmentsDbContext db) => _db = db;

    public Task AddAsync(EnrollmentRecord record, CancellationToken ct = default)
    {
        _db.EnrollmentRecords.Add(record);
        return Task.CompletedTask;
    }

    public Task<EnrollmentRecord?> GetByIdAsync(
        EnrollmentRecordId id, CancellationToken ct = default) =>
        _db.EnrollmentRecords.FirstOrDefaultAsync(e => e.Id == id, ct);

    public Task<bool> ExistsAsync(
        Guid studentProfileId, Guid subjectId, Guid? termId, CancellationToken ct = default) =>
        _db.EnrollmentRecords
            .AsNoTracking()
            .AnyAsync(
                e => e.StudentProfileId == studentProfileId
                  && e.SubjectId == subjectId
                  && e.TermId == termId,
                ct);
}
