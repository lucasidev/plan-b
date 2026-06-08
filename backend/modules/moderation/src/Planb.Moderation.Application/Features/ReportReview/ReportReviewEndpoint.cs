using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Moderation.Domain.Reports;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Moderation.Application.Features.ReportReview;

/// <summary>
/// POST /api/reviews/{id}/reports (US-019). Any logged-in user (not the author) can report
/// a review. The endpoint belongs to the Moderation module even though the route sits under
/// <c>/api/reviews/</c>: the resource being created is a moderation report, and Carter
/// discovers the module across assemblies.
///
/// Auth: JwtBearer extracts the reporter from the <c>sub</c> claim. The body carries the
/// reason (parsed into the enum here) + optional details.
/// </summary>
public sealed class ReportReviewEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/reviews/{id:guid}/reports", async (
            Guid id,
            ReportReviewRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            if (!Enum.TryParse<ReviewReportReason>(body.Reason, ignoreCase: true, out var reason))
            {
                return Results.Problem(
                    title: "moderation.report.invalid_reason",
                    detail: $"Unknown report reason '{body.Reason}'.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new ReportReviewCommand(id, userId.Value, reason, body.Details);

            try
            {
                var result = await bus.InvokeAsync<Result<ReportReviewResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/reviews/{id}/reports/{result.Value.ReportId}", result.Value);
                }

                var error = result.Error;
                var statusCode = error.Code switch
                {
                    "moderation.report.rate_limit_exceeded" => StatusCodes.Status429TooManyRequests,
                    _ => error.Type switch
                    {
                        ErrorType.Validation => StatusCodes.Status400BadRequest,
                        ErrorType.NotFound => StatusCodes.Status404NotFound,
                        ErrorType.Conflict => StatusCodes.Status409Conflict,
                        ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                        ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                        _ => StatusCodes.Status500InternalServerError,
                    },
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
        .WithName("Moderation_ReportReview")
        .WithTags("Moderation")
        .RequireAuthorization()
        .Produces<ReportReviewResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);
    }
}
