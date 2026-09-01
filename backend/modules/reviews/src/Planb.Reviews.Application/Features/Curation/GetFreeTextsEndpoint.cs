using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// GET /api/reviews/curation/free-texts (ADR-0084): el campo libre, para que el equipo lo lea.
///
/// <para>
/// El ADR le prometió dos salidas al campo libre, destilar ítems y escribir notas editoriales, y
/// ninguna se puede hacer sin leerlo. Hasta acá lo único que lo leía era su propio autor: la
/// curaduría existía en el papel y no en el producto.
/// </para>
///
/// <para>
/// Gateado por rol, a diferencia de todo lo que la ficha publica: del otro lado hay texto que
/// alguien escribió con sus palabras, y el producto le prometió que no se publica. Lo que devuelve
/// no incluye la cuenta de quien escribió, y esa ausencia empieza en el SELECT.
/// </para>
/// </summary>
public sealed class GetFreeTextsEndpoint : ICarterModule
{
    /// <summary>Cuántos trae una tanda si no se pide otra cosa, y el techo de lo que se puede pedir.</summary>
    private const int DefaultTake = 25;
    private const int MaxTake = 100;

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/curation/free-texts", async (
            IFreeTextQueryService freeTexts,
            IAcademicQueryService academic,
            CancellationToken ct,
            int? skip = null,
            int? take = null) =>
        {
            // Se acotan acá y no en el read: un take gigante no es un error de negocio que valga
            // un 400, es un pedido que se sirve de a tandas igual.
            var safeSkip = Math.Max(0, skip ?? 0);
            var safeTake = Math.Clamp(take ?? DefaultTake, 1, MaxTake);

            var view = await GetFreeTextsQueryHandler.Handle(
                safeSkip, safeTake, freeTexts, academic, ct);

            return Results.Ok(view);
        })
        .WithName("Reviews_GetCurationFreeTexts")
        .WithTags("Reviews")
        .RequireAuthorization(p => p.RequireRole(CurationPolicy.RoleName))
        .Produces<FreeTextsView>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
