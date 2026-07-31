using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Reviews.Application.Features.ReconcileEnrollmentChanges;

/// <summary>
/// POST /api/admin/reviews/reconcile-enrollment-changes (US-015).
///
/// <para>
/// Es la red de contención del evento de edición de cursada: lo corre staff cuando sospecha que
/// hubo entregas perdidas, o de forma periódica. El porqué de que esto exista, y por qué no es un
/// flag en la reseña, está en <see cref="ReconcileEnrollmentChangesCommand"/>.
/// </para>
///
/// <para>
/// POST y no GET aunque suene a consulta: no es idempotente en el sentido HTTP, escribe. Que
/// correrlo dos veces dé el mismo estado final es una propiedad del handler, no del verbo.
/// </para>
///
/// <para>
/// Gateado a staff. Los nombres de rol se comparan contra el claim del JWT y tienen que coincidir
/// con <c>Planb.Identity.Domain.Users.UserRole.{Moderator,Admin}</c>; el acoplamiento por string es
/// el mismo que ya usa el backoffice de moderación, que tampoco referencia el enum de Identity.
/// </para>
/// </summary>
public sealed class ReconcileEnrollmentChangesEndpoint : ICarterModule
{
    private static readonly string[] StaffRoles = ["Moderator", "Admin"];

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/admin/reviews/reconcile-enrollment-changes", async (
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var result = await bus.InvokeAsync<Result<ReconcileEnrollmentChangesResponse>>(
                new ReconcileEnrollmentChangesCommand(), ct);

            if (result.IsSuccess)
            {
                return Results.Ok(result.Value);
            }

            return Results.Problem(
                title: result.Error.Code,
                detail: result.Error.Message,
                statusCode: StatusCodes.Status500InternalServerError);
        })
        .WithName("Reviews_ReconcileEnrollmentChanges")
        .WithTags("Reviews")
        .RequireAuthorization(p => p.RequireRole(StaffRoles))
        .Produces<ReconcileEnrollmentChangesResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
