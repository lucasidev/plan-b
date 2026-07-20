using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class PrerequisiteRepository : IPrerequisiteRepository
{
    private readonly AcademicDbContext _db;
    public PrerequisiteRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(Prerequisite prerequisite, CancellationToken ct = default)
    {
        _db.Prerequisites.Add(prerequisite);
        return Task.CompletedTask;
    }

    public void Remove(Prerequisite prerequisite) => _db.Prerequisites.Remove(prerequisite);

    /// <summary>
    /// La tabla de correlativas no tiene career_plan_id propio (ver IPrerequisiteRepository), así
    /// que resolvemos el plan con un join contra subjects. Ambas materias son del mismo plan por
    /// invariante, así que alcanza con joinear por subject_id.
    /// </summary>
    public async Task<IReadOnlyList<Prerequisite>> GetByPlanAsync(
        CareerPlanId careerPlanId, CancellationToken ct = default)
    {
        var query =
            from p in _db.Prerequisites
            join s in _db.Subjects on p.SubjectId equals s.Id
            where s.CareerPlanId == careerPlanId
            select p;

        return await query.ToListAsync(ct);
    }

    public Task<Prerequisite?> FindAsync(
        SubjectId subjectId,
        SubjectId requiredSubjectId,
        PrerequisiteType type,
        CancellationToken ct = default) =>
        _db.Prerequisites.FirstOrDefaultAsync(
            p => p.SubjectId == subjectId && p.RequiredSubjectId == requiredSubjectId && p.Type == type,
            ct);

    public async Task<IReadOnlyList<Prerequisite>> GetDependentsAsync(
        SubjectId requiredSubjectId, CancellationToken ct = default) =>
        await _db.Prerequisites
            .Where(p => p.RequiredSubjectId == requiredSubjectId)
            .ToListAsync(ct);
}
