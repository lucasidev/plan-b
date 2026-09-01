using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.PublishCourseReview;
using Planb.Reviews.Application.Features.SubjectFacts;
using Planb.Reviews.Domain.CourseReviews;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de con qué otras materias se llevó una (US-143), en la ficha de materia.
///
/// <para>
/// Lo que se prueba acá y no en el unit del calculador: que el self-join sobre
/// <c>course_reviews</c> arme los pares que tiene que armar. En particular que <b>el mismo período
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
            "/api/reviews/cursadas",
            new
            {
                subjectId,
                termId,
                chairId = (Guid?)null,
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = outcome } },
                freeText = (string?)null,
            });
        published.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await published.Content.ReadFromJsonAsync<PublishCourseReviewResponse>();
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
    /// tabla, se arma de un self-join sobre <c>course_reviews</c>, así que una fila que sobreviva
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

        var deleted = await auth.Client.DeleteAsync($"/api/reviews/cursadas/{doomed}");
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        (await FactsAsync(SubjectDeletedSide)).TakenWith.ShouldBeEmpty();
        (await FactsAsync(SubjectSurvivingSide)).TakenWith.ShouldBeEmpty();
    }
}
