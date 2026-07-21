using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Domain.Teachers;
using Planb.Academic.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.BrowseReviews;
using Planb.Reviews.Application.Features.TeacherInsights;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration del read-side de la página de docente (US-003):
///   - GET /api/reviews?teacherId={id}   (reseñas donde el docente fue el reseñado)
///   - GET /api/reviews/teacher-insights?teacherId={id}  (agregados)
///   - GET /api/academic/teachers/{id}   (410 Gone si soft-deleted)
///
/// Las reseñas se publican vía el endpoint real con un <c>docenteResenadoId</c> elegido, así se
/// verifica que el filtro es estricto: una reseña con otro docente reseñado no aparece, aunque sea
/// de la misma materia.
/// </summary>
public class TeacherReviewsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // Cada reseña se ancla a una comisión real sembrada (materia · comisión · docente titular/jtp ·
    // term de esa comisión). El handler de publish exige que el docente reseñado pertenezca a la
    // comisión de la cursada, así que cada reseña ancla su cursada a una comisión real que contiene
    // al docente reseñado. Las comisiones que comparten docente (Brandt está en la comisión "A" de
    // 111 y en la comisión "A" de 313) habilitan agregar dos reseñas del mismo docente sobre
    // cursadas distintas sin chocar con UNIQUE(student, subject, term).
    private static readonly Guid Subject101 = Guid.Parse("00000004-0000-4000-a000-000000000001"); // Algoritmos y Paradigmas
    private static readonly Guid Subject223 = Guid.Parse("00000004-0000-4000-a000-000000000017"); // Desarrollo Back End
    private static readonly Guid Subject111 = Guid.Parse("00000004-0000-4000-a000-000000000005"); // Desarrollo de Software
    private static readonly Guid Subject313 = Guid.Parse("00000004-0000-4000-a000-000000000020"); // Inglés B1:1

    private static readonly Guid Term2026_1c = Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid Term2025_2c = Guid.Parse("00000005-0000-4000-a000-000000000004");

    private static readonly Guid CommissionSubject101 = Guid.Parse("00000007-0000-4000-a000-000000000003");
    private static readonly Guid CommissionSubject223 = Guid.Parse("00000007-0000-4000-a000-000000000004");
    private static readonly Guid CommissionSubject111 = Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid CommissionSubject313 = Guid.Parse("00000007-0000-4000-a000-000000000006");

    // Docentes del catálogo sembrado (US-063), por id. Iturralde y Castro son cada uno de una sola
    // comisión (sirven para el test de filtro estricto); Brandt está en la comisión "A" de 111 y en
    // la comisión "A" de 313 (sirve para agregar dos reseñas del mismo docente sobre cursadas
    // distintas).
    private static readonly Guid TeacherIturralde = Guid.Parse("00000006-0000-4000-a000-000000000002");
    private static readonly Guid TeacherCastro = Guid.Parse("00000006-0000-4000-a000-000000000006");
    private static readonly Guid TeacherBrandt = Guid.Parse("00000006-0000-4000-a000-000000000001");

    // Docente sembrado (US-063) que este test desactiva para probar el 410. Ningún otro test de
    // esta clase lo consulta, así que el soft-delete queda aislado dentro de la DB de la clase.
    private static readonly Guid HernanQuirogaId =
        Guid.Parse("00000006-0000-4000-a000-00000000000a");

    public TeacherReviewsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
        => await AuthenticatedClient.CreateAsync(
            _fixture, $"teacher-reviews-{label}.{Guid.NewGuid():N}@planb.local");

    private static async Task SetupProfileAsync(AuthenticatedClient auth)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        resp.EnsureSuccessStatusCode();
    }

    private static async Task<Guid> CreateApprovedEnrollmentAsync(
        AuthenticatedClient auth, Guid subjectId, Guid commissionId, Guid termId)
    {
        var resp = await auth.Client.PostAsJsonAsync(
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
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    private static async Task PublishReviewForTeacherAsync(
        AuthenticatedClient auth, Guid enrollmentId, Guid teacherId, int overall)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = teacherId,
                difficultyRating = 3,
                overallRating = overall,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Cursada pareja, el docente explica con claridad y acompaña en las consultas.",
                teacherText = (string?)null,
                finalGrade = 8m,
            });
        resp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task BrowseByTeacher_returns_only_reviews_where_teacher_was_reviewed()
    {
        // Dos docentes reales de comisiones distintas (cada uno docente de su cursada). El filtro por
        // teacherId tiene que devolver sólo la reseña del docente pedido.
        var teacherA = TeacherIturralde; // titular de la comisión "Mañana" (101 Algoritmos y Paradigmas · 2026·1c)
        var teacherB = TeacherCastro;    // titular de la comisión "Noche" (223 Desarrollo Back End · 2025·2c)

        var auth = await SetupUserAsync("filter");
        await SetupProfileAsync(auth);

        var enrollmentA = await CreateApprovedEnrollmentAsync(auth, Subject101, CommissionSubject101, Term2026_1c);
        await PublishReviewForTeacherAsync(auth, enrollmentA, teacherA, overall: 5);

        // Otra cursada/comisión, otro docente reseñado: NO debe aparecer al filtrar por teacherA.
        var enrollmentB = await CreateApprovedEnrollmentAsync(auth, Subject223, CommissionSubject223, Term2025_2c);
        await PublishReviewForTeacherAsync(auth, enrollmentB, teacherB, overall: 2);

        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync($"/api/reviews?teacherId={teacherA}");

        resp.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        body.ShouldNotBeNull();
        body!.Items.ShouldNotBeEmpty();
        body.Items.ShouldAllBe(i => i.OverallRating == 5); // solo la de teacherA (overall 5)
        body.Items.ShouldContain(i => i.SubjectId == Subject101);
    }

    [Fact]
    public async Task TeacherInsights_aggregates_only_that_teachers_published_reviews()
    {
        // Brandt es docente de dos comisiones "A" (111 y 313): permite dos reseñas del mismo docente
        // sobre cursadas distintas, sin chocar con UNIQUE(student, subject, term).
        var teacher = TeacherBrandt;

        var auth = await SetupUserAsync("insights");
        await SetupProfileAsync(auth);

        var e1 = await CreateApprovedEnrollmentAsync(auth, Subject111, CommissionSubject111, Term2026_1c);
        await PublishReviewForTeacherAsync(auth, e1, teacher, overall: 4);
        var e2 = await CreateApprovedEnrollmentAsync(auth, Subject313, CommissionSubject313, Term2026_1c);
        await PublishReviewForTeacherAsync(auth, e2, teacher, overall: 2);

        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync($"/api/reviews/teacher-insights?teacherId={teacher}");

        resp.StatusCode.ShouldBe(HttpStatusCode.OK);
        var insights = await resp.Content.ReadFromJsonAsync<TeacherReviewInsights>();
        insights.ShouldNotBeNull();
        insights!.TotalCount.ShouldBe(2);
        insights.AverageOverallRating!.Value.ShouldBe(3.0, 0.001); // (4 + 2) / 2
        insights.RatingHistogram.Count.ShouldBe(5);
        insights.RatingHistogram[1].ShouldBe(1); // un rating 2
        insights.RatingHistogram[3].ShouldBe(1); // un rating 4
    }

    [Fact]
    public async Task TeacherInsights_returns_empty_for_unknown_teacher()
    {
        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync($"/api/reviews/teacher-insights?teacherId={Guid.NewGuid()}");

        resp.StatusCode.ShouldBe(HttpStatusCode.OK);
        var insights = await resp.Content.ReadFromJsonAsync<TeacherReviewInsights>();
        insights.ShouldNotBeNull();
        insights!.TotalCount.ShouldBe(0);
        insights.AverageOverallRating.ShouldBeNull();
        insights.RatingHistogram.ShouldAllBe(c => c == 0);
    }

    [Fact]
    public async Task TeacherInsights_returns_400_without_teacherId()
    {
        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync("/api/reviews/teacher-insights");

        resp.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetTeacher_returns_410_when_soft_deleted()
    {
        // Desactivar el docente sembrado directamente vía el aggregate (no hay endpoint admin aún).
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
            var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
            var teacher = await db.Teachers.FirstAsync(t => t.Id == new TeacherId(HernanQuirogaId));
            teacher.Deactivate(clock);
            await db.SaveChangesAsync();
        }

        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync($"/api/academic/teachers/{HernanQuirogaId}");

        resp.StatusCode.ShouldBe(HttpStatusCode.Gone);
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
