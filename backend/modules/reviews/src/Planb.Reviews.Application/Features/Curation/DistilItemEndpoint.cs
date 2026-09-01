using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// POST /api/reviews/curation/items (ADR-0084): destilar una pregunta del campo libre.
///
/// <para>
/// Publica una versión nueva del instrumento con la pregunta adentro y cierra la anterior, que es
/// lo que el ADR describe: el instrumento evoluciona desde lo cualitativo. Por eso devuelve 201 con
/// la versión: el número es el corte, y lo que se responda desde ahora se cuenta bajo esta pregunta
/// sin compararse con nada de antes, que no la tenía.
/// </para>
/// </summary>
public sealed class DistilItemEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/reviews/curation/items", async (
            DistilItemRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (!CurationEnumParsing.TryLayer(body.Layer, out var layer))
            {
                return Results.Problem(
                    title: "reviews.item.invalid_layer",
                    detail: "That layer does not exist.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            if (!CurationEnumParsing.TrySubject(body.Subject, out var subject))
            {
                return Results.Problem(
                    title: "reviews.item.invalid_subject",
                    detail: "That subject does not exist.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var options = new List<DistilledOption>(body.Options.Count);
            foreach (var option in body.Options)
            {
                if (!CurationEnumParsing.TryValence(option.Valence, out var valence))
                {
                    return Results.Problem(
                        title: "reviews.item.invalid_valence",
                        detail: "That valence does not exist.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                options.Add(new DistilledOption(option.Value, option.Order, option.Label, valence));
            }

            var command = new DistilItemCommand(
                body.Code, body.Text, body.Help, layer, subject, options);

            try
            {
                var result = await bus.InvokeAsync<Result<DistilItemResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created("/api/reviews/instrument", result.Value);
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
        .WithName("Reviews_DistilItem")
        .WithTags("Reviews")
        .RequireAuthorization(p => p.RequireRole(CurationPolicy.RoleName))
        .Produces<DistilItemResponse>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
