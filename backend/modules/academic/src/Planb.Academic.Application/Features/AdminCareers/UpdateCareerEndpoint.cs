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
/// PATCH /api/academic/careers/{id} (admin, US-061). Replace del form completo de la carrera.
/// Gateado a rol Admin.
/// </summary>
public sealed class UpdateCareerEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/academic/careers/{id:guid}", async (
            Guid id,
            UpdateCareerRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid (es un guid sintácticamente válido) pero
            // CareerId lo rechaza en su ctor: cortamos acá para devolver 404 limpio en vez de
            // dejar que el value object tire ArgumentException.
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career.not_found",
                    detail: "Career not found.",
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

            var command = new UpdateCareerCommand(
                id, body.Name, body.Slug, body.ShortName, body.Code,
                degreeType, body.DurationYears, modality, body.Description);

            try
            {
                var result = await bus.InvokeAsync<Result<UpdateCareerResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Ok(result.Value);
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
        .WithName("Academic_UpdateCareer")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCareerPolicy.RoleName))
        .Produces<UpdateCareerResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>
/// Body del PATCH. Name + slug requeridos; shortName/code/degreeType/durationYears/modality/
/// description opcionales. DegreeType y Modality viajan como string (el endpoint los parsea).
/// </summary>
public sealed record UpdateCareerRequest(
    string Name,
    string Slug,
    string? ShortName,
    string? Code,
    string? DegreeType,
    int? DurationYears,
    string? Modality,
    string? Description);
