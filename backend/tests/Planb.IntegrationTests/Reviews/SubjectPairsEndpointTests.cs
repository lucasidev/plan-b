using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.PublishReview;
using Planb.Reviews.Application.Features.SubjectFacts;
using Planb.Reviews.Domain.Reviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de con qué otras materias se llevó una (US-143), en la ficha de materia.
///
/// <para>
/// Lo que se prueba acá y no en el unit del calculador: que el self-join sobre
/// <c>reviews</c> arme los pares que tiene que armar. En particular que <b>el mismo período
/// sea condición</b>: dos materias que la misma cuenta reseñó en cuatrimestres distintos no se
/// llevaron juntas, y ese es el error que un join mal escrito produce sin que nada chille.
/// </para>
/// </summary>
public class SubjectPairsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // Materias del mismo plan. 211 es la única con cátedras sembradas; el resto son cualesquiera.
    //
    // Cada test usa las suyas y no las comparte: un par no es de una cuenta, es de la materia, así
    // que dos tests que publiquen sobre la misma se pisan y el resultado pasa a depender del orden
    // en que xUnit corra la clase.
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid Subject121 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid SubjectTakenAlone =
        Guid.Parse("00000004-0000-4000-a000-000000000003");
    private static readonly Guid SubjectDeletedSide =
        Guid.Parse("00000004-0000-4000-a000-000000000007");
    private static readonly Guid SubjectSurvivingSide =
        Guid.Parse("00000004-0000-4000-a000-000000000008");
    private static readonly Guid SubjectCrowdedA =
        Guid.Parse("00000004-0000-4000-a000-000000000009");
    private static readonly Guid SubjectCrowdedB =
        Guid.Parse("00000004-0000-4000-a000-000000000010");
    // Par propio para el piso (ninguna otra prueba de esta clase lo toca): siete cuentas, ni una
    // décima.
    private static readonly Guid SubjectBelowFloorA =
        Guid.Parse("00000004-0000-4000-a000-000000000004");
    private static readonly Guid SubjectBelowFloorB =
        Guid.Parse("00000004-0000-4000-a000-000000000006");
    // 312 y 314, que no son correlativa de ninguna: archivar una materia de la que otra depende lo
    // rechaza el catálogo, y lo que se prueba acá es el par, no esa regla.
    private static readonly Guid SubjectArchivedSide =
        Guid.Parse("00000004-0000-4000-a000-000000000019");
    private static readonly Guid SubjectArchivedPartner =
        Guid.Parse("00000004-0000-4000-a000-000000000021");

    private static readonly Guid TermA = Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid TermB = Guid.Parse("00000005-0000-4000-a000-000000000002");

    public SubjectPairsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private async Task<AuthenticatedClient> AccountAsync()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"pairs-{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary><paramref name="outcome"/> 1 y 2 son llegar al final; 3 en adelante, no.</summary>
    private static async Task<Guid> ReviewAsync(
        AuthenticatedClient auth, Guid subjectId, Guid termId, int outcome = 1)
    {
        var published = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId,
                termId,
                chairId = (Guid?)null,
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = outcome } },
                freeText = (string?)null,
            });
        published.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await published.Content.ReadFromJsonAsync<PublishReviewResponse>();
        body.ShouldNotBeNull();
        return body!.Id;
    }

    private async Task<GetSubjectFactsResponse> FactsAsync(Guid subjectId)
    {
        var response = await _anonymous.GetAsync($"/api/reviews/subjects/{subjectId}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var facts = await response.Content.ReadFromJsonAsync<GetSubjectFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    /// <summary>
    /// El recorrido en un test y no en tres: los pares son globales por materia, así que dos tests
    /// que publiquen sobre las mismas se contaminan según el orden en que xUnit los corra.
    ///
    /// US-143 N2: el tramo "apart" es la cuenta que llevó las dos materias en períodos distintos, y
    /// el conteo del par no se mueve un solo voto por ella.
    /// </summary>
    [Fact]
    public async Task Pairs_come_from_the_same_account_in_the_same_term_and_respect_their_own_floor()
    {
        // Una cuenta que las lleva juntas: el par existe pero está lejos del piso.
        var together = await AccountAsync();
        await ReviewAsync(together, Subject211, TermA);
        await ReviewAsync(together, Subject121, TermA);

        var facts = await FactsAsync(Subject211);
        var pair = facts.TakenWith.ShouldHaveSingleItem();
        pair.SubjectId.ShouldBe(Subject121);
        pair.TogetherCount.ShouldBe(1);

        // Bajo el piso se dice, no se esconde, y con cuánto le falta.
        pair.IsPublished.ShouldBeFalse();
        pair.MissingToPublish.ShouldBe(PublishingRules.SubjectPairMinimumReviews - 1);

        // Y el conteo de los que dejaron alguna no viaja bajo el piso.
        pair.DroppedCount.ShouldBe(0);

        // Una cuenta que las cursó en períodos distintos NO las llevó juntas: el conteo no se mueve.
        var apart = await AccountAsync();
        await ReviewAsync(apart, Subject211, TermA);
        await ReviewAsync(apart, Subject121, TermB);

        var after = await FactsAsync(Subject211);
        after.TakenWith.ShouldHaveSingleItem().TogetherCount.ShouldBe(1);
    }

    [Fact]
    public async Task A_subject_nobody_took_with_another_has_no_pairs()
    {
        var auth = await AccountAsync();
        await ReviewAsync(auth, SubjectTakenAlone, TermA);

        var facts = await FactsAsync(SubjectTakenAlone);

        facts.TakenWith.ShouldBeEmpty();
    }

    /// <summary>
    /// Método publica que borrar una reseña la saca de todos los conteos donde sumó. Acá se pinea
    /// del lado del par, que es donde la promesa se rompe más callada: el par no vive en ninguna
    /// tabla, se arma de un self-join sobre <c>reviews</c>, así que una fila que sobreviva
    /// al borrado sigue contando y nadie se entera.
    ///
    /// <para>
    /// Se mira desde <b>los dos lados</b>: el par desaparece tanto de la materia cuya reseña se
    /// borró como de la otra. Un filtro puesto en una sola rama del join deja pasar la mitad.
    /// </para>
    /// </summary>
    [Fact]
    public async Task Deleting_a_review_removes_the_pair_it_had_formed_on_both_sides()
    {
        var auth = await AccountAsync();
        var doomed = await ReviewAsync(auth, SubjectDeletedSide, TermA);
        await ReviewAsync(auth, SubjectSurvivingSide, TermA);

        // Antes del borrado el par existe, y se ve desde las dos materias.
        (await FactsAsync(SubjectDeletedSide)).TakenWith
            .ShouldHaveSingleItem().SubjectId.ShouldBe(SubjectSurvivingSide);
        (await FactsAsync(SubjectSurvivingSide)).TakenWith
            .ShouldHaveSingleItem().SubjectId.ShouldBe(SubjectDeletedSide);

        var deleted = await auth.Client.DeleteAsync($"/api/reviews/courses/{doomed}");
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        (await FactsAsync(SubjectDeletedSide)).TakenWith.ShouldBeEmpty();
        (await FactsAsync(SubjectSurvivingSide)).TakenWith.ShouldBeEmpty();
    }

    /// <summary>
    /// US-143 N1: bajo el piso, el par no publica el conteo de las que dejaron una (el mismo
    /// problema de denominador que el piso existe para evitar), pero sigue diciendo cuánto le
    /// falta, igual que cualquier otra ficha bajo el piso.
    ///
    /// <para>
    /// Con tres de las siete cuentas dejando una de las dos materias de verdad: si el conteo
    /// escondido fuera en realidad 0 porque nadie dejó nada, este test no distinguiría "se
    /// esconde" de "no hay nada que esconder". Por eso hace falta un abandono real.
    /// </para>
    /// </summary>
    [Fact]
    public async Task Below_the_floor_the_pair_hides_how_many_dropped_but_still_says_how_many_are_missing()
    {
        const int reviewers = 7;
        const int dropped = 3;

        for (var i = 0; i < reviewers; i++)
        {
            var auth = await AccountAsync();
            var outcome = i < dropped ? 3 : 1;
            await ReviewAsync(auth, SubjectBelowFloorA, TermA, outcome);
            await ReviewAsync(auth, SubjectBelowFloorB, TermA);
        }

        var facts = await FactsAsync(SubjectBelowFloorA);
        var pair = facts.TakenWith.ShouldHaveSingleItem();

        pair.SubjectId.ShouldBe(SubjectBelowFloorB);
        pair.IsPublished.ShouldBeFalse();
        pair.MissingToPublish.ShouldBe(PublishingRules.SubjectPairMinimumReviews - reviewers);

        // El conteo de los que dejaron alguna no viaja bajo el piso, aunque de verdad hayan sido 3.
        pair.DroppedCount.ShouldBe(0);
    }

    /// <summary>
    /// E1 de US-143: cruzado el piso, el par publica sus dos números exactos ("N la llevaron
    /// juntas", "M dejaron una") para ese período, y se lee <b>sin cuenta</b>.
    ///
    /// <para>
    /// Es el camino feliz de la story y hasta acá no lo cubría nadie de punta a punta: los otros
    /// tests trabajan bajo el piso, donde el conteo de las que dejaron ni siquiera viaja.
    /// </para>
    /// </summary>
    [Fact]
    public async Task Above_the_floor_the_pair_publishes_both_counts_for_that_term()
    {
        const int dropped = 4;

        for (var i = 0; i < PublishingRules.SubjectPairMinimumReviews; i++)
        {
            var auth = await AccountAsync();

            // Los primeros dejan una de las dos; el resto llega al final en las dos.
            var outcome = i < dropped ? 3 : 1;
            await ReviewAsync(auth, SubjectCrowdedA, TermA, outcome);
            await ReviewAsync(auth, SubjectCrowdedB, TermA);
        }

        var facts = await FactsAsync(SubjectCrowdedA);
        var pair = facts.TakenWith.ShouldHaveSingleItem();

        pair.SubjectId.ShouldBe(SubjectCrowdedB);
        pair.TogetherCount.ShouldBe(PublishingRules.SubjectPairMinimumReviews);
        pair.IsPublished.ShouldBeTrue();
        pair.MissingToPublish.ShouldBe(0);

        // Cruzado el piso, el conteo de quienes dejaron alguna sí viaja.
        pair.DroppedCount.ShouldBe(dropped);
    }

    /// <summary>
    /// El edge de US-143: una materia sale del plan cuando la carrera se reforma, y el par la sigue
    /// contando. La reseña queda pegada al período y a la materia, no a que el plan de hoy la tenga.
    ///
    /// <para>
    /// Se archiva la materia (soft delete, US-062: no hay hard delete porque hay reseñas colgando) y
    /// el par tiene que sobrevivir. Si algún día el read filtrara por materia vigente, se cae acá.
    /// </para>
    /// </summary>
    [Fact]
    public async Task A_subject_that_leaves_the_plan_keeps_counting_in_the_pair()
    {
        var auth = await AccountAsync();
        await ReviewAsync(auth, SubjectArchivedSide, TermA);
        await ReviewAsync(auth, SubjectArchivedPartner, TermA);

        var admin = await AuthenticatedClient.CreateAsync(
            _fixture, $"pairs-admin-{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);
        var archived = await admin.Client.DeleteAsync(
            $"/api/academic/subjects/{SubjectArchivedPartner}");
        archived.IsSuccessStatusCode.ShouldBeTrue();

        var facts = await FactsAsync(SubjectArchivedSide);

        facts.TakenWith.ShouldHaveSingleItem().SubjectId.ShouldBe(SubjectArchivedPartner);
    }
}
