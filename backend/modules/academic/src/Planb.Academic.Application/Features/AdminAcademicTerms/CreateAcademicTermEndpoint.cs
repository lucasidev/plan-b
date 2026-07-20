using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// POST /api/academic/universities/{universityId:guid}/terms (admin, US-064). Alta de un período
/// lectivo anclado a una universidad. Gateado a rol Admin.
/// </summary>
public sealed class CreateAcademicTermEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/universities/{universityId:guid}/terms", async (
            Guid universityId,
            CreateAcademicTermRequest body,
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

            var kind = AcademicTermEnumParsing.ParseKind(body.Kind);
            if (kind.IsFailure)
            {
                return Results.Problem(
                    title: kind.Error.Code, detail: kind.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new CreateAcademicTermCommand(
                universityId, body.Year, body.Number, kind.Value,
                body.StartDate, body.EndDate,
                AsUtc(body.EnrollmentOpens), AsUtc(body.EnrollmentCloses));

            try
            {
                var result = await bus.InvokeAsync<Result<CreateAcademicTermResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/academic-terms/{result.Value.Id}", result.Value);
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
        .WithName("Academic_CreateAcademicTerm")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminAcademicTermPolicy.RoleName))
        .Produces<CreateAcademicTermResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    /// <summary>
    /// Reinterpreta la hora local que llegó del <c>datetime-local</c> (sin offset, a la que
    /// System.Text.Json le pegó el offset local del proceso) como esa misma hora en UTC. Postgres
    /// <c>timestamp with time zone</c> solo acepta offset 0, y así el instante guardado no depende
    /// del huso donde corra el server. El enrollment window todavía no se consume en el dominio
    /// (US-064): la semántica fina de huso se refina cuando se use.
    /// </summary>
    private static DateTimeOffset AsUtc(DateTimeOffset value) => new(value.DateTime, TimeSpan.Zero);
}

/// <summary>
/// Body del POST. Year/number/fechas/ventana de inscripción requeridos. Kind viaja como string
/// (el endpoint lo parsea). El label NO viaja: se computa en el dominio a partir de
/// year/number/kind.
/// </summary>
public sealed record CreateAcademicTermRequest(
    int Year,
    int Number,
    string? Kind,
    DateOnly StartDate,
    DateOnly EndDate,
    DateTimeOffset EnrollmentOpens,
    DateTimeOffset EnrollmentCloses);
