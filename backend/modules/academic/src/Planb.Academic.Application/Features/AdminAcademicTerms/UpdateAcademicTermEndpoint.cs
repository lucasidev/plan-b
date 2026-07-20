using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// PATCH /api/academic/academic-terms/{id:guid} (admin, US-064). Replace del form completo del
/// período lectivo. Gateado a rol Admin.
/// </summary>
public sealed class UpdateAcademicTermEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/academic/academic-terms/{id:guid}", async (
            Guid id,
            UpdateAcademicTermRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid (es un guid sintácticamente válido) pero
            // AcademicTermId lo rechaza en su ctor: cortamos acá para devolver 404 limpio en vez
            // de dejar que el value object tire ArgumentException.
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.term.not_found",
                    detail: "AcademicTerm not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var kind = AcademicTermEnumParsing.ParseKind(body.Kind);
            if (kind.IsFailure)
            {
                return Results.Problem(
                    title: kind.Error.Code, detail: kind.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new UpdateAcademicTermCommand(
                id, body.Year, body.Number, kind.Value,
                body.StartDate, body.EndDate,
                AsUtc(body.EnrollmentOpens), AsUtc(body.EnrollmentCloses));

            try
            {
                var result = await bus.InvokeAsync<Result<UpdateAcademicTermResponse>>(command, ct);
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
        .WithName("Academic_UpdateAcademicTerm")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminAcademicTermPolicy.RoleName))
        .Produces<UpdateAcademicTermResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    /// <summary>
    /// Reinterpreta la hora local del <c>datetime-local</c> como UTC (mismo motivo que en el POST de
    /// alta: Postgres <c>timestamp with time zone</c> solo acepta offset 0 y el instante no debe
    /// depender del huso donde corra el server).
    /// </summary>
    private static DateTimeOffset AsUtc(DateTimeOffset value) => new(value.DateTime, TimeSpan.Zero);
}

/// <summary>
/// Body del PATCH. Year/number/fechas/ventana de inscripción requeridos. Kind viaja como string
/// (el endpoint lo parsea). El label NO viaja: se recomputa en el dominio a partir de
/// year/number/kind.
/// </summary>
public sealed record UpdateAcademicTermRequest(
    int Year,
    int Number,
    string? Kind,
    DateOnly StartDate,
    DateOnly EndDate,
    DateTimeOffset EnrollmentOpens,
    DateTimeOffset EnrollmentCloses);
