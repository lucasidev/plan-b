using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Tiny HTTP client for the MailHog API (the dev SMTP catcher running in <c>just infra-up</c>).
/// We poll <c>GET /api/v2/messages</c> until our recipient appears, with a hard timeout.
/// </summary>
public sealed class MailHogClient : IDisposable
{
    private readonly HttpClient _http;

    public MailHogClient()
    {
        var port = Environment.GetEnvironmentVariable("MAILHOG_UI_PORT") ?? "8025";
        _http = new HttpClient { BaseAddress = new Uri($"http://localhost:{port}/") };
    }

    public async Task ClearAsync(CancellationToken ct = default)
    {
        var response = await _http.DeleteAsync("api/v1/messages", ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task<MailHogMessage?> WaitForMessageToAsync(
        string recipient, TimeSpan timeout, CancellationToken ct = default)
    {
        var deadline = DateTimeOffset.UtcNow.Add(timeout);
        while (DateTimeOffset.UtcNow < deadline)
        {
            var page = await _http.GetFromJsonAsync<MailHogPage>(
                "api/v2/messages", ct);
            var match = page?.Items.FirstOrDefault(m => m.RecipientEmails().Contains(recipient));
            if (match is not null)
            {
                return match;
            }
            await Task.Delay(TimeSpan.FromMilliseconds(150), ct);
        }
        return null;
    }

    public void Dispose() => _http.Dispose();
}

public sealed record MailHogPage([property: JsonPropertyName("items")] List<MailHogMessage> Items);

public sealed record MailHogMessage(
    [property: JsonPropertyName("Content")] MailHogContent Content,
    [property: JsonPropertyName("To")] List<MailHogPath> To)
{
    public IEnumerable<string> RecipientEmails() =>
        To.Select(t => $"{t.Mailbox}@{t.Domain}".ToLowerInvariant());

    public string Body => Content.Body ?? string.Empty;
}

public sealed record MailHogContent(
    [property: JsonPropertyName("Body")] string? Body);

public sealed record MailHogPath(
    [property: JsonPropertyName("Mailbox")] string Mailbox,
    [property: JsonPropertyName("Domain")] string Domain);
