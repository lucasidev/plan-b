using Planb.Enrollments.Application.Seeding;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Contracts;
using Planb.Identity.Application.Seeding;
using Planb.Identity.Domain.Users;
using Planb.Reviews.Application.Seeding;

namespace Planb.Api.Infrastructure.SeedCorpus;

/// <summary>
/// Orquesta el seed del corpus de prueba de reseñas en el arranque del host. Cruza tres módulos
/// (identity, enrollments, reviews) threadeando los IDs que cada seeder materializa: autores ->
/// sus profileIds -> cursadas -> sus enrollmentIds -> reseñas + votos.
///
/// Gating doble:
/// <list type="bullet">
///   <item><see cref="IHostEnvironment.IsDevelopment"/>: solo en dev.</item>
///   <item>env var <c>PLANB_SEED_CORPUS</c> (default off): SOLO lo prende <c>just dev</c>. Los
///         integration tests corren en Development pero NO setean el flag, así sus DBs quedan
///         limpias y los asserts de conteo no se rompen. Es la separación clave del diseño.</item>
/// </list>
///
/// Idempotencia gruesa (all-or-nothing): si el primer autor de prueba ya existe, el corpus ya se
/// seedeó y se saltea entero. Un fallo no tumba el host (mismo criterio que los otros seeders):
/// se loguea y el dev server sigue.
/// </summary>
public sealed class SeedCorpusHostedService : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly ILogger<SeedCorpusHostedService> _log;

    public SeedCorpusHostedService(
        IServiceProvider sp,
        IHostEnvironment env,
        IConfiguration config,
        ILogger<SeedCorpusHostedService> log)
    {
        _sp = sp;
        _env = env;
        _config = config;
        _log = log;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        if (!_env.IsDevelopment() || !IsEnabled())
        {
            return;
        }

        try
        {
            await SeedAsync(ct);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Seed corpus failed; continuing without it.");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;

    private bool IsEnabled()
    {
        var flag = _config["PLANB_SEED_CORPUS"];
        return string.Equals(flag, "1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(flag, "true", StringComparison.OrdinalIgnoreCase);
    }

    private async Task SeedAsync(CancellationToken ct)
    {
        using var scope = _sp.CreateScope();
        var sp = scope.ServiceProvider;

        // Gate all-or-nothing.
        var users = sp.GetRequiredService<IUserRepository>();
        var firstEmail = EmailAddress.Create(SeedCorpusData.Authors[0].Email);
        if (firstEmail.IsSuccess && await users.ExistsByEmailAsync(firstEmail.Value, ct))
        {
            _log.LogInformation("Seed corpus already seeded; skipping.");
            return;
        }

        var authorsSeeder = sp.GetRequiredService<AuthorsSeeder>();
        var enrollmentsSeeder = sp.GetRequiredService<EnrollmentsSeeder>();
        var reviewsSeeder = sp.GetRequiredService<ReviewsSeeder>();

        // 1) Autores -> profileIds. Incluye los autores de fallas (solo Reprobada/Abandonada, sin
        // reseña), que alimentan el denominador del pass-rate; perfiles distintos de los de reseñas.
        var authorSpecs = SeedCorpusData.Authors
            .Concat(SeedCorpusData.FailureAuthors)
            .Select(a => new AuthorSpec(
                a.Key,
                a.Email,
                $"seed-{a.Key}-2026",
                SeedCorpusData.TudcsPlanId,
                SeedCorpusData.TudcsCareerId,
                a.EnrollmentYear))
            .ToList();
        var authors = await authorsSeeder.SeedAsync(authorSpecs, ct);

        // 2) Cursadas (una por reseña cuyo autor se materializó) -> enrollmentIds.
        var seedableReviews = SeedCorpusData.Reviews
            .Where(r => authors.ContainsKey(r.AuthorKey))
            .ToList();
        var enrollmentSpecs = seedableReviews
            .Select(r => new EnrollmentSpec(
                r.Key,
                authors[r.AuthorKey].ProfileId,
                r.SubjectId,
                SeedCorpusData.SeedCommissionId,
                r.TermId,
                EnrollmentStatus.Passed,
                ApprovalMethod.FinalExam,
                r.Grade))
            .ToList();

        // Cursadas sin aprobar (Reprobada/Abandonada, sin reseña): denominador del pass-rate
        // (ADR-0047). approval_method y grade van null (lo exige el CHECK del aggregate).
        var failureSpecs = SeedCorpusData.Failures
            .Where(f => authors.ContainsKey(f.AuthorKey))
            .Select(f => new EnrollmentSpec(
                f.Key,
                authors[f.AuthorKey].ProfileId,
                f.SubjectId,
                SeedCorpusData.SeedCommissionId,
                f.TermId,
                f.IsAbandoned ? EnrollmentStatus.Dropped : EnrollmentStatus.Failed,
                null,
                null))
            .ToList();

        // Cursada reseñable interactiva de Lucía (sin reseña): se le ancla a la comisión "A" real de
        // 111 Desarrollo de Software para que pueda elegir un docente real al reseñar. Lucía la
        // siembra el IdentitySeeder antes que este hosted service; si no tiene profile (caso raro),
        // se saltea sin romper.
        var identityQuery = sp.GetRequiredService<IIdentityQueryService>();
        var luciaSpecs = await BuildLuciaPendingSpecAsync(users, identityQuery, ct);

        var enrollments = await enrollmentsSeeder.SeedAsync(
            [.. enrollmentSpecs, .. failureSpecs, .. luciaSpecs], ct);

        // 3) Reseñas (ancladas a las cursadas) + votos entre autores.
        var reviewSpecs = seedableReviews
            .Where(r => enrollments.ContainsKey(r.Key))
            .Select(r => new ReviewSpec(
                r.Key,
                enrollments[r.Key],
                SeedCorpusData.TeacherForSubject(r.SubjectId),
                r.Difficulty,
                r.Overall,
                r.Hours,
                r.Tags,
                r.Recommend,
                r.Retake,
                r.Text,
                r.Grade,
                r.DaysAgo))
            .ToList();
        var voteSpecs = SeedCorpusData.BuildVotes()
            .Where(v => authors.ContainsKey(v.VoterKey) && enrollments.ContainsKey(v.ReviewKey))
            .Select(v => new VoteSpec(authors[v.VoterKey].UserId, v.ReviewKey, v.IsHelpful))
            .ToList();
        await reviewsSeeder.SeedAsync(reviewSpecs, voteSpecs, ct);

        _log.LogInformation(
            "Seed corpus seeded: {Authors} authors, {Reviews} reviews, {Votes} votes, {Failures} failed enrollments.",
            authors.Count, reviewSpecs.Count, voteSpecs.Count, failureSpecs.Count);
    }

    private static async Task<IReadOnlyList<EnrollmentSpec>> BuildLuciaPendingSpecAsync(
        IUserRepository users, IIdentityQueryService identity, CancellationToken ct)
    {
        var email = EmailAddress.Create(SeedCorpusData.LuciaEmail);
        if (email.IsFailure)
        {
            return [];
        }

        var user = await users.FindByEmailAsync(email.Value, ct);
        if (user is null)
        {
            return [];
        }

        var profile = await identity.GetStudentProfileForUserAsync(user.Id.Value, ct);
        if (profile is null)
        {
            return [];
        }

        return
        [
            new EnrollmentSpec(
                SeedCorpusData.LuciaPendingKey,
                profile.Id,
                SeedCorpusData.LuciaPendingSubjectId,
                SeedCorpusData.LuciaPendingCommissionId,
                SeedCorpusData.LuciaPendingTermId,
                EnrollmentStatus.Passed,
                ApprovalMethod.FinalExam,
                9m),
        ];
    }
}
