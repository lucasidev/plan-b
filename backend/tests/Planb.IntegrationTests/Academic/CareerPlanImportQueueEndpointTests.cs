using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Application.Features.CareerPlanImportQueue;
using Planb.Academic.Application.Features.CareerPlanImports;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests de la cola de imports para staff (US-088): filtro por estado, candidatos por
/// similitud (pg_trgm) y el gating por rol Admin. Mismo patrón que
/// <see cref="Moderation.ReportQueueEndpointTests"/>: inserta datos directo via DbContext para
/// controlar el estado exacto y limpia la tabla al inicio de los tests que dependen de un total
/// exacto (DB por-clase, tests secuenciales dentro de la clase).
/// </summary>
public class CareerPlanImportQueueEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid UnstaUniversityId =
        Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public CareerPlanImportQueueEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"queue-admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private async Task ClearImportsAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        await db.Database.ExecuteSqlRawAsync("DELETE FROM academic.career_plan_imports;");
    }

    /// <summary>
    /// Crea un import directo via DbContext (sin pasar por el endpoint de alumno) y lo deja en el
    /// status pedido. Bypassea el worker async para que el test no dependa de su timing.
    /// </summary>
    private async Task<Guid> SeedImportAsync(
        string careerName, CareerPlanImportStatus status, int planYear = 2024)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

        var import = CareerPlanImport.Create(
            Guid.NewGuid(), new UniversityId(UnstaUniversityId),
            careerName, planYear, planYear, CareerPlanImportSourceType.Text, clock).Value;

        if (status != CareerPlanImportStatus.Pending)
        {
            import.MarkParsing(clock);
        }
        if (status is CareerPlanImportStatus.Parsed or CareerPlanImportStatus.Approved
            or CareerPlanImportStatus.Rejected)
        {
            import.MarkParsed(
                new CareerPlanImportPayload("raw", [], new CareerPlanImportSummary(0, 0, 0, 0)), clock);
        }
        if (status == CareerPlanImportStatus.Approved)
        {
            import.MarkApproved(Guid.NewGuid(), clock);
        }
        if (status == CareerPlanImportStatus.Rejected)
        {
            import.MarkRejected("No corresponde a un plan de estudios real.", clock);
        }
        if (status == CareerPlanImportStatus.Failed)
        {
            import.MarkFailed("boom", clock);
        }

        db.CareerPlanImports.Add(import);
        await db.SaveChangesAsync();
        return import.Id.Value;
    }

    [Fact]
    public async Task Status_filter_returns_only_imports_in_that_status()
    {
        await ClearImportsAsync();
        var parsed = await SeedImportAsync("Carrera Parseada", CareerPlanImportStatus.Parsed);
        var rejected = await SeedImportAsync("Carrera Rechazada", CareerPlanImportStatus.Rejected);
        await SeedImportAsync("Carrera Pendiente", CareerPlanImportStatus.Pending);

        var admin = await AdminAsync();

        var parsedQueue = await admin.Client.GetFromJsonAsync<ImportQueueResponse>(
            "/api/academic/career-plan-imports?status=Parsed");
        parsedQueue!.Items.Select(i => i.Id).ShouldBe([parsed]);
        parsedQueue.TotalCount.ShouldBe(1);

        var rejectedQueue = await admin.Client.GetFromJsonAsync<ImportQueueResponse>(
            "/api/academic/career-plan-imports?status=Rejected");
        rejectedQueue!.Items.ShouldHaveSingleItem();
        rejectedQueue.Items[0].Id.ShouldBe(rejected);
        rejectedQueue.Items[0].RejectionReason.ShouldBe("No corresponde a un plan de estudios real.");
        rejectedQueue.Items[0].RejectedAt.ShouldNotBeNull();

        var allQueue = await admin.Client.GetFromJsonAsync<ImportQueueResponse>(
            "/api/academic/career-plan-imports");
        allQueue!.TotalCount.ShouldBe(3);
    }

    [Fact]
    public async Task Invalid_status_returns_400()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.GetAsync(
            "/api/academic/career-plan-imports?status=NoExiste");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Page_and_pageSize_paginate_results_offset_style()
    {
        await ClearImportsAsync();
        await SeedImportAsync("Paginada Uno", CareerPlanImportStatus.Pending);
        await SeedImportAsync("Paginada Dos", CareerPlanImportStatus.Pending);
        await SeedImportAsync("Paginada Tres", CareerPlanImportStatus.Pending);

        var admin = await AdminAsync();

        var firstPage = await admin.Client.GetFromJsonAsync<ImportQueueResponse>(
            "/api/academic/career-plan-imports?pageSize=2&page=1");
        firstPage!.Items.Count.ShouldBe(2);
        firstPage.TotalCount.ShouldBe(3);

        var secondPage = await admin.Client.GetFromJsonAsync<ImportQueueResponse>(
            "/api/academic/career-plan-imports?pageSize=2&page=2");
        secondPage!.Items.Count.ShouldBe(1);
        secondPage.TotalCount.ShouldBe(3);
    }

    /// <summary>
    /// El que aprueba tiene que poder ver "ya existe algo parecido" antes de crear (US-088). El
    /// candidato matchea aunque el import proponga un nombre distinto ("de" en vez de "en") y sin
    /// acentos: similarity() de pg_trgm sobre el nombre unaccented, no coincidencia exacta.
    ///
    /// <para>
    /// UNSTA ya trae carreras del seed de Development (Ingeniería en Informática, etc.), así que el
    /// assert sobre el candidato esperado busca por nombre en vez de asumir que es el único o el
    /// primero de la lista.
    /// </para>
    /// </summary>
    [Fact]
    public async Task Queue_item_lists_similar_careers_from_the_same_university()
    {
        await ClearImportsAsync();
        var admin = await AdminAsync();

        var createCareer = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{UnstaUniversityId}/careers",
            new
            {
                name = "Ingeniería en Sistemas",
                slug = "ingenieria-sistemas-candidatos-test",
                shortName = (string?)null,
                code = (string?)null,
                degreeType = (string?)null,
                durationYears = (int?)null,
                cadence = (string?)null,
                description = (string?)null,
            });
        createCareer.EnsureSuccessStatusCode();

        var similarImportId = await SeedImportAsync(
            "Ingenieria de Sistemas", CareerPlanImportStatus.Pending, planYear: 2024);
        var unrelatedImportId = await SeedImportAsync(
            "Contador Público Nacional", CareerPlanImportStatus.Pending, planYear: 2025);

        var queue = await admin.Client.GetFromJsonAsync<ImportQueueResponse>(
            "/api/academic/career-plan-imports?pageSize=100");

        var similarItem = queue!.Items.Single(i => i.Id == similarImportId);
        similarItem.SimilarCareers.ShouldContain(c => c.Name == "Ingeniería en Sistemas");

        var unrelatedItem = queue.Items.Single(i => i.Id == unrelatedImportId);
        unrelatedItem.SimilarCareers.ShouldBeEmpty();
    }

    [Fact]
    public async Task Member_cannot_access_queue_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"queue-member.{Guid.NewGuid():N}@planb.local");

        var response = await member.Client.GetAsync("/api/academic/career-plan-imports");

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_access_queue_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var response = await anon.GetAsync("/api/academic/career-plan-imports");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
