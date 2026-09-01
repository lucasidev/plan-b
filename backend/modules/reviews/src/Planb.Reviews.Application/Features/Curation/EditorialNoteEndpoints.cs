using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Las notas del equipo (ADR-0084): publicar una sobre una carrera, y retirarla.
///
/// <para>
/// Escribir está gateado por rol; leerlas no tiene endpoint propio porque viajan dentro de la ficha
/// de la carrera, que es donde se leen. Una nota que hay que ir a buscar a otro lado no cumple lo
/// que el ADR le pide: contextualizar el dato que está al lado.
/// </para>
/// </summary>
public sealed class EditorialNoteEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/reviews/curation/careers/{careerId:guid}/notes", async (
            Guid careerId,
            PublishEditorialNoteRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            try
            {
                var result = await bus.InvokeAsync<Result<PublishEditorialNoteResponse>>(
                    new PublishEditorialNoteCommand(careerId, body.Text), ct);

                return result.IsSuccess
                    ? Results.Created($"/api/reviews/careers/{careerId}/facts", result.Value)
                    : ToProblem(result.Error);
            }
            catch (ValidationException ex)
            {
                return ToValidationProblem(ex);
            }
        })
        .WithName("Reviews_PublishEditorialNote")
        .WithTags("Reviews")
        .RequireAuthorization(p => p.RequireRole(CurationPolicy.RoleName))
        .Produces<PublishEditorialNoteResponse>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

        // POST y no DELETE: retirar no borra la fila, la saca de la ficha. Un DELETE prometería que
        // la nota desaparece, y pasa lo contrario.
        app.MapPost("/api/reviews/curation/notes/{noteId:guid}/withdraw", async (
            Guid noteId,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var result = await bus.InvokeAsync<Result>(
                new WithdrawEditorialNoteCommand(noteId), ct);

            return result.IsSuccess ? Results.NoContent() : ToProblem(result.Error);
        })
        .WithName("Reviews_WithdrawEditorialNote")
        .WithTags("Reviews")
        .RequireAuthorization(p => p.RequireRole(CurationPolicy.RoleName))
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static IResult ToProblem(Error error)
    {
        var statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError,
        };
        return Results.Problem(title: error.Code, detail: error.Message, statusCode: statusCode);
    }

    private static IResult ToValidationProblem(ValidationException ex)
    {
        var errors = ex.Errors.GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        return Results.ValidationProblem(errors);
    }
}
