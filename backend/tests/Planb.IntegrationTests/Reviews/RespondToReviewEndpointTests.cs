using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.BrowseReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration de US-040 (responder reseña). Un alumno publica una reseña para un docente; un
/// docente verificado (claim US-030 + verificación US-031) de ese mismo docente la responde y la
/// respuesta aparece (con su nombre) en el feed. Corre contra el seed (docentes US-063, comisiones
/// US-065, dominio unsta.edu.ar).
///
/// Cada test usa un docente distinto para verificarse: el partial UNIQUE(teacher_id WHERE verified)
/// solo deja un profile verificado por docente, así que reusar el mismo docente entre tests de la
/// misma clase (DB compartida) chocaría con un 409 en el verify.
/// </summary>
public class RespondToReviewEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");

    // (docente · materia · comisión donde es titular · term de esa comisión).
    private static readonly Guid Iturralde = Guid.Parse("00000006-0000-4000-a000-000000000002");
    private static readonly Guid Subject101 = Guid.Parse("00000004-0000-4000-a000-000000000001"); // Algoritmos y Paradigmas
    private static readonly Guid CommissionSubject101 = Guid.Parse("00000007-0000-4000-a000-000000000003");
    private static readonly Guid Term2026_1c = Guid.Parse("00000005-0000-4000-a000-000000000005");

    private static readonly Guid Castro = Guid.Parse("00000006-0000-4000-a000-000000000006");
    private static readonly Guid Subject223 = Guid.Parse("00000004-0000-4000-a000-000000000017"); // Desarrollo Back End
    private static readonly Guid CommissionSubject223 = Guid.Parse("00000007-0000-4000-a000-000000000004");
    private static readonly Guid Term2025_2c = Guid.Parse("00000005-0000-4000-a000-000000000004");

    private static readonly Guid Brandt = Guid.Parse("00000006-0000-4000-a000-000000000001");

    private const string ResponseText =
        "Gracias por la devolución. Ajusté el cronograma de prácticos para este cuatrimestre.";

    private readonly RegisterApiFixture _fixture;

    public RespondToReviewEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private async Task<Guid> PublishReviewAsync(
        string label, Guid teacherId, Guid subjectId, Guid commissionId, Guid termId)
    {
        var student = await AuthenticatedClient.CreateAsync(
            _fixture, $"respond-author-{label}.{Guid.NewGuid():N}@planb.local");

        (await student.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 })).EnsureSuccessStatusCode();

        var enrollmentResp = await student.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId,
                commissionId = (Guid?)commissionId,
                termId = (Guid?)termId,
                status = "Aprobada",
                approvalMethod = "Final",
                grade = 8m,
            });
        enrollmentResp.EnsureSuccessStatusCode();
        var enrollment = await enrollmentResp.Content.ReadFromJsonAsync<IdDto>();

        var reviewResp = await student.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId = enrollment!.Id,
                docenteResenadoId = teacherId,
                difficultyRating = 3,
                overallRating = 4,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Cursada pareja, el docente explica con claridad y acompaña en las consultas.",
                teacherText = (string?)null,
                finalGrade = 8m,
            });
        reviewResp.EnsureSuccessStatusCode();
        var review = await reviewResp.Content.ReadFromJsonAsync<IdDto>();
        return review!.Id;
    }

    private async Task<AuthenticatedClient> CreateVerifiedTeacherAsync(string label, Guid teacherId)
    {
        var teacher = await AuthenticatedClient.CreateAsync(
            _fixture, $"respond-teacher-{label}.{Guid.NewGuid():N}@planb.local");

        var claimResp = await teacher.Client.PostAsJsonAsync(
            "/api/me/teacher-claims", new { teacherId });
        claimResp.EnsureSuccessStatusCode();
        var claim = await claimResp.Content.ReadFromJsonAsync<ClaimIdDto>();

        (await teacher.Client.PostAsJsonAsync(
            $"/api/me/teacher-claims/{claim!.ClaimId}/institutional-email",
            new { email = $"{label}.{Guid.NewGuid():N}@unsta.edu.ar" })).EnsureSuccessStatusCode();

        string token;
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
            var profile = await db.TeacherProfiles.AsNoTracking()
                .FirstAsync(p => p.UserId == teacher.UserId);
            token = profile.Tokens.Single(t => t.IsActive).Token;
        }

        (await teacher.Client.PostAsJsonAsync(
            "/api/me/teacher-claims/verify", new { token })).EnsureSuccessStatusCode();

        return teacher;
    }

    [Fact]
    public async Task Verified_teacher_responds_and_response_shows_in_feed()
    {
        var reviewId = await PublishReviewAsync(
            "happy", Iturralde, Subject101, CommissionSubject101, Term2026_1c);
        var teacher = await CreateVerifiedTeacherAsync("happy", Iturralde);

        var response = await teacher.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = ResponseText });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        using var anon = _fixture.Factory.CreateClient();
        var feed = await anon.GetFromJsonAsync<BrowseReviewsResponse>(
            $"/api/reviews?teacherId={Iturralde}");
        var item = feed!.Items.Single(i => i.Id == reviewId);
        item.ResponseText.ShouldBe(ResponseText);
        item.ResponseAuthorName.ShouldBe("Ana Iturralde"); // title case desde el storage lowercase
        item.ResponseCreatedAt.ShouldNotBeNull();
    }

    [Fact]
    public async Task Non_verified_user_cannot_respond()
    {
        var reviewId = await PublishReviewAsync(
            "403", Iturralde, Subject101, CommissionSubject101, Term2026_1c);

        // Un member verificado pero que NO reclamó a Iturralde.
        var intruder = await AuthenticatedClient.CreateAsync(
            _fixture, $"respond-intruder.{Guid.NewGuid():N}@planb.local");

        var response = await intruder.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = ResponseText });

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("reviews.response.not_verified_teacher");
    }

    [Fact]
    public async Task Second_response_is_idempotent()
    {
        var reviewId = await PublishReviewAsync(
            "idem", Castro, Subject223, CommissionSubject223, Term2025_2c);
        var teacher = await CreateVerifiedTeacherAsync("idem", Castro);

        var first = await teacher.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = ResponseText });
        first.StatusCode.ShouldBe(HttpStatusCode.OK);

        var second = await teacher.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response",
            new { text = "Otro texto distinto que igual debería ignorarse por idempotencia total." });

        second.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await second.Content.ReadFromJsonAsync<RespondBody>();
        body!.Text.ShouldBe(ResponseText); // la primera respuesta, no la segunda
    }

    [Fact]
    public async Task Returns_404_for_a_nonexistent_review()
    {
        var teacher = await CreateVerifiedTeacherAsync("404", Brandt);

        var response = await teacher.Client.PostAsJsonAsync(
            $"/api/reviews/{Guid.NewGuid()}/teacher-response", new { text = ResponseText });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    private sealed record IdDto(Guid Id);
    private sealed record ClaimIdDto(Guid ClaimId);
    private sealed record RespondBody(Guid ReviewId, Guid TeacherId, string Text, DateTimeOffset CreatedAt);
}
