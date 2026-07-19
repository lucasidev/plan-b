using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Domain;
using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// POST /api/academic/universities/{universityId:guid}/careers (admin, US-061). Alta de una
/// carrera oficial del catálogo, anclada a una universidad. Gateado a rol Admin.
/// </summary>
public sealed class CreateCareerEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/universities/{universityId:guid}/careers", async (
            Guid universityId,
            CreateCareerRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid (es un guid sintácticamente válido) pero
            // UniversityId lo rechaza en su ctor: cortamos acá para devolver 404 limpio en vez de
            // dejar que el value object tire ArgumentException.
            if (universityId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.university.not_found",
                    detail: "University not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            // DegreeType/Modality son metadata opcional (US-061): un string vacío o que no
            // matchea el enum se guarda como null en vez de rechazar el request entero.
            CareerDegreeType? degreeType = null;
            if (!string.IsNullOrWhiteSpace(body.DegreeType)
                && Enum.TryParse<CareerDegreeType>(body.DegreeType, ignoreCase: true, out var parsedDegreeType))
            {
                degreeType = parsedDegreeType;
            }

            TermKind? modality = null;
            if (!string.IsNullOrWhiteSpace(body.Modality)
                && Enum.TryParse<TermKind>(body.Modality, ignoreCase: true, out var parsedModality))
            {
                modality = parsedModality;
            }

            var command = new CreateCareerCommand(
                universityId, body.Name, body.Slug, body.ShortName, body.Code,
                degreeType, body.DurationYears, modality, body.Description);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateCareerResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/careers/{result.Value.Id}", result.Value);
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
        .WithName("Academic_CreateCareer")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCareerPolicy.RoleName))
        .Produces<CreateCareerResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>
/// Body del POST. Name + slug requeridos; shortName/code/degreeType/durationYears/modality/
/// description opcionales. DegreeType y Modality viajan como string (el endpoint los parsea).
/// </summary>
public sealed record CreateCareerRequest(
    string Name,
    string Slug,
    string? ShortName,
    string? Code,
    string? DegreeType,
    int? DurationYears,
    string? Modality,
    string? Description);
