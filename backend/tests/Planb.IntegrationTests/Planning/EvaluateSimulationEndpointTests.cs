using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Domain;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Planning;

/// <summary>
/// Tests de integración de US-016 (simulador, lado "evaluate"). Mismo patrón que
/// <see cref="GetAvailableSubjectsEndpointTests"/>: cada test arma su propia Career + CareerPlan +
/// Subjects vía <see cref="AcademicDbContext"/>, y crea correlativas / historial / reseñas a
/// través de los endpoints reales, no tocando la DB de Enrollments ni Reviews directo.
///
/// <para>
/// El plan real de TUDCS (seed de Academic) sí tiene correlativas (32, ver
/// <c>AcademicSeedData.Prerequisites</c>), así que el test de dificultad ponderada usa dos
/// materias puntuales sin correlativas propias (101 Algoritmos y Paradigmas, 121 Base de datos)
/// que además ya tienen Commission + Teacher sembrados (evita armar eso a mano solo para poder
/// publicar una reseña: <c>PublishReview</c> exige que el docente reseñado esté asignado a la
/// comisión de la cursada).
/// </para>
/// </summary>
public class EvaluateSimulationEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");

    // 101 Algoritmos y Paradigmas (TUDCS, sin correlativas propias): comisión + docente + term
    // sembrados en AcademicSeedData, necesarios para poder publicar una reseña sobre la cursada.
    private static readonly Guid Subject101 = Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid Commission101 = Guid.Parse("00000007-0000-4000-a000-000000000003");
    private static readonly Guid Teacher101 = Guid.Parse("00000006-0000-4000-a000-000000000002"); // iturralde
    private static readonly Guid Term101 = Guid.Parse("00000005-0000-4000-a000-000000000005"); // 2026·1c

    // 121 Base de datos (TUDCS, sin correlativas propias): idem, otra comisión/term de la seed.
    private static readonly Guid Subject121 = Guid.Parse("00000004-0000-4000-a000-000000000007");
    private static readonly Guid Commission121 = Guid.Parse("00000007-0000-4000-a000-000000000005");
    private static readonly Guid Teacher121 = Guid.Parse("00000006-0000-4000-a000-000000000007"); // méndez
    private static readonly Guid Term121 = Guid.Parse("00000005-0000-4000-a000-000000000004"); // 2025·2c

    private readonly RegisterApiFixture _fixture;

    public EvaluateSimulationEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin-evaluate.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    /// <summary>Crea un user autenticado + StudentProfile activo sobre <paramref name="careerPlanId"/>.</summary>
    private async Task<AuthenticatedClient> StudentAsync(Guid careerPlanId, string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"evaluate-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary>
    /// Arma una Career + CareerPlan propios (aislados del seed) con <paramref name="subjectCount"/>
    /// materias nuevas. Cada materia recibe horas distintas por índice (4/64, 5/80, 6/96, ...) para
    /// que sumar carga horaria sea una verificación real y no un múltiplo trivial de una constante.
    /// </summary>
    private async Task<(Guid PlanId, List<SubjectSeed> Subjects)> CreatePlanWithSubjectsAsync(int subjectCount)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

        var unique = Guid.NewGuid().ToString("N")[..8];
        var career = Career.Create(
            new UniversityId(Unsta),
            $"Carrera Evaluate {unique}",
            $"carrera-evaluate-{unique}",
            clock,
            isOfficial: true).Value;
        db.Careers.Add(career);

        var plan = CareerPlan.Create(career.Id, 2015, clock, isOfficial: true).Value;
        db.CareerPlans.Add(plan);

        var subjects = new List<SubjectSeed>();
        for (var i = 0; i < subjectCount; i++)
        {
            var code = $"EVA{i}-{unique}";
            var name = $"Materia Evaluate {i} {unique}";
            var weeklyHours = 4 + i;
            var totalHours = 64 + (i * 16);
            var subject = Subject.Create(
                plan.Id,
                code: code,
                name: name,
                yearInPlan: 1,
                termInYear: 1,
                termKind: TermKind.FourMonth,
                weeklyHours: weeklyHours,
                totalHours: totalHours,
                description: null,
                clock: clock,
                isOfficial: true).Value;
            db.Subjects.Add(subject);
            subjects.Add(new SubjectSeed(subject.Id.Value, code, name, weeklyHours, totalHours));
        }

        await db.SaveChangesAsync();

        return (plan.Id.Value, subjects);
    }

    private static Task<HttpResponseMessage> EvaluateAsync(AuthenticatedClient client, params Guid[] subjectIds) =>
        client.Client.PostAsJsonAsync("/api/me/simulator/evaluate", new { subjectIds });

    [Fact]
    public async Task Sums_weekly_and_total_hours_of_the_selected_subjects()
    {
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "hours");

        var response = await EvaluateAsync(student, subjects[0].Id, subjects[1].Id);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EvaluateSimulationResponseDto>();
        body.ShouldNotBeNull();
        body!.IsValid.ShouldBeTrue();
        body.TotalWeeklyHours.ShouldBe(subjects[0].WeeklyHours + subjects[1].WeeklyHours);
        body.TotalHours.ShouldBe(subjects[0].TotalHours + subjects[1].TotalHours);
    }

    [Fact]
    public async Task Rejects_combination_with_a_blocked_subject_and_reports_the_missing_prerequisite()
    {
        var admin = await AdminAsync();
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        // B requiere A para_cursar; el alumno no tiene historial, así que A queda Available y B
        // queda Blocked.
        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{b.Id}/prerequisites",
                new { requiredSubjectId = a.Id, type = "ToEnroll" }))
            .EnsureSuccessStatusCode();

        var student = await StudentAsync(planId, "blocked");

        var response = await EvaluateAsync(student, a.Id, b.Id);

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var body = await response.Content.ReadFromJsonAsync<EvaluateSimulationResponseDto>();
        body.ShouldNotBeNull();
        body!.IsValid.ShouldBeFalse();
        body.BlockedSubjects.ShouldHaveSingleItem();

        var blocked = body.BlockedSubjects[0];
        blocked.Id.ShouldBe(b.Id);
        blocked.Code.ShouldBe(b.Code);
        blocked.Name.ShouldBe(b.Name);
        blocked.BlockedBy.ShouldHaveSingleItem();
        blocked.BlockedBy[0].Id.ShouldBe(a.Id);
        blocked.BlockedBy[0].Code.ShouldBe(a.Code);
        blocked.BlockedBy[0].Name.ShouldBe(a.Name);
    }

    [Fact]
    public async Task Rejects_combination_when_a_subject_does_not_belong_to_the_students_plan()
    {
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(1);
        var (foreignPlanId, foreignSubjects) = await CreatePlanWithSubjectsAsync(1);
        _ = foreignPlanId;

        var student = await StudentAsync(planId, "foreign");

        var response = await EvaluateAsync(student, subjects[0].Id, foreignSubjects[0].Id);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulator.subject_not_in_plan");
    }

    [Fact]
    public async Task Weights_difficulty_by_review_count_not_by_simple_subject_average()
    {
        // 101 (Algoritmos y Paradigmas): 3 reseñas con dificultad 2. 121 (Base de datos): 1 reseña
        // con dificultad 5. Ponderado por cantidad: (2+2+2+5)/4 = 2.75. Un promedio simple de
        // promedios por materia daría (2+5)/2 = 3.5: si el test da 3.5 en vez de 2.75, la
        // ponderación está mal.
        await PublishReviewOnSeededSubjectAsync(
            Subject101, Commission101, Teacher101, Term101, difficulty: 2, label: "s101-a");
        await PublishReviewOnSeededSubjectAsync(
            Subject101, Commission101, Teacher101, Term101, difficulty: 2, label: "s101-b");
        await PublishReviewOnSeededSubjectAsync(
            Subject101, Commission101, Teacher101, Term101, difficulty: 2, label: "s101-c");
        await PublishReviewOnSeededSubjectAsync(
            Subject121, Commission121, Teacher121, Term121, difficulty: 5, label: "s121-a");

        var student = await StudentAsync(TudcsPlanId, "difficulty");

        var response = await EvaluateAsync(student, Subject101, Subject121);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EvaluateSimulationResponseDto>();
        body.ShouldNotBeNull();
        body!.IsValid.ShouldBeTrue();
        body.WeightedDifficulty.ShouldNotBeNull();
        body.WeightedDifficulty!.Value.ShouldBe(2.75, 0.001);
    }

    [Fact]
    public async Task Returns_null_difficulty_when_no_subject_has_reviews()
    {
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "noreviews");

        var response = await EvaluateAsync(student, subjects[0].Id);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EvaluateSimulationResponseDto>();
        body.ShouldNotBeNull();
        body!.WeightedDifficulty.ShouldBeNull();
    }

    [Fact]
    public async Task Returns_zero_sample_size_and_null_rates_when_nobody_took_the_exact_combination()
    {
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "nocohort");

        var response = await EvaluateAsync(student, subjects[0].Id, subjects[1].Id);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EvaluateSimulationResponseDto>();
        body.ShouldNotBeNull();
        body!.CombinationStats.SampleSize.ShouldBe(0);
        body.CombinationStats.PassRate.ShouldBeNull();
        body.CombinationStats.DropoutRate.ShouldBeNull();
    }

    [Fact]
    public async Task Hides_rates_when_sample_size_is_four_students()
    {
        // ADR-0047 extendido a /evaluate (decisión explícita del dueño del proyecto, no una
        // "optimización" mía): con menos de 5 alumnos en la cohorte, las tasas van null aunque
        // haya muestra. 4 < 5: sampleSize se ve, las tasas no.
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var s1 = subjects[0];
        var s2 = subjects[1];

        for (var i = 0; i < 4; i++)
        {
            await EnrollOtherStudentInComboAsync(planId, s1.Id, s2.Id, $"four-{i}", "Passed", "Passed");
        }

        var caller = await StudentAsync(planId, "four-caller");
        var response = await EvaluateAsync(caller, s1.Id, s2.Id);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EvaluateSimulationResponseDto>();
        body.ShouldNotBeNull();
        body!.CombinationStats.SampleSize.ShouldBe(4);
        body.CombinationStats.PassRate.ShouldBeNull();
        body.CombinationStats.DropoutRate.ShouldBeNull();
    }

    [Fact]
    public async Task Shows_rates_when_sample_size_reaches_five_students()
    {
        // Mismo combo que el test de "4 estudiantes", una muestra más: cruza el piso de ADR-0047
        // y las tasas dejan de ser null. 4 de los 5 aprobaron ambas, 1 aprobó una y abandonó la
        // otra: 9 Aprobada + 1 Abandonada de 10 cursadas → 90% / 10%.
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var s1 = subjects[0];
        var s2 = subjects[1];

        for (var i = 0; i < 4; i++)
        {
            await EnrollOtherStudentInComboAsync(planId, s1.Id, s2.Id, $"five-{i}", "Passed", "Passed");
        }
        await EnrollOtherStudentInComboAsync(planId, s1.Id, s2.Id, "five-dropout", "Passed", "Dropped");

        var caller = await StudentAsync(planId, "five-caller");
        var response = await EvaluateAsync(caller, s1.Id, s2.Id);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EvaluateSimulationResponseDto>();
        body.ShouldNotBeNull();
        body!.CombinationStats.SampleSize.ShouldBe(5);
        body.CombinationStats.PassRate.ShouldNotBeNull();
        body.CombinationStats.PassRate!.Value.ShouldBe(90.0, 0.001);
        body.CombinationStats.DropoutRate.ShouldNotBeNull();
        body.CombinationStats.DropoutRate!.Value.ShouldBe(10.0, 0.001);
    }

    [Fact]
    public async Task Counts_other_students_with_the_exact_same_combination_and_excludes_the_caller()
    {
        // Misma cohorte de 5 que "Shows_rates_when_sample_size_reaches_five_students" (para que
        // las tasas no queden gateadas por ADR-0047), más el propio alumno que simula habiendo
        // cursado el mismo combo antes (recursando). Sin la exclusión, sampleSize daría 6 y las
        // tasas saldrían distintas (11 Aprobada + 1 Abandonada de 12 = 91.67% / 8.33%): que el
        // test dé 5 / 90% / 10% prueba que la auto-exclusión funciona, no solo que "existe".
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var s1 = subjects[0];
        var s2 = subjects[1];

        for (var i = 0; i < 4; i++)
        {
            await EnrollOtherStudentInComboAsync(planId, s1.Id, s2.Id, $"excl-{i}", "Passed", "Passed");
        }
        await EnrollOtherStudentInComboAsync(planId, s1.Id, s2.Id, "excl-dropout", "Passed", "Dropped");

        var caller = await StudentAsync(planId, "excl-caller");
        var callerTerm = Guid.NewGuid();
        await EnrollAsync(caller, s1.Id, "Passed", "FinalExam", Guid.NewGuid(), callerTerm, 9m);
        await EnrollAsync(caller, s2.Id, "Passed", "FinalExam", Guid.NewGuid(), callerTerm, 9m);

        var response = await EvaluateAsync(caller, s1.Id, s2.Id);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EvaluateSimulationResponseDto>();
        body.ShouldNotBeNull();
        body!.CombinationStats.SampleSize.ShouldBe(5);
        body.CombinationStats.PassRate.ShouldNotBeNull();
        body.CombinationStats.PassRate!.Value.ShouldBe(90.0, 0.001);
        body.CombinationStats.DropoutRate.ShouldNotBeNull();
        body.CombinationStats.DropoutRate!.Value.ShouldBe(10.0, 0.001);
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var anon = _fixture.Factory.CreateClient();

        var response = await anon.PostAsJsonAsync(
            "/api/me/simulator/evaluate", new { subjectIds = Array.Empty<Guid>() });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private static async Task EnrollAsync(
        AuthenticatedClient student,
        Guid subjectId,
        string status,
        string? approvalMethod,
        Guid? commissionId,
        Guid? termId,
        decimal? grade)
    {
        (await student.Client.PostAsJsonAsync(
                "/api/me/enrollment-records",
                new
                {
                    subjectId,
                    commissionId,
                    termId,
                    status,
                    approvalMethod,
                    grade,
                }))
            .EnsureSuccessStatusCode();
    }

    /// <summary>
    /// Crea un alumno nuevo en <paramref name="planId"/> y lo inscribe en exactamente
    /// <paramref name="s1"/> + <paramref name="s2"/> en un mismo período propio (un term_id
    /// arbitrario, distinto por alumno): un alumno más que "cursó" ese combo exacto para la
    /// cohorte de US-016 punto 4. Solo soporta los dos status que ejercitan estos tests
    /// (Aprobada/Abandonada); no hace falta más.
    /// </summary>
    private async Task EnrollOtherStudentInComboAsync(
        Guid planId, Guid s1, Guid s2, string label, string s1Status, string s2Status)
    {
        var student = await StudentAsync(planId, label);
        var term = Guid.NewGuid();
        await EnrollAsync(student, s1, s1Status, ApprovalMethodFor(s1Status), Guid.NewGuid(), term, GradeFor(s1Status));
        await EnrollAsync(student, s2, s2Status, ApprovalMethodFor(s2Status), Guid.NewGuid(), term, GradeFor(s2Status));
    }

    private static string? ApprovalMethodFor(string status) => status == "Passed" ? "FinalExam" : null;

    private static decimal? GradeFor(string status) => status == "Passed" ? 8m : null;

    /// <summary>
    /// Publica una reseña Published sobre una materia sembrada (TUDCS), creando un alumno +
    /// cursada Aprobada nuevos para cada llamada. Mismo idiom que
    /// <c>SubjectInsightsEndpointTests.PublishReviewAsync</c>.
    /// </summary>
    private async Task PublishReviewOnSeededSubjectAsync(
        Guid subjectId, Guid commissionId, Guid teacherId, Guid termId, int difficulty, string label)
    {
        var auth = await StudentAsync(TudcsPlanId, $"reviewer-{label}");

        var enrollResp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId,
                commissionId = (Guid?)commissionId,
                termId = (Guid?)termId,
                status = "Passed",
                approvalMethod = "FinalExam",
                grade = 8m,
            });
        enrollResp.EnsureSuccessStatusCode();
        var enrollmentId = (await enrollResp.Content.ReadFromJsonAsync<EnrollmentIdDto>())!.Id;

        var review = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = teacherId,
                difficultyRating = difficulty,
                overallRating = 3,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Reseña de prueba para el simulador, contenido limpio y suficientemente largo.",
                teacherText = (string?)null,
                finalGrade = 8m,
            });
        review.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    private sealed record EnrollmentIdDto(Guid Id);

    private sealed record SubjectSeed(Guid Id, string Code, string Name, int WeeklyHours, int TotalHours);

    private sealed record SubjectRefDto(Guid Id, string Code, string Name);

    private sealed record BlockedSubjectDto(Guid Id, string Code, string Name, List<SubjectRefDto> BlockedBy);

    private sealed record CombinationCohortStatsDto(int SampleSize, double? PassRate, double? DropoutRate);

    private sealed record EvaluateSimulationResponseDto(
        bool IsValid,
        List<BlockedSubjectDto> BlockedSubjects,
        int TotalWeeklyHours,
        int TotalHours,
        double? WeightedDifficulty,
        CombinationCohortStatsDto CombinationStats);
}
