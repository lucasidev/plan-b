using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Minimal client for the Mailpit HTTP API (<c>/api/v1/*</c>). Local dev and CI both run
/// <c>axllent/mailpit</c> so tests target the same API in every environment. See
/// https://mailpit.axllent.org/docs/api-v1/.
/// </summary>
public sealed class MailpitClient : IDisposable
{
    private readonly HttpClient _http;

    public MailpitClient()
    {
        var port = Environment.GetEnvironmentVariable("MAILPIT_UI_PORT") ?? "8025";
        _http = new HttpClient { BaseAddress = new Uri($"http://localhost:{port}/") };
    }

    public async Task ClearAsync(CancellationToken ct = default)
    {
        var response = await _http.DeleteAsync("api/v1/messages", ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task<MailpitMessageSummary?> WaitForMessageToAsync(
        string recipient, TimeSpan timeout, CancellationToken ct = default)
    {
        var deadline = DateTimeOffset.UtcNow.Add(timeout);
        while (DateTimeOffset.UtcNow < deadline)
        {
            var page = await _http.GetFromJsonAsync<MailpitListResponse>(
                "api/v1/messages", ct);
            var match = page?.Messages.FirstOrDefault(m =>
                m.To.Any(t => string.Equals(t.Address, recipient, StringComparison.OrdinalIgnoreCase)));
            if (match is not null)
            {
                return match;
            }
            await Task.Delay(TimeSpan.FromMilliseconds(150), ct);
        }
        return null;
    }

    public Task<MailpitMessageDetail?> GetMessageDetailAsync(
        string messageId, CancellationToken ct = default) =>
        _http.GetFromJsonAsync<MailpitMessageDetail>($"api/v1/message/{messageId}", ct);

    public void Dispose() => _http.Dispose();
}

public sealed record MailpitListResponse(
    [property: JsonPropertyName("messages")] List<MailpitMessageSummary> Messages);

public sealed record MailpitMessageSummary(
    [property: JsonPropertyName("ID")] string Id,
    [property: JsonPropertyName("Subject")] string Subject,
    [property: JsonPropertyName("To")] List<MailpitAddress> To);

public sealed record MailpitMessageDetail(
    [property: JsonPropertyName("ID")] string Id,
    [property: JsonPropertyName("Subject")] string Subject,
    [property: JsonPropertyName("To")] List<MailpitAddress> To,
    [property: JsonPropertyName("Text")] string Text,
    [property: JsonPropertyName("HTML")] string Html);

public sealed record MailpitAddress(
    [property: JsonPropertyName("Address")] string Address,
    [property: JsonPropertyName("Name")] string? Name);
