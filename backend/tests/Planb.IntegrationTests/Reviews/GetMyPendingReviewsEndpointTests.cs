using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.GetMyPendingReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Tests integration de US-048 tab Pendientes (<c>GET /api/reviews/me/pending</c>).
///
/// Cubre:
///   - 401 sin auth.
///   - 200 con lista vacía cuando el user todavía no tiene StudentProfile.
///   - Lista solo los enrollments terminales sin reseña.
///   - Excluye enrollments en Cursando.
///   - Excluye enrollments que ya tienen reseña publicada.
///   - El alumno solo ve sus propios pendings (no se cruzan entre users).
/// </summary>
public class GetMyPendingReviewsEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    // Seed IDs alineados con los demás integration tests (Academic seed determinístico). Sólo las
    // cursadas con comisión sembrada real son reseñables/pendientes: el endpoint de pendientes filtra
    // commission_id IS NOT NULL (una cursada sin comisión no se puede reseñar, así que no se ofrece).
    // Por eso cada materia ancla a una comisión + docente sembrados:
    //   PRG101 → Cid01 (Brandt)    · 2026·1c
    //   MAT102 → Cid03 (iturralde) · 2026·1c
    //   PRG201 → Cid04 (castro)    · 2025·2c
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid PRG101 =
        Guid.Parse("00000004-0000-4000-a000-000000000004");
    private static readonly Guid MAT102 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid PRG201 =
        Guid.Parse("00000004-0000-4000-a000-000000000010");

    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid Term2025_2c =
        Guid.Parse("00000005-0000-4000-a000-000000000004");

    private static readonly Guid CommissionPrg101 =
        Guid.Parse("00000007-0000-4000-a000-000000000001");
    private static readonly Guid TeacherBrandt =
        Guid.Parse("00000006-0000-4000-a000-000000000001");
    private static readonly Guid CommissionMat102 =
        Guid.Parse("00000007-0000-4000-a000-000000000003");
    private static readonly Guid TeacherIturralde =
        Guid.Parse("00000006-0000-4000-a000-000000000002");
    private static readonly Guid CommissionPrg201 =
        Guid.Parse("00000007-0000-4000-a000-000000000004");
    private static readonly Guid TeacherCastro =
        Guid.Parse("00000006-0000-4000-a000-000000000006");

    // Comisión + docente + term sembrados que corresponden a cada materia reseñable de arriba.
    private static (Guid CommissionId, Guid TeacherId, Guid TermId) SeededFor(Guid subjectId)
    {
        if (subjectId == PRG101)
        {
            return (CommissionPrg101, TeacherBrandt, Term2026_1c);
        }
        if (subjectId == PRG201)
        {
            return (CommissionPrg201, TeacherCastro, Term2025_2c);
        }
        return (CommissionMat102, TeacherIturralde, Term2026_1c);
    }

    public GetMyPendingReviewsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
        => await AuthenticatedClient.CreateAsync(
            _fixture, $"pending-reviews-{label}.{Guid.NewGuid():N}@planb.local");

    private static async Task SetupProfileAsync(AuthenticatedClient auth)
    {
        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();
    }

    private static async Task<Guid> CreateApprovedEnrollmentAsync(
        AuthenticatedClient auth, Guid? subjectId = null)
    {
        var subject = subjectId ?? MAT102;
        var (commissionId, _, termId) = SeededFor(subject);
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = subject,
                commissionId = (Guid?)commissionId,
                termId = (Guid?)termId,
                status = "Aprobada",
                approvalMethod = "Final",
                grade = 8m,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    private static async Task<Guid> CreateCursandoEnrollmentAsync(
        AuthenticatedClient auth, Guid? subjectId = null)
    {
        var subject = subjectId ?? MAT102;
        var (commissionId, _, termId) = SeededFor(subject);
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = subject,
                commissionId = (Guid?)commissionId,
                termId = (Guid?)termId,
                status = "Cursando",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<EnrollmentIdDto>();
        return body!.Id;
    }

    private static async Task PublishReviewAsync(
        AuthenticatedClient auth, Guid enrollmentId, Guid subjectId)
    {
        var (_, teacherId, _) = SeededFor(subjectId);
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/reviews",
            new
            {
                enrollmentId,
                docenteResenadoId = teacherId,
                difficultyRating = 3,
                overallRating = 4,
                wouldRecommendCourse = true,
                wouldRetakeTeacher = true,
                subjectText = "Reseña ya publicada para esta cursada, no debería aparecer en pendientes.",
                teacherText = (string?)null,
                finalGrade = (decimal?)null,
            });
        resp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Returns_401_when_no_auth()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/reviews/me/pending");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_empty_list_when_user_has_no_profile()
    {
        var auth = await SetupUserAsync("no-profile");

        var response = await auth.Client.GetAsync("/api/reviews/me/pending");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyPendingReviewsResponse>();
        body.ShouldNotBeNull();
        body!.Items.ShouldBeEmpty();
    }

    [Fact]
    public async Task Returns_empty_list_when_no_enrollments()
    {
        var auth = await SetupUserAsync("no-enrollments");
        await SetupProfileAsync(auth);

        var response = await auth.Client.GetAsync("/api/reviews/me/pending");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyPendingReviewsResponse>();
        body!.Items.ShouldBeEmpty();
    }

    [Fact]
    public async Task Lists_only_terminal_enrollments_without_review()
    {
        var auth = await SetupUserAsync("happy");
        await SetupProfileAsync(auth);

        // Three enrollments anchored to comisiones sembradas distintas: una Aprobada con reseña, una
        // Aprobada sin reseña (la única que debe aparecer en pendientes) y una Cursando. Materias
        // distintas para no chocar con UNIQUE(student, subject, term). Sólo las cursadas con
        // commission_id no-null afloran en pendientes (las tres lo tienen vía su comisión sembrada).
        var reviewedId = await CreateApprovedEnrollmentAsync(auth, PRG101);
        await PublishReviewAsync(auth, reviewedId, PRG101);

        var pendingId = await CreateApprovedEnrollmentAsync(auth, MAT102);

        var cursandoId = await CreateCursandoEnrollmentAsync(auth, PRG201);

        var response = await auth.Client.GetAsync("/api/reviews/me/pending");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyPendingReviewsResponse>();
        var items = body!.Items;

        items.ShouldHaveSingleItem();
        items[0].EnrollmentId.ShouldBe(pendingId);
        items[0].SubjectId.ShouldBe(MAT102);
        items[0].CommissionId.ShouldBe(CommissionMat102);
        items[0].Status.ShouldBe("Aprobada");
        items[0].Grade.ShouldBe(8m);
        items[0].SubjectCode.ShouldNotBeNullOrWhiteSpace();
        items[0].SubjectName.ShouldNotBeNullOrWhiteSpace();

        // Sanity: the reviewed and cursando IDs are NOT included.
        items.ShouldNotContain(i => i.EnrollmentId == reviewedId);
        items.ShouldNotContain(i => i.EnrollmentId == cursandoId);
    }

    [Fact]
    public async Task Does_not_leak_other_users_pending_reviews()
    {
        var alice = await SetupUserAsync("alice");
        await SetupProfileAsync(alice);
        var aliceEnrollment = await CreateApprovedEnrollmentAsync(alice);

        var bob = await SetupUserAsync("bob");
        await SetupProfileAsync(bob);

        var bobResponse = await bob.Client.GetAsync("/api/reviews/me/pending");
        bobResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var bobBody = await bobResponse.Content.ReadFromJsonAsync<GetMyPendingReviewsResponse>();
        bobBody!.Items.ShouldNotContain(i => i.EnrollmentId == aliceEnrollment);
    }

    private sealed record EnrollmentIdDto(Guid Id);
}
