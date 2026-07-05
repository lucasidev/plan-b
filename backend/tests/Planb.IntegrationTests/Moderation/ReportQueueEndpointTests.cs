using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Identity;
using Planb.IntegrationTests.Infrastructure;
using Planb.Moderation.Domain.Reports;
using Planb.Moderation.Infrastructure.Persistence;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Moderation;

/// <summary>
/// Tests de integración de la cola de reportes (US-050). Verifican el read model (orden por tono +
/// antigüedad, filtros, counts) y el gating por rol Moderator/Admin. Inserto reportes directo en
/// moderation.review_reports (no vía el flujo completo de reseña→reporte) para controlar motivo,
/// timestamp y status; limpio la tabla al inicio de cada test para counts exactos (DB por-clase,
/// tests secuenciales dentro de la clase).
/// </summary>
public class ReportQueueEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public ReportQueueEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> ModeratorAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"mod.{Guid.NewGuid():N}@planb.local", role: UserRole.Moderator);

    private async Task ClearReportsAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ModerationDbContext>();
        await db.Database.ExecuteSqlRawAsync("DELETE FROM moderation.review_reports;");
    }

    private async Task<Guid> InsertReportAsync(
        ReviewReportReason reason, string status, DateTimeOffset createdAt)
    {
        var id = Guid.NewGuid();
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ModerationDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO moderation.review_reports " +
            "(id, review_id, reporter_user_id, reason, details, status, created_at) " +
            "VALUES ({0}, {1}, {2}, {3}, null, {4}, {5});",
            id, Guid.NewGuid(), Guid.NewGuid(), reason.ToString(), status, createdAt);
        return id;
    }

    [Fact]
    public async Task Moderator_sees_open_reports_sorted_by_tone_then_age_with_counts()
    {
        await ClearReportsAsync();
        var now = DateTimeOffset.UtcNow;
        var urgentOld = await InsertReportAsync(
            ReviewReportReason.LenguajeInapropiado, "Open", now.AddMinutes(-30));
        var urgentNew = await InsertReportAsync(
            ReviewReportReason.DatosPersonales, "Open", now.AddMinutes(-10));
        var normal = await InsertReportAsync(ReviewReportReason.Spam, "Open", now.AddMinutes(-20));
        var low = await InsertReportAsync(ReviewReportReason.OffTopic, "Open", now.AddMinutes(-5));
        await InsertReportAsync(ReviewReportReason.Difamacion, "Upheld", now.AddHours(-1));

        var moderator = await ModeratorAsync();
        var queue = await moderator.Client.GetFromJsonAsync<QueueDto>(
            "/api/moderation/reports/queue");

        // Orden: urgentes primero (por antigüedad ASC), luego normal, luego low.
        queue!.Items.Select(i => i.Id).ShouldBe([urgentOld, urgentNew, normal, low]);
        queue.Items[0].Tone.ShouldBe("urgent");
        queue.Items[2].Tone.ShouldBe("normal");
        queue.Items[3].Tone.ShouldBe("low");
        queue.TotalCount.ShouldBe(4);

        queue.Counts.OpenCount.ShouldBe(4);
        queue.Counts.UrgentCount.ShouldBe(2);
        queue.Counts.NormalCount.ShouldBe(1);
        queue.Counts.LowCount.ShouldBe(1);
        queue.Counts.ClosedLast7d.ShouldBe(1);
        queue.Counts.StaleCount.ShouldBe(0);
    }

    [Fact]
    public async Task Tone_filter_returns_only_that_tone()
    {
        await ClearReportsAsync();
        var now = DateTimeOffset.UtcNow;
        var urgent = await InsertReportAsync(
            ReviewReportReason.DatosPersonales, "Open", now.AddMinutes(-10));
        await InsertReportAsync(ReviewReportReason.Spam, "Open", now.AddMinutes(-20));

        var moderator = await ModeratorAsync();
        var queue = await moderator.Client.GetFromJsonAsync<QueueDto>(
            "/api/moderation/reports/queue?tone=urgent");

        queue!.Items.ShouldHaveSingleItem();
        queue.Items[0].Id.ShouldBe(urgent);
        queue.Items[0].Tone.ShouldBe("urgent");
    }

    [Fact]
    public async Task Closed_status_returns_resolved_reports_only()
    {
        await ClearReportsAsync();
        var now = DateTimeOffset.UtcNow;
        await InsertReportAsync(ReviewReportReason.Spam, "Open", now.AddMinutes(-10));
        var upheld = await InsertReportAsync(
            ReviewReportReason.Difamacion, "Upheld", now.AddMinutes(-20));

        var moderator = await ModeratorAsync();
        var queue = await moderator.Client.GetFromJsonAsync<QueueDto>(
            "/api/moderation/reports/queue?status=closed");

        queue!.Items.ShouldHaveSingleItem();
        queue.Items[0].Id.ShouldBe(upheld);
    }

    [Fact]
    public async Task Member_cannot_access_queue_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var resp = await member.Client.GetAsync("/api/moderation/reports/queue");

        resp.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_access_queue_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var resp = await anon.GetAsync("/api/moderation/reports/queue");

        resp.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Seeded_moderator_persona_can_access_queue()
    {
        var moderator = await AuthenticatedClient.SignInAsync(
            _fixture, TestPersonas.ModeratorEmail, TestPersonas.ModeratorPassword);

        var resp = await moderator.Client.GetAsync("/api/moderation/reports/queue");

        resp.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    private sealed record QueueDto(
        CountsDto Counts, IReadOnlyList<ItemDto> Items, int Page, int PageSize, int TotalCount);

    private sealed record CountsDto(
        int OpenCount, int ClosedLast7d, int UrgentCount, int NormalCount, int LowCount, int StaleCount);

    private sealed record ItemDto(
        Guid Id, DateTime CreatedAt, string Reason, string? Snippet,
        Guid TargetReviewId, Guid ReporterUserId, string Tone);
}
