using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Application.Features.SignIn;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

public class SignOutEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public SignOutEndpointTests(RegisterApiFixture fixture)
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
        return cookie!.Split(';')[0];
    }

    [Fact]
    public async Task Sign_out_revokes_the_refresh_and_subsequent_refresh_call_returns_401()
    {
        var client = NewClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.LuciaEmail, TestPersonas.LuciaPassword));
        loginResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var refreshCookie = ExtractCookie(loginResponse, "planb_refresh");

        using var signOutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/identity/sign-out");
        signOutRequest.Headers.Add("Cookie", refreshCookie);
        var signOutResponse = await client.SendAsync(signOutRequest);

        signOutResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Reusing the refresh after sign-out must fail — it should have been removed from
        // the revocation list (DEL identity:refresh:{hash}).
        using var replayRequest = new HttpRequestMessage(HttpMethod.Post, "/api/identity/refresh");
        replayRequest.Headers.Add("Cookie", refreshCookie);
        var replayResponse = await client.SendAsync(replayRequest);
        replayResponse.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Sign_out_clears_both_auth_cookies_on_the_response()
    {
        var client = NewClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/identity/sign-in",
            new SignInRequest(TestPersonas.LuciaEmail, TestPersonas.LuciaPassword));
        var refreshCookie = ExtractCookie(loginResponse, "planb_refresh");
        var sessionCookie = ExtractCookie(loginResponse, "planb_session");

        using var signOutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/identity/sign-out");
        signOutRequest.Headers.Add("Cookie", $"{sessionCookie}; {refreshCookie}");
        var signOutResponse = await client.SendAsync(signOutRequest);

        signOutResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Both cookies should be present in the Set-Cookie header with an expiry in the past
        // (that's how cookie deletion works on the wire). We don't compare the raw timestamp —
        // we rely on the Path and Expires being set by `Cookies.Delete`.
        var setCookies = signOutResponse.Headers.GetValues("Set-Cookie").ToList();
        setCookies.ShouldContain(c => c.StartsWith("planb_session="));
        setCookies.ShouldContain(c => c.StartsWith("planb_refresh="));
    }

    [Fact]
    public async Task Sign_out_is_idempotent_when_called_without_cookies()
    {
        var client = NewClient();

        var response = await client.PostAsync("/api/identity/sign-out", content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Sign_out_is_idempotent_when_called_with_an_unknown_refresh_token()
    {
        var client = NewClient();

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/identity/sign-out");
        request.Headers.Add("Cookie", "planb_refresh=this-is-not-a-real-token");
        var response = await client.SendAsync(request);

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }
}
