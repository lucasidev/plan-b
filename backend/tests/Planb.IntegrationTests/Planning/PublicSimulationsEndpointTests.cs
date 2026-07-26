using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Domain;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Commissions;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Planning;

/// <summary>
/// Tests de integración de US-027 (feed público de simulaciones compartidas). Complementa
/// <see cref="SimulationDraftsEndpointTests"/> (que ya cubre compartir/descompartir en sí y el 403
/// de compartir el borrador de otro); este archivo ejercita <c>GET /api/simulations/public</c>: qué
/// aparece, qué se anonimiza, el gateo por plan del caller y la paginación.
/// </summary>
public class PublicSimulationsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public PublicSimulationsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    /// <summary>Crea un user autenticado + StudentProfile activo sobre <paramref name="careerPlanId"/>.</summary>
    private async Task<AuthenticatedClient> StudentAsync(Guid careerPlanId, string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"public-sims-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary>
    /// Arma una Career + CareerPlan propios (aislados del seed) con <paramref name="subjectCount"/>
    /// materias nuevas (4hs semanales cada una, para poder aserir <c>totalWeeklyHours</c> con un
    /// número previsible), más una Commission real sobre la primera materia. Mismo idiom que
    /// <c>SimulationDraftsEndpointTests.CreatePlanWithSubjectsAsync</c>.
    /// </summary>
    private async Task<(Guid PlanId, List<SubjectSeed> Subjects, Guid CommissionId, Guid TermId)>
        CreatePlanWithSubjectsAsync(int subjectCount)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

        var unique = Guid.NewGuid().ToString("N")[..8];
        var career = Career.Create(
            new UniversityId(Unsta),
            $"Carrera Feed {unique}",
            $"carrera-feed-{unique}",
            clock,
            isOfficial: true).Value;
        db.Careers.Add(career);

        var plan = CareerPlan.Create(career.Id, 2015, clock, isOfficial: true).Value;
        db.CareerPlans.Add(plan);

        var subjects = new List<SubjectSeed>();
        for (var i = 0; i < subjectCount; i++)
        {
            var code = $"FEED{i}-{unique}";
            var name = $"Materia Feed {i} {unique}";
            var subject = Subject.Create(
                plan.Id,
                code: code,
                name: name,
                yearInPlan: 1,
                termInYear: 1,
                termKind: TermKind.FourMonth,
                weeklyHours: 4,
                totalHours: 64,
                description: null,
                clock: clock,
                isOfficial: true).Value;
            db.Subjects.Add(subject);
            subjects.Add(new SubjectSeed(subject.Id.Value, code, name));
        }

        var termId = Guid.NewGuid();
        var commission = Commission.Create(
            subjects[0].Id, termId, "Comisión Feed A",
            CommissionModality.Presencial, 40, null, clock).Value;
        db.Commissions.Add(commission);

        await db.SaveChangesAsync();

        return (plan.Id.Value, subjects, commission.Id.Value, termId);
    }

    private static Task<HttpResponseMessage> CreateDraftAsync(
        AuthenticatedClient student, Guid termId, string? label,
        params (Guid SubjectId, Guid? CommissionId)[] items) =>
        student.Client.PostAsJsonAsync(
            "/api/me/simulations/drafts",
            new
            {
                termId,
                label,
                items = items.Select(i => new { subjectId = i.SubjectId, commissionId = i.CommissionId }).ToList(),
            });

    private static async Task<Guid> CreateDraftAndGetIdAsync(
        AuthenticatedClient student, Guid termId, string? label,
        params (Guid SubjectId, Guid? CommissionId)[] items)
    {
        var response = await CreateDraftAsync(student, termId, label, items);
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<IdDto>())!.Id;
    }

    private static Task<HttpResponseMessage> ShareDraftAsync(AuthenticatedClient student, Guid draftId) =>
        student.Client.PostAsync($"/api/me/simulations/drafts/{draftId}/share", content: null);

    private static Task<HttpResponseMessage> UnshareDraftAsync(AuthenticatedClient student, Guid draftId) =>
        student.Client.PostAsync($"/api/me/simulations/drafts/{draftId}/unshare", content: null);

    private static Task<HttpResponseMessage> GetPublicFeedAsync(
        AuthenticatedClient client, Guid careerPlanId, Guid termId, string? cursor = null)
    {
        var url = $"/api/simulations/public?careerPlanId={careerPlanId}&termId={termId}";
        if (cursor is not null)
        {
            url += $"&cursor={Uri.EscapeDataString(cursor)}";
        }
        return client.Client.GetAsync(url);
    }

    [Fact]
    public async Task Sharing_makes_it_appear_in_the_feed_and_unsharing_removes_it()
    {
        var (planId, subjects, commissionId, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "share-unshare");
        var draftId = await CreateDraftAndGetIdAsync(
            student, termId, "Mi combo", (subjects[0].Id, commissionId));

        var beforeShare = await (await GetPublicFeedAsync(student, planId, termId))
            .Content.ReadFromJsonAsync<PublicSimulationsFeedDto>();
        beforeShare!.Items.ShouldBeEmpty();

        (await ShareDraftAsync(student, draftId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var afterShareResponse = await GetPublicFeedAsync(student, planId, termId);
        afterShareResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterShare = await afterShareResponse.Content.ReadFromJsonAsync<PublicSimulationsFeedDto>();
        var item = afterShare!.Items.ShouldHaveSingleItem();
        item.Id.ShouldBe(draftId);
        item.Label.ShouldBe("Mi combo");
        item.TermId.ShouldBe(termId);
        var subjectItem = item.Items.ShouldHaveSingleItem();
        subjectItem.SubjectId.ShouldBe(subjects[0].Id);
        subjectItem.SubjectCode.ShouldBe(subjects[0].Code);
        subjectItem.SubjectName.ShouldBe(subjects[0].Name);
        subjectItem.CommissionId.ShouldBe(commissionId);
        subjectItem.CommissionName.ShouldBe("Comisión Feed A");

        (await UnshareDraftAsync(student, draftId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var afterUnshare = await (await GetPublicFeedAsync(student, planId, termId))
            .Content.ReadFromJsonAsync<PublicSimulationsFeedDto>();
        afterUnshare!.Items.ShouldBeEmpty();
    }

    [Fact]
    public async Task Feed_computes_total_weekly_hours_and_null_average_difficulty_without_reviews()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "metrics");
        var draftId = await CreateDraftAndGetIdAsync(
            student, termId, null, (subjects[0].Id, null), (subjects[1].Id, null));
        (await ShareDraftAsync(student, draftId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var feed = await (await GetPublicFeedAsync(student, planId, termId))
            .Content.ReadFromJsonAsync<PublicSimulationsFeedDto>();

        var item = feed!.Items.Single(i => i.Id == draftId);
        // Cada materia de CreatePlanWithSubjectsAsync tiene weekly_hours=4: 2 materias, 8hs totales.
        item.TotalWeeklyHours.ShouldBe(8);
        // Materias recién creadas: cero reseñas todavía. Null, no 0 ("no sabemos" != "fácil").
        item.AverageDifficulty.ShouldBeNull();
    }

    [Fact]
    public async Task Feed_does_not_expose_any_owner_information()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "anon");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, null, (subjects[0].Id, null));
        (await ShareDraftAsync(student, draftId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await GetPublicFeedAsync(student, planId, termId);
        var raw = (await response.Content.ReadAsStringAsync()).ToLowerInvariant();

        raw.ShouldContain(draftId.ToString().ToLowerInvariant());
        raw.ShouldNotContain("owner");
    }

    [Fact]
    public async Task Requesting_a_career_plan_that_is_not_the_students_own_returns_forbidden()
    {
        var (planId, _, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var (otherPlanId, _, _, _) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "mismatch");

        var response = await GetPublicFeedAsync(student, otherPlanId, termId);

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.public_simulations.plan_mismatch");
    }

    [Fact]
    public async Task Feed_only_shows_shared_drafts_from_the_same_career_plan()
    {
        var (planA, subjectsA, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var (planB, subjectsB, _, _) = await CreatePlanWithSubjectsAsync(1);
        var studentA = await StudentAsync(planA, "plan-a");
        var studentB = await StudentAsync(planB, "plan-b");

        var draftAId = await CreateDraftAndGetIdAsync(studentA, termId, "De carrera A", (subjectsA[0].Id, null));
        (await ShareDraftAsync(studentA, draftAId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        // studentB comparte un draft de SU carrera bajo el MISMO termId: sin FK a Term (ADR-0017),
        // el mismo id sintético se puede reusar entre carreras distintas para armar el escenario.
        var draftBId = await CreateDraftAndGetIdAsync(studentB, termId, "De carrera B", (subjectsB[0].Id, null));
        (await ShareDraftAsync(studentB, draftBId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var feedForA = await (await GetPublicFeedAsync(studentA, planA, termId))
            .Content.ReadFromJsonAsync<PublicSimulationsFeedDto>();

        feedForA!.Items.ShouldContain(i => i.Id == draftAId);
        feedForA.Items.ShouldNotContain(i => i.Id == draftBId);
    }

    [Fact]
    public async Task Feed_paginates_with_a_fixed_page_size_of_20()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "paging");

        var draftIds = new List<Guid>();
        for (var i = 0; i < 21; i++)
        {
            var draftId = await CreateDraftAndGetIdAsync(student, termId, $"Sim {i}", (subjects[0].Id, null));
            (await ShareDraftAsync(student, draftId)).StatusCode.ShouldBe(HttpStatusCode.OK);
            draftIds.Add(draftId);
        }

        var firstPageResponse = await GetPublicFeedAsync(student, planId, termId);
        firstPageResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var firstPage = await firstPageResponse.Content.ReadFromJsonAsync<PublicSimulationsFeedDto>();
        firstPage!.Items.Count.ShouldBe(20);
        firstPage.NextCursor.ShouldNotBeNull();

        var secondPageResponse = await GetPublicFeedAsync(student, planId, termId, firstPage.NextCursor);
        secondPageResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var secondPage = await secondPageResponse.Content.ReadFromJsonAsync<PublicSimulationsFeedDto>();
        secondPage!.Items.ShouldHaveSingleItem();
        secondPage.NextCursor.ShouldBeNull();

        var seenIds = firstPage.Items.Select(i => i.Id)
            .Concat(secondPage.Items.Select(i => i.Id))
            .ToList();
        seenIds.Count.ShouldBe(21);
        seenIds.Distinct().Count().ShouldBe(21);
        seenIds.ShouldBe(draftIds, ignoreOrder: true);
    }

    [Fact]
    public async Task Returns_404_when_user_has_no_student_profile()
    {
        var (planId, _, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"public-sims-noprofile.{Guid.NewGuid():N}@planb.local");

        var response = await GetPublicFeedAsync(auth, planId, termId);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulator.student_profile_required");
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var anon = _fixture.Factory.CreateClient();

        var response = await anon.GetAsync(
            $"/api/simulations/public?careerPlanId={Guid.NewGuid()}&termId={Guid.NewGuid()}");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record IdDto(Guid Id);

    private sealed record SubjectSeed(Guid Id, string Code, string Name);

    private sealed record PublicSimulationSubjectDto(
        Guid SubjectId, string SubjectCode, string SubjectName, Guid? CommissionId, string? CommissionName);

    private sealed record PublicSimulationItemDto(
        Guid Id, string? Label, Guid TermId, List<PublicSimulationSubjectDto> Items,
        int TotalWeeklyHours, double? AverageDifficulty);

    private sealed record PublicSimulationsFeedDto(List<PublicSimulationItemDto> Items, string? NextCursor);
}
