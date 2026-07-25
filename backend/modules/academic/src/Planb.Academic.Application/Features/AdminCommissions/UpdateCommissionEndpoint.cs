using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// PUT /api/academic/commissions/{id:guid} (admin, US-093). Replace del form completo de la comisión
/// salvo subject/term (no se pueden mover). Gateado a rol Admin.
/// </summary>
public sealed class UpdateCommissionEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/academic/commissions/{id:guid}", async (
            Guid id,
            UpdateCommissionRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.commission.not_found",
                    detail: "Commission not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var modality = CommissionEnumParsing.ParseModality(body.Modality);
            if (modality.IsFailure)
            {
                return Results.Problem(
                    title: modality.Error.Code, detail: modality.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var teachers = new List<UpdateCommissionTeacherItem>();
            foreach (var teacher in body.Teachers ?? [])
            {
                var role = CommissionEnumParsing.ParseTeacherRole(teacher.Role);
                if (role.IsFailure)
                {
                    return Results.Problem(
                        title: role.Error.Code, detail: role.Error.Message,
                        statusCode: StatusCodes.Status400BadRequest);
                }
                teachers.Add(new UpdateCommissionTeacherItem(teacher.TeacherId, role.Value));
            }

            var schedule = new List<UpdateCommissionScheduleItem>();
            foreach (var block in body.Schedule ?? [])
            {
                var day = CommissionEnumParsing.ParseDay(block.Day);
                if (day.IsFailure)
                {
                    return Results.Problem(
                        title: day.Error.Code, detail: day.Error.Message,
                        statusCode: StatusCodes.Status400BadRequest);
                }
                var start = CommissionEnumParsing.ParseTime(block.Start, "start");
                if (start.IsFailure)
                {
                    return Results.Problem(
                        title: start.Error.Code, detail: start.Error.Message,
                        statusCode: StatusCodes.Status400BadRequest);
                }
                var end = CommissionEnumParsing.ParseTime(block.End, "end");
                if (end.IsFailure)
                {
                    return Results.Problem(
                        title: end.Error.Code, detail: end.Error.Message,
                        statusCode: StatusCodes.Status400BadRequest);
                }
                schedule.Add(new UpdateCommissionScheduleItem(day.Value, start.Value, end.Value));
            }

            var command = new UpdateCommissionCommand(
                id, body.Name, modality.Value, body.Capacity, body.Notes, teachers, schedule);

            try
            {
                var result = await bus.InvokeAsync<Result<UpdateCommissionResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Ok(result.Value);
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
        .WithName("Academic_UpdateCommission")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCommissionPolicy.RoleName))
        .Produces<UpdateCommissionResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>Body del PUT. Igual al POST de alta, sin termId/subjectId (no se pueden mover).</summary>
public sealed record UpdateCommissionRequest(
    string Name,
    string? Modality,
    int? Capacity,
    string? Notes,
    IReadOnlyList<UpdateCommissionTeacherRequest>? Teachers,
    IReadOnlyList<UpdateCommissionScheduleRequest>? Schedule);

/// <summary>Docente del body del PUT: id + rol como string.</summary>
public sealed record UpdateCommissionTeacherRequest(Guid TeacherId, string? Role);

/// <summary>Franja horaria del body del PUT: día + horas "HH:mm" como string.</summary>
public sealed record UpdateCommissionScheduleRequest(string? Day, string? Start, string? End);
