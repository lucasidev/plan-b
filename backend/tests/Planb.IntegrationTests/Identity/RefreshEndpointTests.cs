using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Application.Features.Refresh;
using Planb.Identity.Application.Features.SignIn;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

public class RefreshEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public RefreshEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private HttpClient NewClient() => _fixture.Factory.CreateClient(
        new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });

    private static string ExtractCookie(HttpResponseMessage response, string name)
    {
        var setCookies = response.Headers.GetValues("Set-Cookie");
        var cookie = setCookies.FirstOrDefault(c => c.StartsWith($"{name}="));
        cookie.ShouldNotBeNull();
        var rawValue = cookie!.Split(';')[0];
        return rawValue;
    }

    [Fact]
    public async Task Refreshes_tokens_with_valid_cookie_and_rotates_the_refresh()
    {
        var client = NewClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.LuciaEmail, TestPersonas.LuciaPassword));
        loginResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var oldRefreshCookie = ExtractCookie(loginResponse, "planb_refresh");

        // Manually attach the refresh cookie to the next call (HandleCookies=false).
        using var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/identity/refresh");
        refreshRequest.Headers.Add("Cookie", oldRefreshCookie);
        var refreshResponse = await client.SendAsync(refreshRequest);

        refreshResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await refreshResponse.Content.ReadFromJsonAsync<RefreshResponse>();
        body.ShouldNotBeNull();
        body.Email.ShouldBe(TestPersonas.LuciaEmail);

        // Token rotation: the new refresh cookie value differs from the old one.
        var newRefreshCookie = ExtractCookie(refreshResponse, "planb_refresh");
        newRefreshCookie.ShouldNotBe(oldRefreshCookie);

        // Old token must be revoked. Reusing it should fail.
        using var replayRequest = new HttpRequestMessage(HttpMethod.Post, "/api/identity/refresh");
        replayRequest.Headers.Add("Cookie", oldRefreshCookie);
        var replayResponse = await client.SendAsync(replayRequest);
        replayResponse.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_401_when_no_refresh_cookie_present()
    {
        var client = NewClient();

        var response = await client.PostAsync("/api/identity/refresh", content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_401_for_garbage_refresh_token()
    {
        var client = NewClient();

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/identity/refresh");
        request.Headers.Add("Cookie", "planb_refresh=this-is-not-a-real-token");
        var response = await client.SendAsync(request);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
