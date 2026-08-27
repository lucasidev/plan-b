using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.ReviseCourseReview;

/// <summary>
/// PUT /api/reviews/cursadas/{id} (US-165): corregir una reseña propia.
///
/// <para>
/// Es PUT y no PATCH porque el body reemplaza lo respondido entero: dejar de contestar algo es una
/// edición válida, y un PATCH no puede expresarla sin inventar un centinela.
/// </para>
///
/// <para>
/// Una reseña ajena responde 404, igual que una inexistente: confirmar que existe sería decir que
/// alguien reseñó esa cursada.
/// </para>
/// </summary>
public sealed class ReviseCourseReviewEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/reviews/cursadas/{id:guid}", async (
            Guid id,
            ReviseCourseReviewRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var command = new ReviseCourseReviewCommand(
                userId.Value,
                id,
                (body.Answers ?? [])
                    .Select(a => new ReviseAnswerInput(a.ItemCode, a.OptionValue))
                    .ToList(),
                body.FreeText);

            try
            {
                var result = await bus.InvokeAsync<Result<ReviseCourseReviewResponse>>(command, ct);
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
        .WithName("Reviews_ReviseCourseReview")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<ReviseCourseReviewResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
