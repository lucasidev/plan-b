using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminCareers;

public sealed record AssignCareerAcademicUnitCommand(Guid CareerId, Guid? AcademicUnitId);
public sealed record AssignCareerAcademicUnitRequest(Guid? AcademicUnitId);

public sealed class AssignCareerAcademicUnitEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/academic/careers/{id:guid}/academic-unit", UpdateAsync)
            .WithName("Academic_AssignCareerAcademicUnit")
            .WithTags("Academic")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        AssignCareerAcademicUnitRequest body,
        IMessageBus bus,
        CancellationToken ct)
    {
        var result = await bus.InvokeAsync<Result<UpdateCareerResponse>>(
            new AssignCareerAcademicUnitCommand(id, body.AcademicUnitId),
            ct);

        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        var status = result.Error.Type == ErrorType.NotFound
            ? StatusCodes.Status404NotFound
            : StatusCodes.Status400BadRequest;
        return Results.Problem(title: result.Error.Code, detail: result.Error.Message, statusCode: status);
    }
}

public static class AssignCareerAcademicUnitCommandHandler
{
    public static async Task<Result<UpdateCareerResponse>> Handle(
        AssignCareerAcademicUnitCommand command,
        ICareerRepository careers,
        IAcademicUnitRepository units,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        if (command.CareerId == Guid.Empty)
        {
            return CareerErrors.NotFound;
        }

        var career = await careers.FindByIdAsync(new CareerId(command.CareerId), ct);
        if (career is null)
        {
            return CareerErrors.NotFound;
        }

        if (command.AcademicUnitId is { } id)
        {
            if (id == Guid.Empty)
            {
                return AcademicUnitErrors.NotFound;
            }

            var unit = await units.FindByIdAsync(new AcademicUnitId(id), ct);
            if (unit is null)
            {
                return AcademicUnitErrors.NotFound;
            }

            if (!unit.IsActive || unit.UniversityId != career.UniversityId)
            {
                return CareerErrors.AcademicUnitUniversityMismatch;
            }

            career.AssignAcademicUnit(unit.Id, clock);
        }
        else
        {
            career.AssignAcademicUnit(null, clock);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return new UpdateCareerResponse(career.Id.Value);
    }
}
