using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Infrastructure.Persistence;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Dar de baja la cuenta no toca ninguna reseña que quedó aportada (US-166, ADR-0044): ni sus
/// respuestas, ni los conteos que sostienen en la ficha, ni el campo libre que traía. Cátedra
/// propia (no la sembrada) para que la cátedra arranque sin una sola voz y los conteos exactos no
/// dependan de qué más haya publicado otro test.
/// </summary>
public class DeactivateAccountPreservesReviewsTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

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

    public DeactivateAccountPreservesReviewsTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private async Task<AuthenticatedClient> AccountAsync(string label, int index)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"{label}-{index}.{Guid.NewGuid():N}@planb.local");

        (await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        return auth;
    }

    private async Task<Guid> PublishAsync(AuthenticatedClient auth, int index, string? freeText = null)
    {
        var response = await auth.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211,
                termId = Terms[index % Terms.Length],
                chairId = (Guid?)ChairPerez,
                answers = new[] { new { itemCode = "CHAIR_CLASSES_HELD", optionValue = (short)3 } },
                freeText,
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());

        var body = await response.Content.ReadFromJsonAsync<PublishedDto>();
        return body!.Id;
    }

    private async Task<GetChairFactsResponse> FactsAsync()
    {
        var anonymous = _fixture.Factory.CreateClient();
        var response = await anonymous.GetAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }

    /// <summary>US-166 E2, N2</summary>
    [Fact]
    public async Task Deactivating_the_account_leaves_the_review_and_its_free_text_untouched()
    {
        for (var i = 0; i < 9; i++)
        {
            await PublishAsync(await AccountAsync("baja-fill", i), i);
        }

        var freeText = $"Algo que preferiría que no quedara ni anonimizado. SENTINEL-{Guid.NewGuid():N}";
        var author = await AccountAsync("baja-author", 9);
        var reviewId = await PublishAsync(author, 9, freeText);

        var before = await FactsAsync();
        before.IsPublished.ShouldBeTrue();
        before.ReviewCount.ShouldBe(10);
        var itemBefore = before.ChairConduct.Single(i => i.Code == "CHAIR_CLASSES_HELD");
        itemBefore.Total.ShouldBe(10);
        var faltaronMuchasBefore = itemBefore.Distribution.Single(d => d.Label == "Faltaron muchas").Percent;

        var deactivate = await author.Client.DeleteAsync("/api/me/account");
        deactivate.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // La ficha no se mueve un solo punto: la reseña sigue siendo una de las diez voces, sin
        // ningún cambio, ya sin nombre ni cuenta detrás.
        var after = await FactsAsync();
        after.IsPublished.ShouldBeTrue();
        after.ReviewCount.ShouldBe(10);
        var itemAfter = after.ChairConduct.Single(i => i.Code == "CHAIR_CLASSES_HELD");
        itemAfter.Total.ShouldBe(10);
        itemAfter.Distribution.Single(d => d.Label == "Faltaron muchas").Percent.ShouldBe(faltaronMuchasBefore);

        // Y la reseña puntual, con su campo libre, no se borró ni se tocó: la baja de cuenta no es
        // el mecanismo para sacar una reseña de a una (eso es Editar, US-165).
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ReviewsDbContext>();
        var review = await db.Reviews.FindAsync(new ReviewId(reviewId));
        review.ShouldNotBeNull();
        review!.FreeText.ShouldBe(freeText);
    }

    private sealed record PublishedDto(Guid Id, int AnsweredItems);
}
