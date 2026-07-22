using Microsoft.Extensions.Logging;
using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Enrollments.Application.Seeding;

/// <summary>
/// Materializa las cursadas finalizadas que anclan las reseñas de prueba (una por reseña). El
/// publish de reseñas solo rechaza el status <c>Cursando</c>, así que las cursadas de prueba van
/// Aprobadas por Final (con grade, commission y term), que es lo más representativo de "ya cursé,
/// ahora reseño".
///
/// Pasa por el factory <see cref="EnrollmentRecord.Create"/> (valida las invariantes del
/// data-model), no por SQL crudo. Devuelve <c>Key → enrollmentId</c> para que el seeder de
/// reseñas ancle cada una.
/// </summary>
public sealed class EnrollmentsSeeder
{
    private readonly IEnrollmentRecordRepository _records;
    private readonly IEnrollmentsUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<EnrollmentsSeeder> _log;

    public EnrollmentsSeeder(
        IEnrollmentRecordRepository records,
        IEnrollmentsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        ILogger<EnrollmentsSeeder> log)
    {
        _records = records;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _log = log;
    }

    public async Task<IReadOnlyDictionary<string, Guid>> SeedAsync(
        IReadOnlyList<EnrollmentSpec> specs, CancellationToken ct = default)
    {
        var result = new Dictionary<string, Guid>();
        var created = 0;

        foreach (var spec in specs)
        {
            var createResult = EnrollmentRecord.Create(
                spec.StudentProfileId,
                spec.SubjectId,
                spec.CommissionId,
                spec.TermId,
                spec.Status,
                spec.ApprovalMethod,
                spec.Grade,
                _clock);

            if (createResult.IsFailure)
            {
                _log.LogWarning("Seed enrollment {Key} invalid: {Error}", spec.Key, createResult.Error.Code);
                continue;
            }

            var record = createResult.Value;
            await _records.AddAsync(record, ct);
            result[spec.Key] = record.Id.Value;
            created++;
        }

        if (created > 0)
        {
            await _unitOfWork.SaveChangesAsync(ct);
            _log.LogInformation("Seeded {Count} seed enrollments.", created);
        }

        return result;
    }
}

/// <summary>Spec plano de una cursada de prueba. <c>Key</c> es el de la reseña que va a anclar.</summary>
public sealed record EnrollmentSpec(
    string Key,
    Guid StudentProfileId,
    Guid SubjectId,
    Guid CommissionId,
    Guid TermId,
    EnrollmentStatus Status,
    ApprovalMethod? ApprovalMethod,
    decimal? Grade);
