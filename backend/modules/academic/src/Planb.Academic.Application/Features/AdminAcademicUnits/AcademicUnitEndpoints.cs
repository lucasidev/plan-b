using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminAcademicUnits;

public sealed class AcademicUnitEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/universities/{universityId:guid}/units", CreateAsync)
            .WithName("Academic_CreateAcademicUnit")
            .WithTags("Academic")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        app.MapPut("/api/academic/universities/{universityId:guid}/units/{unitId:guid}", UpdateAsync)
            .WithName("Academic_UpdateAcademicUnit")
            .WithTags("Academic")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));
    }

    private static Task<IResult> CreateAsync(
        Guid universityId,
        AcademicUnitRequest body,
        IMessageBus bus,
        CancellationToken ct) =>
        InvokeAsync(
            new CreateAcademicUnitCommand(
                universityId,
                body.Name,
                body.Slug,
                body.Address,
                body.Province,
                body.LocalityText),
            bus,
            ct,
            created: true);

    private static Task<IResult> UpdateAsync(
        Guid universityId,
        Guid unitId,
        AcademicUnitRequest body,
        IMessageBus bus,
        CancellationToken ct) =>
        InvokeAsync(
            new UpdateAcademicUnitCommand(
                unitId,
                universityId,
                body.Name,
                body.Slug,
                body.Address,
                body.Province,
                body.LocalityText),
            bus,
            ct,
            created: false);

    private static async Task<IResult> InvokeAsync<T>(
        T command,
        IMessageBus bus,
        CancellationToken ct,
        bool created)
        where T : class
    {
        try
        {
            var result = await bus.InvokeAsync<Result<AcademicUnitResponse>>(command, ct);
            if (result.IsSuccess)
            {
                return created
                    ? Results.Created($"/api/academic/units/{result.Value.Id}", result.Value)
                    : Results.Ok(result.Value);
            }

            var status = result.Error.Type switch
            {
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                _ => StatusCodes.Status400BadRequest,
            };
            return Results.Problem(title: result.Error.Code, detail: result.Error.Message, statusCode: status);
        }
        catch (ValidationException exception)
        {
            return Results.ValidationProblem(exception.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray()));
        }
    }
}

public sealed record AcademicUnitRequest(
    string Name,
    string Slug,
    string Address,
    string Province,
    string LocalityText);
