using System.Net;
using System.Net.Http;
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
/// Tests integration de US-041 (editar respuesta docente). Reusa el flow completo del eje B (cargar
/// cursada → publicar reseña → claim + verificación → responder) y encima edita la respuesta. Clase
/// aparte de RespondToReview: DB propia, así puede reusar los mismos docentes sin chocar con el
/// partial UNIQUE de profile verificado por docente.
/// </summary>
public class EditTeacherResponseEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");

    private static readonly Guid Iturralde = Guid.Parse("00000006-0000-4000-a000-000000000002");
    private static readonly Guid Subject101 = Guid.Parse("00000004-0000-4000-a000-000000000001"); // Algoritmos y Paradigmas
    private static readonly Guid CommissionSubject101 = Guid.Parse("00000007-0000-4000-a000-000000000003");
    private static readonly Guid Term2026_1c = Guid.Parse("00000005-0000-4000-a000-000000000005");

    private static readonly Guid Castro = Guid.Parse("00000006-0000-4000-a000-000000000006");
    private static readonly Guid Subject223 = Guid.Parse("00000004-0000-4000-a000-000000000017"); // Desarrollo Back End
    private static readonly Guid CommissionSubject223 = Guid.Parse("00000007-0000-4000-a000-000000000004");
    private static readonly Guid Term2025_2c = Guid.Parse("00000005-0000-4000-a000-000000000004");

    private static readonly Guid Brandt = Guid.Parse("00000006-0000-4000-a000-000000000001");
    private static readonly Guid Subject111 = Guid.Parse("00000004-0000-4000-a000-000000000005"); // Desarrollo de Software
    private static readonly Guid CommissionSubject111 = Guid.Parse("00000007-0000-4000-a000-000000000001");

    private static readonly Guid Ledesma = Guid.Parse("00000006-0000-4000-a000-000000000009");
    private static readonly Guid Subject313 = Guid.Parse("00000004-0000-4000-a000-000000000020"); // Inglés B1:1
    private static readonly Guid CommissionSubject313 = Guid.Parse("00000007-0000-4000-a000-000000000006");

    private const string ResponseText =
        "Gracias por la devolución. Ajusté el cronograma de prácticos para este cuatrimestre.";
    private const string EditedText =
        "Actualizo: reorganicé los prácticos y sumé una consulta semanal fija para acompañar el arranque.";

    private readonly RegisterApiFixture _fixture;

    public EditTeacherResponseEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private async Task<Guid> PublishReviewAsync(
        string label, Guid teacherId, Guid subjectId, Guid commissionId, Guid termId)
    {
        var student = await AuthenticatedClient.CreateAsync(
            _fixture, $"edit-author-{label}.{Guid.NewGuid():N}@planb.local");

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
            _fixture, $"edit-teacher-{label}.{Guid.NewGuid():N}@planb.local");

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
    public async Task Verified_teacher_edits_its_response_and_feed_shows_the_new_text()
    {
        var reviewId = await PublishReviewAsync(
            "happy", Iturralde, Subject101, CommissionSubject101, Term2026_1c);
        var teacher = await CreateVerifiedTeacherAsync("happy", Iturralde);
        (await teacher.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = ResponseText }))
            .EnsureSuccessStatusCode();

        var editResp = await teacher.Client.PatchAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = EditedText });

        editResp.StatusCode.ShouldBe(HttpStatusCode.OK);

        using var anon = _fixture.Factory.CreateClient();
        var feed = await anon.GetFromJsonAsync<BrowseReviewsResponse>(
            $"/api/reviews?teacherId={Iturralde}");
        var item = feed!.Items.Single(i => i.Id == reviewId);
        item.ResponseText.ShouldBe(EditedText);
        item.ResponseUpdatedAt!.Value.ShouldBeGreaterThan(item.ResponseCreatedAt!.Value); // marca "editada"
    }

    [Fact]
    public async Task Non_verified_user_cannot_edit_the_response()
    {
        var reviewId = await PublishReviewAsync(
            "403", Castro, Subject223, CommissionSubject223, Term2025_2c);
        var teacher = await CreateVerifiedTeacherAsync("403", Castro);
        (await teacher.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = ResponseText }))
            .EnsureSuccessStatusCode();

        var intruder = await AuthenticatedClient.CreateAsync(
            _fixture, $"edit-intruder.{Guid.NewGuid():N}@planb.local");

        var editResp = await intruder.Client.PatchAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = EditedText });

        editResp.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var body = await editResp.Content.ReadAsStringAsync();
        body.ShouldContain("reviews.response.not_verified_teacher");
    }

    [Fact]
    public async Task Returns_404_when_the_review_has_no_response()
    {
        var reviewId = await PublishReviewAsync(
            "404", Brandt, Subject111, CommissionSubject111, Term2026_1c);
        var teacher = await CreateVerifiedTeacherAsync("404", Brandt);

        // Sin responder primero: no hay respuesta que editar.
        var editResp = await teacher.Client.PatchAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = EditedText });

        editResp.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var body = await editResp.Content.ReadAsStringAsync();
        body.ShouldContain("reviews.response.not_found");
    }

    [Fact]
    public async Task Fourth_edit_within_24h_is_rejected_by_cooldown()
    {
        var reviewId = await PublishReviewAsync(
            "cooldown", Ledesma, Subject313, CommissionSubject313, Term2026_1c);
        var teacher = await CreateVerifiedTeacherAsync("cooldown", Ledesma);
        (await teacher.Client.PostAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response", new { text = ResponseText }))
            .EnsureSuccessStatusCode();

        // 3 edits permitidos.
        for (var i = 1; i <= 3; i++)
        {
            var ok = await teacher.Client.PatchAsJsonAsync(
                $"/api/reviews/{reviewId}/teacher-response",
                new { text = $"{EditedText} (edición {i} de prueba para el cooldown de respuestas)." });
            ok.StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        // El 4º dentro de 24h choca con el cooldown.
        var fourth = await teacher.Client.PatchAsJsonAsync(
            $"/api/reviews/{reviewId}/teacher-response",
            new { text = $"{EditedText} (cuarta edición, debería rebotar por cooldown de respuestas)." });

        fourth.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
        var body = await fourth.Content.ReadAsStringAsync();
        body.ShouldContain("reviews.response.edit_cooldown_exceeded");
    }

    private sealed record IdDto(Guid Id);
    private sealed record ClaimIdDto(Guid ClaimId);
}

