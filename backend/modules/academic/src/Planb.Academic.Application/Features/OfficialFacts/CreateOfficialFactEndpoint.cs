using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// POST /api/academic/official-facts (admin, ADR-0090, US-194, US-202). Carga (o "corrige", cargando
/// una nueva) una afirmación oficial. RelievedBy sale del JWT, no del body. Gateado a rol Admin: una
/// afirmación sin fuente no se guarda (el aggregate la exige siempre, incluso cuando el estado es
/// NotPublished).
/// </summary>
public sealed class CreateOfficialFactEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/official-facts", async (
            CreateOfficialFactRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var relievedBy = CurrentUser.RequireUserId(http);

            var subjectType = OfficialFactEnumParsing.ParseSubjectType(body.SubjectType);
            if (subjectType.IsFailure)
            {
                return Results.Problem(
                    title: subjectType.Error.Code, detail: subjectType.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var status = OfficialFactEnumParsing.ParseStatus(body.Status);
            if (status.IsFailure)
            {
                return Results.Problem(
                    title: status.Error.Code, detail: status.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new CreateOfficialFactCommand(
                subjectType.Value,
                body.SubjectId,
                body.Field,
                status.Value,
                body.Value,
                body.Unit,
                body.Period,
                body.SourceName,
                body.SourceUrl,
                body.SourceDocument,
                body.SourceRetrievedAt,
                body.DerivationRuleId,
                body.Note,
                body.RelievedAt,
                relievedBy);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateOfficialFactResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/official-facts/{result.Value.Id}", result.Value);
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
        .WithName("Academic_CreateOfficialFact")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(OfficialFactPolicy.RoleName))
        .Produces<CreateOfficialFactResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

/// <summary>
/// Body del POST. Sin RelievedBy (sale del JWT). SubjectType y Status viajan como string (el
/// endpoint los parsea con <see cref="OfficialFactEnumParsing"/>).
/// </summary>
public sealed record CreateOfficialFactRequest(
    string SubjectType,
    Guid SubjectId,
    string Field,
    string Status,
    string? Value,
    string? Unit,
    string? Period,
    string SourceName,
    string SourceUrl,
    string? SourceDocument,
    DateTimeOffset SourceRetrievedAt,
    string? DerivationRuleId,
    string? Note,
    DateTimeOffset RelievedAt);
