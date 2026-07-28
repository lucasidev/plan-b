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
/// Tests de integración de US-023 (guardar simulación como borrador privado, editarla, borrarla y
/// publicarla). Mismo patrón que <see cref="EvaluateSimulationEndpointTests"/>: cada test arma su
/// propia Career + CareerPlan + Subjects (+ una Commission real) vía <see cref="AcademicDbContext"/>,
/// aislado del seed, y ejercita los endpoints reales de <c>/api/me/simulations/drafts</c>.
/// </summary>
public class SimulationDraftsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    // Períodos reales de UNSTA, del seed academic. Se reusan en vez de crear otros porque
    // (universidad, año, número) es único y cada test llama al helper de armado varias veces.
    private static readonly Guid Seed2026FirstTerm = Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid Seed2026SecondTerm = Guid.Parse("00000005-0000-4000-a000-000000000006");

    private readonly RegisterApiFixture _fixture;

    public SimulationDraftsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    /// <summary>Crea un user autenticado + StudentProfile activo sobre <paramref name="careerPlanId"/>.</summary>
    private async Task<AuthenticatedClient> StudentAsync(Guid careerPlanId, string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"drafts-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary>
    /// Arma una Career + CareerPlan propios (aislados del seed) con <paramref name="subjectCount"/>
    /// materias nuevas, más una Commission real sobre la primera materia (para poder verificar que
    /// el read model resuelve <c>commissionName</c>, no solo el id).
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
            $"Carrera Drafts {unique}",
            $"carrera-drafts-{unique}",
            clock,
            isOfficial: true).Value;
        db.Careers.Add(career);

        var plan = CareerPlan.Create(career.Id, 2015, clock, isOfficial: true).Value;
        db.CareerPlans.Add(plan);

        var subjects = new List<SubjectSeed>();
        for (var i = 0; i < subjectCount; i++)
        {
            var code = $"DFT{i}-{unique}";
            var name = $"Materia Drafts {i} {unique}";
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

        // El período tiene que ser uno real de la universidad de la carrera: guardar un borrador lo
        // valida. Antes acá alcanzaba un Guid.NewGuid() precisamente porque nadie lo validaba, y ese
        // atajo era el mismo agujero que dejaba publicar en el feed de la comunidad una comisión de
        // otra materia o de otro año.
        var termId = Seed2026FirstTerm;
        var commission = Commission.Create(
            subjects[0].Id, termId, "Comisión Drafts A",
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

    private static Task<HttpResponseMessage> UpdateDraftAsync(
        AuthenticatedClient student, Guid draftId, string? label,
        params (Guid SubjectId, Guid? CommissionId)[] items) =>
        student.Client.PatchAsJsonAsync(
            $"/api/me/simulations/drafts/{draftId}",
            new
            {
                label,
                items = items.Select(i => new { subjectId = i.SubjectId, commissionId = i.CommissionId }).ToList(),
            });

    private static Task<HttpResponseMessage> PromoteDraftAsync(AuthenticatedClient student, Guid draftId) =>
        student.Client.PostAsync($"/api/me/simulations/drafts/{draftId}/promote", content: null);

    private static Task<HttpResponseMessage> DeleteDraftAsync(AuthenticatedClient student, Guid draftId) =>
        student.Client.DeleteAsync($"/api/me/simulations/drafts/{draftId}");

    private static Task<HttpResponseMessage> ShareDraftAsync(AuthenticatedClient student, Guid draftId) =>
        student.Client.PostAsync($"/api/me/simulations/drafts/{draftId}/share", content: null);

    private static Task<HttpResponseMessage> UnshareDraftAsync(AuthenticatedClient student, Guid draftId) =>
        student.Client.PostAsync($"/api/me/simulations/drafts/{draftId}/unshare", content: null);

    private static async Task<ListDraftsDto> ListDraftsAsync(AuthenticatedClient student)
    {
        var response = await student.Client.GetAsync("/api/me/simulations/drafts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<ListDraftsDto>())!;
    }

    private static async Task<Guid> CreateDraftAndGetIdAsync(
        AuthenticatedClient student, Guid termId, string? label,
        params (Guid SubjectId, Guid? CommissionId)[] items)
    {
        var response = await CreateDraftAsync(student, termId, label, items);
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<IdDto>())!.Id;
    }

    [Fact]
    public async Task Create_ReturnsCreatedWithId()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "create");

        var response = await CreateDraftAsync(student, termId, "Mi simulación", (subjects[0].Id, null));

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<IdDto>();
        body.ShouldNotBeNull();
        body!.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Create_SubjectOutsideStudentsPlan_ReturnsBadRequest()
    {
        var (planId, _, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var (_, foreignSubjects, _, _) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "foreign");

        var response = await CreateDraftAsync(student, termId, null, (foreignSubjects[0].Id, null));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulation_draft.subject_not_in_plan");
    }

    // ── Validación cross-BC de los items del borrador ─────────────────────
    //
    // El validador es nuevo y sus cinco ramas de rechazo no las tocaba ningún test: los que existían
    // solo cubrían el happy path y la materia fuera del plan.

    [Fact]
    public async Task Create_TermFueraDeLaUniversidadDelAlumno_ReturnsBadRequest()
    {
        var (planId, subjects, _, _) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "term-uni");

        var response = await CreateDraftAsync(student, Guid.NewGuid(), null, (subjects[0].Id, null));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulation_draft.term_not_in_university");
    }

    [Fact]
    public async Task Create_ComisionInexistente_ReturnsBadRequest()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "comm-404");

        var response = await CreateDraftAsync(
            student, termId, null, (subjects[0].Id, Guid.NewGuid()));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulation_draft.commission_not_found");
    }

    /// <summary>
    /// Una comisión real, pero de otra materia. Sin este corte el borrador queda diciendo "curso X
    /// en la comisión de Y", y de ahí sale el horario que el planificador dibuja en la grilla.
    /// </summary>
    [Fact]
    public async Task Create_ComisionDeOtraMateria_ReturnsBadRequest()
    {
        var (planId, subjects, commissionId, termId) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "comm-subject");

        // commissionId pertenece a subjects[0]; se la colgamos a subjects[1].
        var response = await CreateDraftAsync(
            student, termId, null, (subjects[1].Id, commissionId));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulation_draft.commission_not_for_subject");
    }

    /// <summary>
    /// La comisión es de la materia correcta pero de otro período que el del borrador: la grilla
    /// mostraría un horario que no se dicta en el cuatrimestre que el alumno está planificando.
    /// </summary>
    [Fact]
    public async Task Create_ComisionDeOtroPeriodo_ReturnsBadRequest()
    {
        var (planId, subjects, commissionId, _) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "comm-term");

        var response = await CreateDraftAsync(
            student, Seed2026SecondTerm, null, (subjects[0].Id, commissionId));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulation_draft.commission_not_for_term");
    }

    /// <summary>El update pasa por el mismo validador: no alcanza con cubrir el create.</summary>
    [Fact]
    public async Task Update_ComisionDeOtraMateria_ReturnsBadRequest()
    {
        var (planId, subjects, commissionId, termId) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "upd-comm");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, null, (subjects[0].Id, null));

        var response = await UpdateDraftAsync(
            student, draftId, null, (subjects[1].Id, commissionId));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulation_draft.commission_not_for_subject");
    }

    [Fact]
    public async Task List_ResolvesSubjectAndCommissionNamesWithoutExtraCalls()
    {
        var (planId, subjects, commissionId, termId) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "list");

        var draftId = await CreateDraftAndGetIdAsync(
            student, termId, "Con comisión",
            (subjects[0].Id, commissionId), (subjects[1].Id, null));

        var list = await ListDraftsAsync(student);

        var draft = list.Items.ShouldHaveSingleItem();
        draft.Id.ShouldBe(draftId);
        draft.TermId.ShouldBe(termId);
        draft.Label.ShouldBe("Con comisión");
        draft.Status.ShouldBe("Draft");
        draft.Items.Count.ShouldBe(2);

        var withCommission = draft.Items.Single(i => i.SubjectId == subjects[0].Id);
        withCommission.SubjectCode.ShouldBe(subjects[0].Code);
        withCommission.SubjectName.ShouldBe(subjects[0].Name);
        withCommission.CommissionId.ShouldBe(commissionId);
        withCommission.CommissionName.ShouldBe("Comisión Drafts A");

        var withoutCommission = draft.Items.Single(i => i.SubjectId == subjects[1].Id);
        withoutCommission.CommissionId.ShouldBeNull();
        withoutCommission.CommissionName.ShouldBeNull();
    }

    [Fact]
    public async Task Update_ReplacesLabelAndItems()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "update");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, "Original", (subjects[0].Id, null));

        var updateResponse = await UpdateDraftAsync(student, draftId, "Editado", (subjects[1].Id, null));

        updateResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var list = await ListDraftsAsync(student);
        var draft = list.Items.Single(d => d.Id == draftId);
        draft.Label.ShouldBe("Editado");
        draft.Items.ShouldHaveSingleItem();
        draft.Items[0].SubjectId.ShouldBe(subjects[1].Id);
    }

    [Fact]
    public async Task Update_KeepsOneSubjectChangesItsCommissionRemovesOneAndAddsAnother()
    {
        // Set mixto (mantiene subjects[0] con otra comisión, saca subjects[1], agrega subjects[2]):
        // el caso que expuso el bug real de EF Core acá (un item nuevo agregado a la colección de un
        // aggregate ya trackeado se detectaba Modified en vez de Added, generando un UPDATE fantasma
        // sobre una fila que no existía). Este test cubre justamente la mezcla "queda + se va + entra"
        // en un solo Update, no solo el swap completo de Update_ReplacesLabelAndItems.
        var (planId, subjects, commissionId, termId) = await CreatePlanWithSubjectsAsync(3);
        var student = await StudentAsync(planId, "update-mixed");
        var draftId = await CreateDraftAndGetIdAsync(
            student, termId, "Original", (subjects[0].Id, null), (subjects[1].Id, null));

        var updateResponse = await UpdateDraftAsync(
            student, draftId, "Editado",
            (subjects[0].Id, commissionId), (subjects[2].Id, null));

        updateResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var list = await ListDraftsAsync(student);
        var draft = list.Items.Single(d => d.Id == draftId);
        draft.Items.Count.ShouldBe(2);

        var kept = draft.Items.Single(i => i.SubjectId == subjects[0].Id);
        kept.CommissionId.ShouldBe(commissionId);

        draft.Items.ShouldContain(i => i.SubjectId == subjects[2].Id);
        draft.Items.ShouldNotContain(i => i.SubjectId == subjects[1].Id);
    }

    [Fact]
    public async Task Update_WithEmptyItems_ReturnsBadRequestAndLeavesDraftUnchanged()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "update-empty");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, "Original", (subjects[0].Id, null));

        var updateResponse = await student.Client.PatchAsJsonAsync(
            $"/api/me/simulations/drafts/{draftId}", new { label = "Original", items = Array.Empty<object>() });

        updateResponse.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var list = await ListDraftsAsync(student);
        list.Items.Single(d => d.Id == draftId).Items.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task Promote_ArchivesThePreviousActiveDraftForTheSameTerm()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "promote-flip");

        var draftAId = await CreateDraftAndGetIdAsync(student, termId, "A", (subjects[0].Id, null));
        (await PromoteDraftAsync(student, draftAId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var draftBId = await CreateDraftAndGetIdAsync(student, termId, "B", (subjects[1].Id, null));
        var promoteB = await PromoteDraftAsync(student, draftBId);

        promoteB.StatusCode.ShouldBe(HttpStatusCode.OK);
        var promoteBody = await promoteB.Content.ReadFromJsonAsync<PromoteDraftDto>();
        promoteBody.ShouldNotBeNull();
        promoteBody!.Status.ShouldBe("Active");

        var list = await ListDraftsAsync(student);
        list.Items.Single(d => d.Id == draftAId).Status.ShouldBe("Archived");
        list.Items.Single(d => d.Id == draftBId).Status.ShouldBe("Active");
    }

    [Fact]
    public async Task Promote_DoesNotAffectActiveDraftsOfADifferentTerm()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(2);
        var student = await StudentAsync(planId, "promote-other-term");
        var otherTermId = Seed2026SecondTerm;

        var draftOtherTermId = await CreateDraftAndGetIdAsync(student, otherTermId, "Otro término", (subjects[0].Id, null));
        (await PromoteDraftAsync(student, draftOtherTermId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var draftThisTermId = await CreateDraftAndGetIdAsync(student, termId, "Este término", (subjects[1].Id, null));
        (await PromoteDraftAsync(student, draftThisTermId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var list = await ListDraftsAsync(student);
        list.Items.Single(d => d.Id == draftOtherTermId).Status.ShouldBe("Active");
        list.Items.Single(d => d.Id == draftThisTermId).Status.ShouldBe("Active");
    }

    [Fact]
    public async Task Promote_AlreadyActive_IsIdempotentAndReturnsOk()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "promote-idempotent");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, null, (subjects[0].Id, null));
        (await PromoteDraftAsync(student, draftId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var second = await PromoteDraftAsync(student, draftId);

        second.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await second.Content.ReadFromJsonAsync<PromoteDraftDto>();
        body!.Status.ShouldBe("Active");
    }

    [Fact]
    public async Task Delete_RemovesTheDraftFromTheList()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "delete");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, null, (subjects[0].Id, null));

        var deleteResponse = await DeleteDraftAsync(student, draftId);

        deleteResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        var list = await ListDraftsAsync(student);
        list.Items.ShouldNotContain(d => d.Id == draftId);
    }

    [Fact]
    public async Task Update_delete_and_promote_on_another_students_draft_return_forbidden()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var owner = await StudentAsync(planId, "owner");
        var intruder = await StudentAsync(planId, "intruder");
        var draftId = await CreateDraftAndGetIdAsync(owner, termId, null, (subjects[0].Id, null));

        (await UpdateDraftAsync(intruder, draftId, "hijack", (subjects[0].Id, null)))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await PromoteDraftAsync(intruder, draftId)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await DeleteDraftAsync(intruder, draftId)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);

        // El intento del intruso no debe haber tocado nada: el owner sigue viendo su draft intacto.
        var list = await ListDraftsAsync(owner);
        list.Items.ShouldContain(d => d.Id == draftId);
    }

    [Fact]
    public async Task Update_delete_and_promote_on_a_nonexistent_draft_return_not_found()
    {
        var (planId, subjects, _, _) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "missing");
        var missingId = Guid.NewGuid();

        (await UpdateDraftAsync(student, missingId, "x", (subjects[0].Id, null)))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await PromoteDraftAsync(student, missingId)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await DeleteDraftAsync(student, missingId)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Share_SetsVisibilityToSharedAndReflectsInTheOwnList()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "share");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, "Para compartir", (subjects[0].Id, null));

        var response = await ShareDraftAsync(student, draftId);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ShareDraftDto>();
        body.ShouldNotBeNull();
        body!.Id.ShouldBe(draftId);
        body.Visibility.ShouldBe("Shared");

        var list = await ListDraftsAsync(student);
        list.Items.Single(d => d.Id == draftId).Visibility.ShouldBe("Shared");
    }

    [Fact]
    public async Task Share_AlreadyShared_IsIdempotentAndReturnsOk()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "share-idempotent");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, null, (subjects[0].Id, null));
        (await ShareDraftAsync(student, draftId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var second = await ShareDraftAsync(student, draftId);

        second.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await second.Content.ReadFromJsonAsync<ShareDraftDto>();
        body!.Visibility.ShouldBe("Shared");
    }

    [Fact]
    public async Task Unshare_RevertsToPrivateAndReflectsInTheOwnList()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "unshare");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, null, (subjects[0].Id, null));
        (await ShareDraftAsync(student, draftId)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await UnshareDraftAsync(student, draftId);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ShareDraftDto>();
        body!.Visibility.ShouldBe("Private");

        var list = await ListDraftsAsync(student);
        list.Items.Single(d => d.Id == draftId).Visibility.ShouldBe("Private");
    }

    [Fact]
    public async Task Unshare_AlreadyPrivate_IsIdempotentAndReturnsOk()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "unshare-idempotent");
        var draftId = await CreateDraftAndGetIdAsync(student, termId, null, (subjects[0].Id, null));

        var response = await UnshareDraftAsync(student, draftId);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ShareDraftDto>();
        body!.Visibility.ShouldBe("Private");
    }

    [Fact]
    public async Task Share_and_unshare_on_another_students_draft_return_forbidden()
    {
        var (planId, subjects, _, termId) = await CreatePlanWithSubjectsAsync(1);
        var owner = await StudentAsync(planId, "share-owner");
        var intruder = await StudentAsync(planId, "share-intruder");
        var draftId = await CreateDraftAndGetIdAsync(owner, termId, null, (subjects[0].Id, null));

        (await ShareDraftAsync(intruder, draftId)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await UnshareDraftAsync(intruder, draftId)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);

        // El intento del intruso no debe haber tocado nada: el draft del owner sigue Private.
        var list = await ListDraftsAsync(owner);
        list.Items.Single(d => d.Id == draftId).Visibility.ShouldBe("Private");
    }

    [Fact]
    public async Task Share_and_unshare_on_a_nonexistent_draft_return_not_found()
    {
        var (planId, _, _, _) = await CreatePlanWithSubjectsAsync(1);
        var student = await StudentAsync(planId, "share-missing");
        var missingId = Guid.NewGuid();

        (await ShareDraftAsync(student, missingId)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await UnshareDraftAsync(student, missingId)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var anon = _fixture.Factory.CreateClient();

        var response = await anon.GetAsync("/api/me/simulations/drafts");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record IdDto(Guid Id);

    private sealed record PromoteDraftDto(Guid Id, string Status);

    private sealed record ShareDraftDto(Guid Id, string Visibility);

    private sealed record DraftListItemSubjectDto(
        Guid SubjectId, string SubjectCode, string SubjectName, Guid? CommissionId, string? CommissionName);

    private sealed record DraftListItemDto(
        Guid Id, Guid TermId, string? Label, string Status, string Visibility,
        List<DraftListItemSubjectDto> Items, DateTimeOffset CreatedAt);

    private sealed record ListDraftsDto(List<DraftListItemDto> Items);

    private sealed record SubjectSeed(Guid Id, string Code, string Name);
}
