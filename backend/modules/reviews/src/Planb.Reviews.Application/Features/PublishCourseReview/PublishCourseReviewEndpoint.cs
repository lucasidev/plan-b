using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.PublishCourseReview;

/// <summary>
/// POST /api/reviews/cursadas (US-146): el acto de reseñar una cursada.
///
/// <para>
/// Pide cuenta, porque producir la pide y leer no (tesis, decisión 3). La cuenta sale del claim
/// <c>sub</c> del JWT y nunca del body: nadie reseña en nombre de otro.
/// </para>
/// </summary>
public sealed class PublishCourseReviewEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/reviews/cursadas", async (
            PublishCourseReviewRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var command = new PublishCourseReviewCommand(
                userId.Value,
                body.SubjectId,
                body.TermId,
                body.ChairId,
                (body.Answers ?? [])
                    .Select(a => new CourseReviewAnswerInput(a.ItemCode, a.OptionValue))
                    .ToList(),
                body.FreeText);

            try
            {
                var result = await bus.InvokeAsync<Result<PublishCourseReviewResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/reviews/cursadas/{result.Value.Id}", result.Value);
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
                    title: error.Code,
                    detail: error.Message,
                    statusCode: statusCode);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Reviews_PublishCourseReview")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<PublishCourseReviewResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
