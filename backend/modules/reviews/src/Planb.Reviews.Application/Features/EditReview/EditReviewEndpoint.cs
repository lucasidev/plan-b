using System.Text.Json;
using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.EditReview;

/// <summary>
/// PATCH /api/me/reviews/{id} (US-018).
///
/// Auth: JwtBearer extracts the user id from the <c>sub</c> claim. The route uses the
/// <c>/me/</c> prefix to make ownership scope explicit: this is the author editing their
/// own review, not a moderator endpoint (those live under <c>/api/moderation/</c>).
///
/// Body parsing: we read the body as <see cref="JsonElement"/> so we can distinguish
/// "field not provided" from "field set to null/empty". A normal record DTO would lose
/// that distinction (an absent text would deserialise to null, indistinguishable from
/// "clear the field").
/// </summary>
public sealed class EditReviewEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/me/reviews/{id:guid}", async (
            Guid id,
            JsonElement body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var command = BuildCommand(id, userId.Value, body);

            try
            {
                var result = await bus.InvokeAsync<Result<EditReviewResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Ok(result.Value);
                }

                var error = result.Error;
                var statusCode = error.Code switch
                {
                    "reviews.edit.cooldown_exceeded" => StatusCodes.Status429TooManyRequests,
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
        .WithName("Reviews_EditReview")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<EditReviewResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);
    }

    private static EditReviewCommand BuildCommand(Guid reviewId, Guid userId, JsonElement body)
    {
        int? difficulty = null;
        if (TryGetProperty(body, "difficultyRating", out var dr) && dr.ValueKind == JsonValueKind.Number)
        {
            difficulty = dr.GetInt32();
        }

        int? overallRating = null;
        if (TryGetProperty(body, "overallRating", out var or) && or.ValueKind == JsonValueKind.Number)
        {
            overallRating = or.GetInt32();
        }

        // Hours uses an explicit "provided" flag: null is a valid value (the student cleared the
        // field), so presence of the key, not nullness, decides whether it is part of the patch.
        var hoursProvided = TryGetProperty(body, "hoursPerWeek", out var hpw);
        int? hoursPerWeek = hoursProvided && hpw.ValueKind == JsonValueKind.Number ? hpw.GetInt32() : null;

        // Tags: a present array sets the list (including empty = clear); a missing key (or a null)
        // leaves the existing tags untouched (null command value = not provided).
        IReadOnlyList<string>? tags = null;
        if (TryGetProperty(body, "tags", out var tg) && tg.ValueKind == JsonValueKind.Array)
        {
            tags = tg.EnumerateArray()
                .Where(e => e.ValueKind == JsonValueKind.String)
                .Select(e => e.GetString()!)
                .ToList();
        }

        bool? wouldRecommendCourse = null;
        if (TryGetProperty(body, "wouldRecommendCourse", out var wrc)
            && wrc.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            wouldRecommendCourse = wrc.GetBoolean();
        }

        bool? wouldRetakeTeacher = null;
        if (TryGetProperty(body, "wouldRetakeTeacher", out var wrt)
            && wrt.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            wouldRetakeTeacher = wrt.GetBoolean();
        }

        var subjectTextProvided = TryGetProperty(body, "subjectText", out var st);
        var subjectText = subjectTextProvided && st.ValueKind != JsonValueKind.Null ? st.GetString() : null;

        var teacherTextProvided = TryGetProperty(body, "teacherText", out var tt);
        var teacherText = teacherTextProvided && tt.ValueKind != JsonValueKind.Null ? tt.GetString() : null;

        var finalGradeProvided = TryGetProperty(body, "finalGrade", out var fg);
        decimal? finalGrade = null;
        if (finalGradeProvided && fg.ValueKind == JsonValueKind.Number)
        {
            finalGrade = fg.GetDecimal();
        }

        return new EditReviewCommand(
            reviewId,
            userId,
            difficulty,
            overallRating,
            hoursPerWeek,
            hoursProvided,
            tags,
            wouldRecommendCourse,
            wouldRetakeTeacher,
            subjectText,
            subjectTextProvided,
            teacherText,
            teacherTextProvided,
            finalGrade,
            finalGradeProvided);
    }

    private static bool TryGetProperty(JsonElement body, string name, out JsonElement value)
    {
        if (body.ValueKind == JsonValueKind.Object && body.TryGetProperty(name, out value))
        {
            return true;
        }
        value = default;
        return false;
    }
}
