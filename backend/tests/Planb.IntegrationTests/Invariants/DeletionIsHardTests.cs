using System.Net;
using System.Net.Http.Json;
using Npgsql;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.Reviews.Application.Features.PublishReview;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// El borrado es duro (Método lo promete): borrar una reseña la saca de mis reseñas, le resta
/// una voz a la ficha en la lectura siguiente, y la fila deja de existir en la base. No hay
/// soft delete de una reseña individual: no queda marcada, no está.
/// </summary>
public class DeletionIsHardTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public DeletionIsHardTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private async Task<AuthenticatedClient> AccountAsync(int index)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"harddelete-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    private static async Task<Guid> ReviewAsync(AuthenticatedClient auth, int index)
    {
        var published = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211,
                termId = Terms[index % Terms.Length],
                chairId = (Guid?)ChairPerez,
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = 1 } },
                freeText = (string?)null,
            });
        published.StatusCode.ShouldBe(HttpStatusCode.Created, await published.Content.ReadAsStringAsync());

        var body = await published.Content.ReadFromJsonAsync<PublishReviewResponse>();
        body.ShouldNotBeNull();
        return body!.Id;
    }

    private async Task<GetChairFactsResponse> FichaAsync()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    /// <summary>
    /// Once reseñas para no salir del piso al borrar una: así <see cref="GetChairFactsResponse.ReviewCount"/>
    /// es un número confiable antes y después (bajo el piso la ficha solo garantiza
    /// <c>ReviewsMissingToPublish</c>, no el conteo, y eso es harina de otro invariante).
    /// </summary>
    [Fact]
    public async Task Deleting_a_review_removes_it_from_mine_the_ficha_and_the_row()
    {
        var accounts = new List<AuthenticatedClient>();
        var reviewIds = new List<Guid>();
        for (var i = 0; i < 11; i++)
        {
            var auth = await AccountAsync(i);
            accounts.Add(auth);
            reviewIds.Add(await ReviewAsync(auth, i));
        }

        var before = await FichaAsync();
        before.IsPublished.ShouldBeTrue();
        before.ReviewCount.ShouldBe(11);

        var doomedAuthor = accounts[0];
        var doomedReviewId = reviewIds[0];

        var deleted = await doomedAuthor.Client.DeleteAsync($"/api/reviews/courses/{doomedReviewId}");
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Ya no aparece en mis reseñas.
        var mine = await doomedAuthor.Client.GetFromJsonAsync<List<MyReviewView>>("/api/reviews/courses/me");
        mine.ShouldNotBeNull();
        mine!.ShouldNotContain(r => r.Id == doomedReviewId);

        // La ficha cuenta una voz menos, en la lectura siguiente.
        var after = await FichaAsync();
        after.IsPublished.ShouldBeTrue();
        after.ReviewCount.ShouldBe(10);

        // Y la fila no existe: ni soft-deleted, no está.
        var connectionString = new NpgsqlConnectionStringBuilder(TestConnectionString.Resolve())
        {
            Database = _fixture.DatabaseName,
        }.ConnectionString;

        await using var db = new NpgsqlConnection(connectionString);
        await db.OpenAsync();
        await using var command = new NpgsqlCommand(
            "SELECT COUNT(*) FROM reviews.reviews WHERE id = @id", db);
        command.Parameters.AddWithValue("id", doomedReviewId);
        var rowCount = (long)(await command.ExecuteScalarAsync())!;
        rowCount.ShouldBe(0);
    }
}
