using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.PublishingRulesRead;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// GET /api/reviews/publishing-rules (US-130) contra los valores pineados, literales acá igual que
/// en <c>PublishingRulesTests.cs:30-43</c>, no leídos de <see cref="Planb.Reviews.Domain.Reviews.PublishingRules"/>.
///
/// <para>
/// El endpoint existe para que Método diga los pisos sin escribirlos a mano: un número de producto
/// copiado a mano en la pantalla sería una segunda definición de la misma regla. Este test es el que
/// avisa si alguien cambia el piso sin cambiar la story: si cae, se actualiza el literal acá y el
/// ADR que lo sostiene, en el mismo cambio.
/// </para>
/// </summary>
public class GetPublishingRulesEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly HttpClient _anonymous;

    public GetPublishingRulesEndpointTests(RegisterApiFixture fixture)
    {
        _anonymous = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task GetPublishingRules_returns_the_pinned_floors_anonymously()
    {
        var body = await _anonymous.GetOkAsync<PublishingRulesResponse>(
            "/api/reviews/publishing-rules");

        body.ChairMinimumReviews.ShouldBe(10);
        body.SubjectPairMinimumReviews.ShouldBe(10);
    }
}
