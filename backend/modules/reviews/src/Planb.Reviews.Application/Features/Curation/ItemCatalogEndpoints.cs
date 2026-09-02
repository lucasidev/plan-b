using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// El catálogo de frases del backoffice (US-198): leerlo, editar una sin cortar su serie, y abrir un
/// código nuevo cuando cambió lo que se pregunta.
///
/// <para>
/// Los dos caminos de escritura son dos endpoints y no uno con un flag, porque son dos actos
/// distintos: PUT edita la frase que ya existe; POST supersede crea otra y retira esta. Un solo
/// endpoint que decidiera por su cuenta cuál de los dos hacer estaría adivinando algo que solo sabe
/// quien cura, y el precio de adivinar mal es una serie cortada de más o de menos.
/// </para>
/// </summary>
public sealed class ItemCatalogEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/curation/items", async (IMessageBus bus, CancellationToken ct) =>
            Results.Ok(await bus.InvokeAsync<GetItemsResponse>(new GetItemsQuery(), ct)))
        .WithName("Reviews_GetItems")
        .WithTags("Reviews")
        .RequireAuthorization(p => p.RequireRole(CurationPolicy.RoleName))
        .Produces<GetItemsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);

        app.MapPut("/api/reviews/curation/items/{id:guid}", async (
            Guid id,
            EditItemRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var parsed = ParseBody(body.Layer, body.Options);
            if (parsed.IsFailure)
            {
                return Problem(parsed.Error);
            }

            var command = new EditItemCommand(
                id,
                body.Text,
                body.Help,
                parsed.Value.Layer,
                parsed.Value.Options,
                CurrentUser.RequireUserId(http).Value);

            return await Send(bus, command, _ => Results.NoContent(), ct);
        })
        .WithName("Reviews_EditItem")
        .WithTags("Reviews")
        .RequireAuthorization(p => p.RequireRole(CurationPolicy.RoleName))
        .Produces(StatusCodes.Status204NoContent)
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        app.MapPost("/api/reviews/curation/items/{id:guid}/supersede", async (
            Guid id,
            SupersedeItemRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var parsed = ParseBody(body.Layer, body.Options);
            if (parsed.IsFailure)
            {
                return Problem(parsed.Error);
            }

            var command = new SupersedeItemCommand(
                id,
                body.Code,
                body.Text,
                body.Help,
                parsed.Value.Layer,
                parsed.Value.Options,
                CurrentUser.RequireUserId(http).Value);

            return await Send<SupersedeItemResponse>(
                bus,
                command,
                response => Results.Created("/api/reviews/curation/items", response),
                ct);
        })
        .WithName("Reviews_SupersedeItem")
        .WithTags("Reviews")
        .RequireAuthorization(p => p.RequireRole(CurationPolicy.RoleName))
        .Produces<SupersedeItemResponse>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    /// <summary>
    /// Los enums que viajan como string. Un typo tiene que salir como 400 con su mensaje y no como
    /// el 500 que produce un fallo de binding.
    /// </summary>
    private static Result<(Domain.Catalog.ItemLayer Layer, List<CuratedOption> Options)> ParseBody(
        string layer,
        IReadOnlyList<CuratedOptionRequest> options)
    {
        if (!CurationEnumParsing.TryLayer(layer, out var parsedLayer))
        {
            return Error.Validation("reviews.item.invalid_layer", "That layer does not exist.");
        }

        var parsedOptions = new List<CuratedOption>(options.Count);
        foreach (var option in options)
        {
            if (!CurationEnumParsing.TryValence(option.Valence, out var valence))
            {
                return Error.Validation("reviews.item.invalid_valence", "That valence does not exist.");
            }

            parsedOptions.Add(new CuratedOption(option.Value, option.Order, option.Label, valence));
        }

        return (parsedLayer, parsedOptions);
    }

    private static async Task<IResult> Send<TResponse>(
        IMessageBus bus,
        object command,
        Func<TResponse, IResult> onSuccess,
        CancellationToken ct)
    {
        try
        {
            var result = await bus.InvokeAsync<Result<TResponse>>(command, ct);
            return result.IsSuccess ? onSuccess(result.Value) : Problem(result.Error);
        }
        catch (ValidationException ex)
        {
            return ValidationProblem(ex);
        }
    }

    /// <summary>
    /// La edición no devuelve cuerpo, así que su handler devuelve <see cref="Result"/> a secas y no
    /// entra por el genérico de arriba: no hay TResponse que inferir.
    /// </summary>
    private static async Task<IResult> Send(
        IMessageBus bus,
        object command,
        Func<Result, IResult> onSuccess,
        CancellationToken ct)
    {
        try
        {
            var result = await bus.InvokeAsync<Result>(command, ct);
            return result.IsSuccess ? onSuccess(result) : Problem(result.Error);
        }
        catch (ValidationException ex)
        {
            return ValidationProblem(ex);
        }
    }

    private static IResult Problem(Error error) =>
        Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: error.Type switch
            {
                ErrorType.Validation => StatusCodes.Status400BadRequest,
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError,
            });

    private static IResult ValidationProblem(ValidationException ex) =>
        Results.ValidationProblem(ex.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()));
}
