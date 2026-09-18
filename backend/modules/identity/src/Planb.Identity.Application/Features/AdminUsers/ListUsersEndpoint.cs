using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Reading;

namespace Planb.Identity.Application.Features.AdminUsers;

public sealed class ListUsersEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/identity/users", async (
            string? search, string? status, int? page, IAdminUserReadService users,
            IAcademicQueryService academic, CancellationToken ct) =>
        {
            var query = (search ?? "").Trim().ToLowerInvariant();
            var filter = status ?? "all";
            var currentPage = page ?? 1;
            if (query.Length > 254 || currentPage is < 1 or > 100_000
                || filter is not ("all" or "active" or "pending" or "suspended"))
            {
                return Results.Problem(statusCode: 400, title: "identity.users.invalid_filter",
                    detail: "Invalid user search, status or page.");
            }
            var result = await users.ListAsync(query, filter, currentPage, ct);
            var careerIds = result.Items.Where(u => u.CareerId.HasValue)
                .Select(u => u.CareerId!.Value).Distinct().ToArray();
            var labels = (await academic.GetCareerLabelsAsync(careerIds, ct)).ToDictionary(c => c.Id);
            return Results.Ok(result with
            {
                Items = result.Items.Select(u => u.CareerId is { } id && labels.TryGetValue(id, out var label)
                    ? u with { CareerName = label.CareerName, UniversityName = label.UniversityName }
                    : u).ToArray(),
            });
        })
        .WithName("Identity_ListUsers")
        .WithTags("Identity")
        .RequireAuthorization(p => p.RequireRole("Admin"))
        .Produces<AdminUserPage>();
    }
}
