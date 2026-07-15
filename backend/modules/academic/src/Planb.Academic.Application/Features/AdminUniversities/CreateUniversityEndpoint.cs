using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// POST /api/academic/universities (admin, US-060). Alta de una universidad del catálogo. Gateado
/// a rol Admin (backoffice): agregar universidades es una operación de catálogo, no de self-service.
/// </summary>
public sealed class CreateUniversityEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/universities", async (
            CreateUniversityRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var command = new CreateUniversityCommand(
                body.Name, body.Slug, body.InstitutionalEmailDomains);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateUniversityResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/universities/{result.Value.Id}", result.Value);
                }

                var error = result.Error;
                var statusCode = error.Type switch
                {
                    ErrorType.Validation => StatusCodes.Status400BadRequest,
                    ErrorType.NotFound => StatusCodes.Status404NotFound,
                    ErrorType.Conflict => StatusCodes.Status409Conflict,
                    ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                    ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                    _ => StatusCodes.Status500InternalServerError,
                };
                return Results.Problem(
                    title: error.Code, detail: error.Message, statusCode: statusCode);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Academic_CreateUniversity")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminUniversityPolicy.RoleName))
        .Produces<CreateUniversityResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>Body del POST. Name + slug requeridos; institutionalEmailDomains opcional.</summary>
public sealed record CreateUniversityRequest(
    string Name,
    string Slug,
    IReadOnlyList<string>? InstitutionalEmailDomains);
