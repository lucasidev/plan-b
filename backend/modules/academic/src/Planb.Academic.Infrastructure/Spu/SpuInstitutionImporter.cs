using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Infrastructure.Persistence;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Academic.Infrastructure.Spu;

public sealed class SpuInstitutionImporter(AcademicDbContext db, IDateTimeProvider clock)
{
    private static readonly Guid RelievedBy = Guid.Parse("00000000-0000-4000-a000-000000000001");

    public async Task<int> ImportAsync(CancellationToken ct = default)
    {
        var snapshot = SpuInstitutionSnapshot.Load().ToDictionary(x => x.Institution, StringComparer.OrdinalIgnoreCase);
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var universities = await db.Universities.AsNoTracking().ToListAsync(ct);
        var existing = (await db.OfficialFacts.AsNoTracking()
            .Where(f => f.SubjectType == OfficialFactSubjectType.Institution)
            .Select(f => new { f.SubjectId, f.Field }).ToListAsync(ct))
            .Select(f => (f.SubjectId, f.Field)).ToHashSet();
        var count = 0;
        foreach (var university in universities)
        {
            snapshot.TryGetValue(university.Name, out var identity);
            var note = identity is null
                ? "Sin correspondencia institucional verificada en el Anuario SPU 2022. No se atribuyen cifras por parecido de nombre."
                : $"Pregrado y grado, institución completa. Identidad SPU: {identity.SourceGroup}, {identity.SourceName}. No desagrega por sede ni carrera.";
            Add(OfficialFactField.InstitutionType, identity?.Sector == "Estatal" ? "Pública" : identity is null ? null : "Privada", null);
            Add(OfficialFactField.Students, identity?.Students?.ToString(CultureInfo.InvariantCulture), "students");
            Add(OfficialFactField.Graduates, identity?.Graduates?.ToString(CultureInfo.InvariantCulture), "graduates");

            void Add(string field, string? value, string? unit)
            {
                // El catálogo curado y sus estados Requested/NotPublished también son decisiones: no se pisan.
                if (!existing.Add((university.Id.Value, field))) return;
                var fact = OfficialFact.Create(OfficialFactSubjectType.Institution, university.Id.Value,
                    field, value is null ? OfficialFactStatus.NotPublished : OfficialFactStatus.Published,
                    value, unit, "2022", "SPU, Anuario de Estadísticas Universitarias 2022",
                    SpuInstitutionSnapshot.SourceUrl, "Capítulo 2, cuadros 2.1.1, 2.1.3, 2.2.1 y 2.2.3",
                    SpuInstitutionSnapshot.RetrievedAt, null, note, SpuInstitutionSnapshot.RetrievedAt,
                    RelievedBy, clock);
                if (fact.IsFailure) throw new InvalidDataException($"Invalid SPU fact: {fact.Error}");
                db.OfficialFacts.Add(fact.Value);
                count++;
            }
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return count;
    }
}
