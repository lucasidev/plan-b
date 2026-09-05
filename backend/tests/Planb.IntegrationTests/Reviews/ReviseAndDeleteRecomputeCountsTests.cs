using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

// Corregir y borrar mueven los conteos publicados de la ficha, frase por frase (US-165). Cada
// escenario tiene su propia clase (y su propia base, vía RegisterApiFixture) para que la cátedra
// arranque sin una sola voz: mezclar varios en la misma clase contaminaría los conteos exactos
// que estos tests afirman con lo que publicó otro test de la misma clase.

/// <summary>Fixture compartido de este archivo: cuentas, publicar y leer la ficha de Pérez.</summary>
file static class Fixture
{
    public static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    public static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    public static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");

    public static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public static async Task<AuthenticatedClient> AccountAsync(
        RegisterApiFixture fixture, string label, int index)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            fixture, $"{label}-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    public static async Task<Guid> PublishAsync(
        AuthenticatedClient auth, int index, params (string ItemCode, short OptionValue)[] answers)
    {
        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211,
                termId = Terms[index % Terms.Length],
                chairId = (Guid?)ChairPerez,
                answers = answers.Select(a => new { itemCode = a.ItemCode, optionValue = a.OptionValue }),
                freeText = (string?)null,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());

        var body = await response.Content.ReadFromJsonAsync<PublishedDto>();
        return body!.Id;
    }

    public static async Task<GetChairFactsResponse> FactsAsync(RegisterApiFixture fixture)
    {
        var anonymous = fixture.Factory.CreateClient();
        var response = await anonymous.GetAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    public static int PercentOf(GetChairFactsResponse facts, string itemCode, string label)
    {
        var item = facts.ChairConduct.Concat(facts.StudentExperience)
            .SingleOrDefault(i => i.Code == itemCode);
        item.ShouldNotBeNull($"la ficha no publicó la frase {itemCode}");
        var slice = item!.Distribution.SingleOrDefault(d => d.Label == label);
        slice.ShouldNotBeNull($"{itemCode} no tiene una opción con la etiqueta \"{label}\"");
        return slice!.Percent;
    }

    public static int TotalOf(GetChairFactsResponse facts, string itemCode)
    {
        var item = facts.ChairConduct.Concat(facts.StudentExperience)
            .SingleOrDefault(i => i.Code == itemCode);
        item.ShouldNotBeNull($"la ficha no publicó la frase {itemCode}");
        return item!.Total;
    }

    private sealed record PublishedDto(Guid Id, int AnsweredItems);
}

