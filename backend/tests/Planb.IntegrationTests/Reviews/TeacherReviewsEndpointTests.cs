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
    private static readonly Guid MAT102 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_2c =
        Guid.Parse("00000005-0000-4000-a000-000000000002");

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
        AuthenticatedClient auth, Guid subjectId, Guid termId)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId,
                commissionId = (Guid?)Guid.NewGuid(),
                termId = (Guid?)termId,
                status = "Aprobada",
                approvalMethod = "Final",
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
        var teacherA = Guid.NewGuid();
        var teacherB = Guid.NewGuid();

        var auth = await SetupUserAsync("filter");
        await SetupProfileAsync(auth);

        var enrollmentA = await CreateApprovedEnrollmentAsync(auth, MAT102, Term2024_1c);
        await PublishReviewForTeacherAsync(auth, enrollmentA, teacherA, overall: 5);

        // Misma materia (otro cuatri), otro docente reseñado: NO debe aparecer al filtrar por teacherA.
        var enrollmentB = await CreateApprovedEnrollmentAsync(auth, MAT102, Term2024_2c);
        await PublishReviewForTeacherAsync(auth, enrollmentB, teacherB, overall: 2);

        using var anon = _fixture.Factory.CreateClient();
        var resp = await anon.GetAsync($"/api/reviews?teacherId={teacherA}");

        resp.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<BrowseReviewsResponse>();
        body.ShouldNotBeNull();
        body!.Items.ShouldNotBeEmpty();
        body.Items.ShouldAllBe(i => i.OverallRating == 5); // solo la de teacherA (overall 5)
        body.Items.ShouldContain(i => i.SubjectId == MAT102);
    }

    [Fact]
    public async Task TeacherInsights_aggregates_only_that_teachers_published_reviews()
    {
        var teacher = Guid.NewGuid();

        var auth = await SetupUserAsync("insights");
        await SetupProfileAsync(auth);

        var e1 = await CreateApprovedEnrollmentAsync(auth, MAT102, Term2024_1c);
        await PublishReviewForTeacherAsync(auth, e1, teacher, overall: 4);
        var e2 = await CreateApprovedEnrollmentAsync(auth, MAT102, Term2024_2c);
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
