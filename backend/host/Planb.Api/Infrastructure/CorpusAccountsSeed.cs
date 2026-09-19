using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Infrastructure.Seeding;
using Planb.Reviews.Application.Seeding;

namespace Planb.Api.Infrastructure;

/// <summary>El host compone los manifiestos de los tres módulos sin acoplarlos entre sí.</summary>
public static class CorpusAccountsSeed
{
    public static IReadOnlyList<CorpusAccount> Accounts()
    {
        var subjects = AcademicSeedData.Subjects.ToDictionary(s => s.Id.Value);
        var careers = AcademicSeedData.Careers.Where(c => c.Plan is not null)
            .ToDictionary(c => c.Plan!.Id.Value, c => c.Career.Id.Value);

        return CorpusSeedData.AccountSubjects.GroupBy(a => a.AccountIndex).Select(group =>
        {
            // Una cuenta tiene un solo perfil: mezclar planes en el corpus debe fallar al sembrar.
            var planId = group.Select(a => subjects[a.SubjectId].CareerPlanId.Value).Distinct().Single();
            return new CorpusAccount(
                CorpusSeedData.AccountId(group.Key),
                $"estudiante.{group.Key:D4}@corpus.planb.invalid",
                planId,
                careers[planId],
                new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero).AddDays(group.Key % 365));
        }).ToArray();
    }

    public static Task SeedAsync(IServiceProvider services, CancellationToken ct = default) =>
        services.GetRequiredService<CorpusAccountSeeder>().SeedAsync(Accounts(), ct);
}