/// <summary>
/// Corregir una sola respuesta mueve solo la frase tocada; la cursada sigue contando como una voz
/// más y la otra frase, sin tocar, no se mueve.
/// </summary>
public class CorrectingOneAnswerMovesOnlyThatItemsCountsTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public CorrectingOneAnswerMovesOnlyThatItemsCountsTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    /// <summary>US-165 E1</summary>
    [Fact]
    public async Task Correcting_one_answer_moves_only_that_items_distribution()
    {
        // 6 "Casi todas" + 3 "Faltaron muchas" de relleno; el autor entra como la décima voz,
        // también en "Faltaron muchas", así que la cátedra cruza el piso con esa respuesta puesta.
        for (var i = 0; i < 6; i++)
        {
            await Fixture.PublishAsync(
                await Fixture.AccountAsync(_fixture, "correct-fill", i), i,
                ("CHAIR_CLASSES_HELD", 1), ("CHAIR_ANSWERS_IN_CLASS", 1));
        }
        for (var i = 6; i < 9; i++)
        {
            await Fixture.PublishAsync(
                await Fixture.AccountAsync(_fixture, "correct-fill", i), i,
                ("CHAIR_CLASSES_HELD", 3), ("CHAIR_ANSWERS_IN_CLASS", 1));
        }

        var author = await Fixture.AccountAsync(_fixture, "correct-author", 9);
        var reviewId = await Fixture.PublishAsync(
            author, 9, ("CHAIR_CLASSES_HELD", 3), ("CHAIR_ANSWERS_IN_CLASS", 1));

        var before = await Fixture.FactsAsync(_fixture);
        before.IsPublished.ShouldBeTrue();
        before.ReviewCount.ShouldBe(10);
        Fixture.TotalOf(before, "CHAIR_CLASSES_HELD").ShouldBe(10);
        Fixture.PercentOf(before, "CHAIR_CLASSES_HELD", "Faltaron muchas").ShouldBe(40);
        Fixture.PercentOf(before, "CHAIR_CLASSES_HELD", "Casi todas").ShouldBe(60);
        Fixture.PercentOf(before, "CHAIR_ANSWERS_IN_CLASS", "Siempre").ShouldBe(100);

        // El autor corrige SOLO la respuesta de "¿Se dictaron las clases?": de "Faltaron muchas" a
        // "Faltaron algunas". Reenvía la misma respuesta de CHAIR_ANSWERS_IN_CLASS: no la toca.
        var revised = await author.Client.PutAsJsonAsync(
            $"/api/reviews/courses/{reviewId}",
            new
            {
                answers = new[]
                {
                    new { itemCode = "CHAIR_CLASSES_HELD", optionValue = (short)2 },
                    new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = (short)1 },
                },
                freeText = (string?)null,
            });
        revised.StatusCode.ShouldBe(HttpStatusCode.OK, await revised.Content.ReadAsStringAsync());

        var after = await Fixture.FactsAsync(_fixture);
        // La cursada sigue teniendo 10 voces: el autor sigue siendo una de ellas, solo cambió una
        // respuesta.
        after.ReviewCount.ShouldBe(10);
        Fixture.TotalOf(after, "CHAIR_CLASSES_HELD").ShouldBe(10);
        Fixture.PercentOf(after, "CHAIR_CLASSES_HELD", "Faltaron muchas").ShouldBe(30);
        Fixture.PercentOf(after, "CHAIR_CLASSES_HELD", "Faltaron algunas").ShouldBe(10);
        Fixture.PercentOf(after, "CHAIR_CLASSES_HELD", "Casi todas").ShouldBe(60);

        // Sin tocar el resto: la frase que reenvió igual no se mueve un solo punto.
        Fixture.TotalOf(after, "CHAIR_ANSWERS_IN_CLASS").ShouldBe(10);
        Fixture.PercentOf(after, "CHAIR_ANSWERS_IN_CLASS", "Siempre").ShouldBe(100);
    }
}

/// <summary>
/// Saltear una respuesta que ya se había dado (volverla "sin responder") solo baja el
/// denominador de esa frase; el resto de la reseña sigue contando sobre el total de antes.
/// </summary>
public class RevisingToUnansweredOnlyDropsThatItemsCountTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public RevisingToUnansweredOnlyDropsThatItemsCountTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    /// <summary>US-165 N3</summary>
    [Fact]
    public async Task Revising_an_answer_back_to_unanswered_only_drops_that_items_count()
    {
        for (var i = 0; i < 9; i++)
        {
            await Fixture.PublishAsync(
                await Fixture.AccountAsync(_fixture, "unanswer-fill", i), i,
                ("CHAIR_CLASSES_HELD", 1), ("CHAIR_ANSWERS_IN_CLASS", 1));
        }

        var author = await Fixture.AccountAsync(_fixture, "unanswer-author", 9);
        var reviewId = await Fixture.PublishAsync(
            author, 9, ("CHAIR_CLASSES_HELD", 3), ("CHAIR_ANSWERS_IN_CLASS", 1));

        var before = await Fixture.FactsAsync(_fixture);
        before.ReviewCount.ShouldBe(10);
        Fixture.TotalOf(before, "CHAIR_CLASSES_HELD").ShouldBe(10);
        Fixture.PercentOf(before, "CHAIR_CLASSES_HELD", "Faltaron muchas").ShouldBe(10);
        Fixture.TotalOf(before, "CHAIR_ANSWERS_IN_CLASS").ShouldBe(10);

        // El autor deja de responder "¿Se dictaron las clases?" (la saltea), sin tocar el resto.
        var revised = await author.Client.PutAsJsonAsync(
            $"/api/reviews/courses/{reviewId}",
            new
            {
                answers = new[]
                {
                    new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = (short)1 },
                },
                freeText = (string?)null,
            });
        revised.StatusCode.ShouldBe(HttpStatusCode.OK, await revised.Content.ReadAsStringAsync());

        var after = await Fixture.FactsAsync(_fixture);
        // La reseña sigue siendo una de las 10: saltear una respuesta no la saca de la cursada.
        after.ReviewCount.ShouldBe(10);

        // La frase saltada pierde exactamente esa voz.
        Fixture.TotalOf(after, "CHAIR_CLASSES_HELD").ShouldBe(9);
        Fixture.PercentOf(after, "CHAIR_CLASSES_HELD", "Faltaron muchas").ShouldBe(0);
        Fixture.PercentOf(after, "CHAIR_CLASSES_HELD", "Casi todas").ShouldBe(100);

        // El resto de sus respuestas sigue contando sobre el total de antes.
        Fixture.TotalOf(after, "CHAIR_ANSWERS_IN_CLASS").ShouldBe(10);
        Fixture.PercentOf(after, "CHAIR_ANSWERS_IN_CLASS", "Siempre").ShouldBe(100);
    }
}

