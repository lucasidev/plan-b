using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// POST /api/academic/subjects/{subjectId:guid}/commissions (admin, US-093). Alta de una comisión
/// (oferta concreta de una materia en un cuatrimestre) con sus docentes y horario. Gateado a rol
/// Admin.
/// </summary>
public sealed class CreateCommissionEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/subjects/{subjectId:guid}/commissions", async (
            Guid subjectId,
            CreateCommissionRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid (es un guid sintácticamente válido) pero
            // SubjectId lo rechaza en su ctor: cortamos acá para devolver 404 limpio.
            if (subjectId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.commission.subject_not_found",
                    detail: "Subject not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var modality = CommissionEnumParsing.ParseModality(body.Modality);
            if (modality.IsFailure)
            {
                return Results.Problem(
                    title: modality.Error.Code, detail: modality.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var teachers = new List<CreateCommissionTeacherItem>();
            foreach (var teacher in body.Teachers ?? [])
            {
                var role = CommissionEnumParsing.ParseTeacherRole(teacher.Role);
                if (role.IsFailure)
                {
                    return Results.Problem(
                        title: role.Error.Code, detail: role.Error.Message,
                        statusCode: StatusCodes.Status400BadRequest);
                }
                teachers.Add(new CreateCommissionTeacherItem(teacher.TeacherId, role.Value));
            }

            var schedule = new List<CreateCommissionScheduleItem>();
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
                schedule.Add(new CreateCommissionScheduleItem(day.Value, start.Value, end.Value));
            }

            var command = new CreateCommissionCommand(
                subjectId, body.TermId, body.Name, modality.Value, body.Capacity, body.Notes,
                teachers, schedule);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateCommissionResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/commissions/{result.Value.Id}", result.Value);
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
        .WithName("Academic_CreateCommission")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCommissionPolicy.RoleName))
        .Produces<CreateCommissionResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>
/// Body del POST. Modality/role/day/start/end viajan como string (el endpoint los parsea). Teachers y
/// Schedule son opcionales en el JSON: una comisión sin docentes o sin horario cargado todavía es un
/// estado válido (ver <see cref="Domain.Commissions.Commission.ReplaceSchedule"/>).
/// </summary>
public sealed record CreateCommissionRequest(
    Guid TermId,
    string Name,
    string? Modality,
    int? Capacity,
    string? Notes,
    IReadOnlyList<CreateCommissionTeacherRequest>? Teachers,
    IReadOnlyList<CreateCommissionScheduleRequest>? Schedule);

/// <summary>Docente del body del POST: id + rol como string.</summary>
public sealed record CreateCommissionTeacherRequest(Guid TeacherId, string? Role);

/// <summary>Franja horaria del body del POST: día + horas "HH:mm" como string.</summary>
public sealed record CreateCommissionScheduleRequest(string? Day, string? Start, string? End);
