using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// POST /api/me/simulator/evaluate (US-016).
///
/// Auth: JwtBearer middleware extrae el <c>UserId</c> del claim <c>sub</c>; el body solo lleva
/// el subset de materias a evaluar. Mismo criterio de <see cref="CurrentUser"/> que
/// GetAvailableSubjectsEndpoint.
///
/// <para>
/// Tres desenlaces posibles:
/// <list type="bullet">
///   <item><c>200 OK</c>: combinación viable, body con las métricas
///         (<see cref="EvaluateSimulationResponse"/>, <c>IsValid=true</c>).</item>
///   <item><c>409 Conflict</c>: alguna materia del subset está bloqueada. El body es el mismo
///         <see cref="EvaluateSimulationResponse"/> (<c>IsValid=false</c>) con el detalle en
///         <c>BlockedSubjects</c>: no entra en el shape fijo de <c>Error</c>, así que no viaja
///         como <c>Results.Problem</c> (mismo criterio que el 409 <c>has_dependents</c> de
///         Academic en DeactivateSubjectEndpoint).</item>
///   <item><c>400/404</c>: <c>Results.Problem</c> genérico para el resto de las fallas
///         (materia fuera del plan, sin StudentProfile activo, etc.).</item>
/// </list>
/// </para>
///
/// <para>
/// En el 200, <c>weightedDifficulty</c> y las tasas de <c>combinationStats</c> pueden venir
/// <c>null</c> a propósito (sin reseñas, sin cohorte, o cohorte por debajo del piso
/// anti-reidentificación de ADR-0047): ver <see cref="EvaluateSimulationResponse"/> y
/// <see cref="CombinationCohortStats"/> para el criterio completo. <c>sampleSize</c> siempre
/// viaja con su valor real.
/// </para>
/// </summary>
public sealed class EvaluateSimulationEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/simulator/evaluate", async (
            EvaluateSimulationRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var command = new EvaluateSimulationCommand(userId.Value, body.SubjectIds);

            try
            {
                var result = await bus.InvokeAsync<Result<EvaluateSimulationResponse>>(command, ct);

                if (result.IsFailure)
                {
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
                    return Results.Problem(title: error.Code, detail: error.Message, statusCode: statusCode);
                }

                if (!result.Value.IsValid)
                {
                    return Results.Json(result.Value, statusCode: StatusCodes.Status409Conflict);
                }

                return Results.Ok(result.Value);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Planning_EvaluateSimulation")
        .WithTags("Planning")
        .RequireAuthorization()
        .Produces<EvaluateSimulationResponse>(StatusCodes.Status200OK)
        .Produces<EvaluateSimulationResponse>(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