/// <summary>
/// Borrar la reseña la saca de cualquier conteo, en cualquier frase que haya contestado, y baja
/// en uno la cantidad de voces de la cursada.
/// </summary>
public class DeletingRemovesTheReviewFromEveryItemsCountsTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public DeletingRemovesTheReviewFromEveryItemsCountsTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    /// <summary>US-165 E2</summary>
    [Fact]
    public async Task Deleting_removes_the_review_from_every_items_counts()
    {
        // Diez de relleno, mezclados en dos frases a la vez (4 "Faltaron muchas" / 6 "Casi
        // todas"; 7 "Casi siempre" / 3 "A veces"), y el autor entra como la voz once en el lado
        // que más pesa de las dos: así borrarlo mueve ambas frases, no una sola.
        for (var i = 0; i < 10; i++)
        {
            var classesHeld = (short)(i < 4 ? 3 : 1);
            var understood = (short)(i < 7 ? 1 : 2);
            await Fixture.PublishAsync(
                await Fixture.AccountAsync(_fixture, "delcount-fill", i), i,
                ("CHAIR_CLASSES_HELD", classesHeld), ("STUDENT_UNDERSTOOD_IN_CLASS", understood));
        }

        var author = await Fixture.AccountAsync(_fixture, "delcount-author", 10);
        var reviewId = await Fixture.PublishAsync(
            author, 10, ("CHAIR_CLASSES_HELD", 3), ("STUDENT_UNDERSTOOD_IN_CLASS", 1));

        var before = await Fixture.FactsAsync(_fixture);
        before.ReviewCount.ShouldBe(11);
        Fixture.TotalOf(before, "CHAIR_CLASSES_HELD").ShouldBe(11);
        Fixture.PercentOf(before, "CHAIR_CLASSES_HELD", "Faltaron muchas").ShouldBe(45);
        Fixture.TotalOf(before, "STUDENT_UNDERSTOOD_IN_CLASS").ShouldBe(11);
        Fixture.PercentOf(before, "STUDENT_UNDERSTOOD_IN_CLASS", "Casi siempre").ShouldBe(73);

        var deleted = await author.Client.DeleteAsync($"/api/reviews/courses/{reviewId}");
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var after = await Fixture.FactsAsync(_fixture);
        // Once menos uno: diez, todavía arriba del piso, así que la ficha sigue publicando.
        after.IsPublished.ShouldBeTrue();
        after.ReviewCount.ShouldBe(10);

        Fixture.TotalOf(after, "CHAIR_CLASSES_HELD").ShouldBe(10);
        Fixture.PercentOf(after, "CHAIR_CLASSES_HELD", "Faltaron muchas").ShouldBe(40);
        Fixture.TotalOf(after, "STUDENT_UNDERSTOOD_IN_CLASS").ShouldBe(10);
        Fixture.PercentOf(after, "STUDENT_UNDERSTOOD_IN_CLASS", "Casi siempre").ShouldBe(70);
    }
}
