using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de corregir y borrar lo aportado (US-165, US-166):
///   - <c>GET /api/reviews/cursadas/me</c>
///   - <c>PUT /api/reviews/cursadas/{id}</c>
///   - <c>DELETE /api/reviews/cursadas/{id}</c>
///
/// <para>
/// Lo que más importa acá es lo que NO se puede hacer: una reseña ajena tiene que responder 404 y
/// no 403, porque decir "existe pero no es tuya" ya sería contarle a alguien que otra persona
/// reseñó esa cursada. El anonimato no se filtra ni por un código de error.
/// </para>
/// </summary>
public class MyCourseReviewsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez =
        Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_2c =
        Guid.Parse("00000005-0000-4000-a000-000000000002");

    public MyCourseReviewsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private async Task<AuthenticatedClient> StudentAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"mine-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    private static async Task<Guid> PublishAsync(
        AuthenticatedClient auth, Guid termId, string? freeText = null)
    {
        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/cursadas",
            new
            {
                subjectId = Subject211,
                termId,
                chairId = (Guid?)ChairPerez,
                answers = new[]
                {
                    new { itemCode = "COURSE_OUTCOME", optionValue = 2 },
                    new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = 3 },
                },
                freeText,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<PublishedDto>();
        return body!.Id;
    }

    [Fact]
    public async Task My_reviews_carry_what_i_answered_so_i_can_correct_it()
    {
        var auth = await StudentAsync("list");
        await PublishAsync(auth, Term2024_1c, freeText: "algo que escribí");

        var mine = await auth.Client.GetFromJsonAsync<List<MyCourseReviewView>>(
            "/api/reviews/cursadas/me");

        mine.ShouldNotBeNull();
        var review = mine!.Single();
        review.SubjectCode.ShouldBe("211");
        review.ChairName.ShouldBe("Pérez");
        review.AnsweredItems.ShouldBe(2);

        // Las respuestas de a una viajan SOLO acá y solo hacia su autor: sin ellas, corregir una
        // obligaría a contestar las catorce preguntas de nuevo.
        review.Answers.Count.ShouldBe(2);
        review.Answers.ShouldContain(a => a.ItemCode == "COURSE_OUTCOME" && a.OptionValue == 2);

        // Y el texto libre, que nunca se publica, su autor sí puede releerlo antes de decidir.
        review.FreeText.ShouldBe("algo que escribí");
    }

    [Fact]
    public async Task Correcting_replaces_the_whole_set_so_dropping_an_answer_works()
    {
        var auth = await StudentAsync("revise");
        var id = await PublishAsync(auth, Term2024_1c, freeText: "me arrepiento de esto");

        // Se cambia una, se agrega otra, y la de conducta se deja de contestar.
        var revised = await auth.Client.PutAsJsonAsync(
            $"/api/reviews/cursadas/{id}",
            new
            {
                answers = new[]
                {
                    new { itemCode = "COURSE_OUTCOME", optionValue = 1 },
                    new { itemCode = "STUDENT_COULD_ASK", optionValue = 3 },
                },
                freeText = (string?)null,
            });

        revised.StatusCode.ShouldBe(HttpStatusCode.OK);

        var mine = await auth.Client.GetFromJsonAsync<List<MyCourseReviewView>>(
            "/api/reviews/cursadas/me");
        var review = mine!.Single();

        review.AnsweredItems.ShouldBe(2);
        review.Answers.ShouldContain(a => a.ItemCode == "COURSE_OUTCOME" && a.OptionValue == 1);
        review.Answers.ShouldContain(a => a.ItemCode == "STUDENT_COULD_ASK");

        // La que se dejó de contestar DESAPARECE: vuelve a no contar en el denominador de su ítem,
        // que es la mitad de por qué alguien corrige.
        review.Answers.ShouldNotContain(a => a.ItemCode == "CHAIR_ANSWERS_IN_CLASS");

        // Y el texto se soltó.
        review.FreeText.ShouldBeNull();
    }

    [Fact]
    public async Task Deleting_takes_the_review_out_of_the_counts()
    {
        var auth = await StudentAsync("delete");
        var id = await PublishAsync(auth, Term2024_1c);

        var deleted = await auth.Client.DeleteAsync($"/api/reviews/cursadas/{id}");
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var mine = await auth.Client.GetFromJsonAsync<List<MyCourseReviewView>>(
            "/api/reviews/cursadas/me");
        mine.ShouldBeEmpty();

        // Borrar de nuevo no rompe: ya no está.
        var again = await auth.Client.DeleteAsync($"/api/reviews/cursadas/{id}");
        again.StatusCode.ShouldBe(HttpStatusCode.NotFound);

        // Y borrarla libera la cursada: se puede volver a contar la misma materia y período.
        var republished = await PublishAsync(auth, Term2024_1c);
        republished.ShouldNotBe(id);
    }

    [Fact]
    public async Task Someone_elses_review_answers_404_and_never_403()
    {
        var author = await StudentAsync("author");
        var stranger = await StudentAsync("stranger");
        var id = await PublishAsync(author, Term2024_2c);

        // 403 diría "existe, pero no es tuya", y eso ya es contar que alguien reseñó esa cursada.
        var revised = await stranger.Client.PutAsJsonAsync(
            $"/api/reviews/cursadas/{id}",
            new { answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = 1 } }, freeText = (string?)null });
        revised.StatusCode.ShouldBe(HttpStatusCode.NotFound);

        var deleted = await stranger.Client.DeleteAsync($"/api/reviews/cursadas/{id}");
        deleted.StatusCode.ShouldBe(HttpStatusCode.NotFound);

        // Y la del otro sigue intacta.
        var mine = await author.Client.GetFromJsonAsync<List<MyCourseReviewView>>(
            "/api/reviews/cursadas/me");
        mine!.ShouldContain(r => r.Id == id);

        // El de al lado no ve nada de eso en su propia lista.
        var theirs = await stranger.Client.GetFromJsonAsync<List<MyCourseReviewView>>(
            "/api/reviews/cursadas/me");
        theirs.ShouldBeEmpty();
    }

    [Fact]
    public async Task Reading_my_reviews_without_a_session_is_unauthorized()
    {
        var anonymous = _fixture.Factory.CreateClient();

        var response = await anonymous.GetAsync("/api/reviews/cursadas/me");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record PublishedDto(Guid Id, int AnsweredItems);
}
