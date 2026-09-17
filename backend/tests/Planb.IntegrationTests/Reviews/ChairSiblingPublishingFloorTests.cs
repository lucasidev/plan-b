using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.ChairFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

file static class ChairSiblingPublishingFloorFixture
{
    public static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    public static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");
    public static readonly Guid ChairPerez =
        Guid.Parse("00000008-0000-4000-a000-000000000001");
    public static readonly Guid ChairGonzalez =
        Guid.Parse("00000008-0000-4000-a000-000000000002");
    public static readonly Guid ChairRuiz =
        Guid.Parse("00000008-0000-4000-a000-000000000003");

    public static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public static async Task PublishAsync(
        RegisterApiFixture fixture,
        Guid chairId,
        int count,
        short optionValue,
        string accountPrefix)
    {
        for (var i = 0; i < count; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                fixture, $"comparison-floor-{accountPrefix}-{i}.{Guid.NewGuid():N}@planb.local");

            (await auth.Client.PostAsJsonAsync(
                "/api/me/student-profiles",
                new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
                .EnsureSuccessStatusCode();

            var published = await auth.Client.PostAsJsonAsync(
                "/api/reviews/courses",
                new
                {
                    subjectId = Subject211,
                    termId = Terms[i % Terms.Length],
                    chairId = (Guid?)chairId,
                    answers = new[]
                    {
                        new { itemCode = "COURSE_OUTCOME", optionValue = (short)1 },
                        new { itemCode = "CHAIR_CLASSES_HELD", optionValue },
                    },
                    freeText = (string?)null,
                });
            published.StatusCode.ShouldBe(HttpStatusCode.Created);
        }
    }

    public static async Task<GetChairFactsResponse> FactsAsync(
        RegisterApiFixture fixture, Guid chairId)
    {
        var response = await fixture.Factory.CreateClient()
            .GetAsync($"/api/reviews/chairs/{chairId}/facts");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var facts = await response.Content.ReadFromJsonAsync<GetChairFactsResponse>();
        facts.ShouldNotBeNull();
        return facts!;
    }
}

/// <summary>
/// Una hermana que todavía no publica no habilita sola el contraste: sus respuestas no tienen una
/// base agregada que se pueda hacer pública.
/// </summary>
public class ASubfloorSiblingDoesNotEnableContrastTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public ASubfloorSiblingDoesNotEnableContrastTests(RegisterApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task A_sibling_below_the_floor_does_not_enable_a_contrast()
    {
        await ChairSiblingPublishingFloorFixture.PublishAsync(
            _fixture, ChairSiblingPublishingFloorFixture.ChairPerez, 10, 3, "target");
        await ChairSiblingPublishingFloorFixture.PublishAsync(
            _fixture, ChairSiblingPublishingFloorFixture.ChairGonzalez, 9, 1, "sibling");

        var facts = await ChairSiblingPublishingFloorFixture.FactsAsync(
            _fixture, ChairSiblingPublishingFloorFixture.ChairPerez);

        facts.IsPublished.ShouldBeTrue();
        facts.Contrasts.ShouldBeEmpty();
    }
}

/// <summary>
/// Con una hermana publicada, el agregado de comparación conserva solo sus respuestas y no suma
/// las de otra que sigue bajo el piso.
/// </summary>
public class ASubfloorSiblingIsExcludedFromContrastTotalsTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public ASubfloorSiblingIsExcludedFromContrastTotalsTests(RegisterApiFixture fixture) =>
        _fixture = fixture;

    [Fact]
    public async Task A_sibling_below_the_floor_is_excluded_from_the_contrast_denominator()
    {
        await ChairSiblingPublishingFloorFixture.PublishAsync(
            _fixture, ChairSiblingPublishingFloorFixture.ChairPerez, 10, 3, "target");
        await ChairSiblingPublishingFloorFixture.PublishAsync(
            _fixture, ChairSiblingPublishingFloorFixture.ChairGonzalez, 10, 1, "published");
        await ChairSiblingPublishingFloorFixture.PublishAsync(
            _fixture, ChairSiblingPublishingFloorFixture.ChairRuiz, 9, 3, "subfloor");

        var facts = await ChairSiblingPublishingFloorFixture.FactsAsync(
            _fixture, ChairSiblingPublishingFloorFixture.ChairPerez);

        var contrast = facts.Contrasts.Single(c => c.ItemCode == "CHAIR_CLASSES_HELD");
        contrast.HereTotal.ShouldBe(10);
        contrast.SiblingsPercent.ShouldBe(0);
        contrast.SiblingsTotal.ShouldBe(10);
    }
}
