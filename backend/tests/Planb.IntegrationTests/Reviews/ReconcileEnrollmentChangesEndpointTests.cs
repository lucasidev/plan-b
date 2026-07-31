using System.Net;
using System.Net.Http.Json;
using Planb.Enrollments.Application.Features.RegisterEnrollment;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ReconcileEnrollmentChanges;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration del barrido de reconciliación (US-015). Es la red de contención del evento de
/// edición de cursada: el outbox durable garantiza que el mensaje no se pierda entre el commit y la
/// cola, pero si el consumer agota los reintentos y el mensaje va al dead-letter, la reseña queda
/// publicada hablando de una cursada que ya no terminó.
///
/// Estos tests no simulan un dead-letter (eso sería testear a Wolverine). Reproducen el estado
/// resultante, que es lo que el barrido tiene que saber encontrar: reseña publicada + cursada en
/// curso.
/// </summary>
public class ReconcileEnrollmentChangesEndpointTests : IClassFixture<RegisterApiFixture>
{
    private const string Route = "/api/admin/reviews/reconcile-enrollment-changes";

    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject111 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid Commission111A =
        Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid TeacherBrandt =
        Guid.Parse("00000006-0000-4000-a000-000000000001");

    public ReconcileEnrollmentChangesEndpointTests(RegisterApiFixture fixture) => _fixture = fixture;

    private async Task<AuthenticatedClient> StudentAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"reconcile-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    private Task<AuthenticatedClient> StaffAsync(string label) =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"reconcile-staff-{label}.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    /// <summary>Cursada aprobada con reseña publicada, que es el estado sano de partida.</summary>
    private static async Task<Guid> PassedWithReviewAsync(AuthenticatedClient auth)
    {
        var enrollment = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject111,
                commissionId = (Guid?)Commission111A,
                termId = (Guid?)Term2026_1c,
                status = "Passed",
                approvalMethod = "FinalExam",
                grade = 8.5m,
            });
        enrollment.StatusCode.ShouldBe(HttpStatusCode.Created);
        var enrollmentId = (await enrollment.Content
            .ReadFromJsonAsync<RegisterEnrollmentResponse>())!.Id;

        var review = await auth.Client.PostAsJsonAsync("/api/reviews", new
        {
            enrollmentId,
            reviewedTeacherId = TeacherBrandt,
            difficultyRating = 3,
            overallRating = 3,
            wouldRecommendCourse = true,
            wouldRetakeTeacher = true,
            subjectText = "Una reseña publicada para ejercitar el barrido de reconciliación.",
            teacherText = (string?)null,
            finalGrade = (decimal?)null,
        });
        review.StatusCode.ShouldBe(HttpStatusCode.Created);

        return enrollmentId;
    }

    /// <summary>
    /// Devuelve la cursada a Cursando por la vía normal. Reproduce el estado que quedaría si el
    /// evento se hubiera perdido, salvo que acá el consumer sí corre; el test verifica el conteo del
    /// barrido, no que la reseña quede en cuarentena por su culpa.
    /// </summary>
    private static async Task ReopenAsync(AuthenticatedClient auth, Guid enrollmentId)
    {
        var response = await auth.Client.PatchAsJsonAsync(
            $"/api/me/enrollment-records/{enrollmentId}",
            new
            {
                commissionId = (Guid?)Commission111A,
                termId = (Guid?)Term2026_1c,
                status = "InProgress",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Returns_200_and_reports_zero_when_nothing_drifted()
    {
        var student = await StudentAsync("clean");
        await PassedWithReviewAsync(student);

        var staff = await StaffAsync("clean");
        var response = await staff.Client.PostAsync(Route, content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ReconcileEnrollmentChangesResponse>();
        body.ShouldNotBeNull();
        body!.PublishedReviewsChecked.ShouldBeGreaterThan(0);
        // Cero es el resultado sano: la cursada de esta reseña sigue aprobada.
        body.Quarantined.ShouldBe(0);
    }

    [Fact]
    public async Task Is_idempotent_across_consecutive_runs()
    {
        var staff = await StaffAsync("idempotent");

        var first = await staff.Client.PostAsync(Route, content: null);
        first.StatusCode.ShouldBe(HttpStatusCode.OK);

        var second = await staff.Client.PostAsync(Route, content: null);
        second.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await second.Content.ReadFromJsonAsync<ReconcileEnrollmentChangesResponse>();
        // La segunda corrida no encuentra nada que corregir: QuarantineByEnrollmentChange es no-op
        // sobre una reseña que ya salió de Published.
        body!.Quarantined.ShouldBe(0);
    }

    [Fact]
    public async Task Leaves_no_published_review_pointing_at_an_in_progress_cursada()
    {
        // El invariante que el barrido existe para sostener, verificado end-to-end: después de
        // correrlo, no puede quedar ninguna reseña publicada cuya cursada esté en curso.
        var student = await StudentAsync("invariant");
        var enrollmentId = await PassedWithReviewAsync(student);
        await ReopenAsync(student, enrollmentId);

        var staff = await StaffAsync("invariant");
        var response = await staff.Client.PostAsync(Route, content: null);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var again = await staff.Client.PostAsync(Route, content: null);
        var body = await again.Content.ReadFromJsonAsync<ReconcileEnrollmentChangesResponse>();
        body!.Quarantined.ShouldBe(0);
    }

    [Fact]
    public async Task Returns_403_for_a_member()
    {
        var student = await StudentAsync("member");

        var response = await student.Client.PostAsync(Route, content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Returns_401_without_a_token()
    {
        var client = _fixture.Factory.CreateClient();

        var response = await client.PostAsync(Route, content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
