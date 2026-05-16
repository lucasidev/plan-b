using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// Handler del POST /api/me/career-plan-imports (US-088). Crea el aggregate en estado Pending
/// y encola el procesamiento async via Wolverine. Mismo pattern que CreateHistorialImport.
/// </summary>
public static class CreateCareerPlanImportCommandHandler
{
    public static async Task<Result<CreateCareerPlanImportResponse>> Handle(
        CreateCareerPlanImportCommand command,
        ICareerPlanImportRepository imports,
        IAcademicQueryService academic,
        IAcademicUnitOfWork unitOfWork,
        IMessageBus bus,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // Validar que la universidad existe en el catálogo.
        var universityExists = await academic.UniversityExistsAsync(command.UniversityId, ct);
        if (!universityExists)
        {
            return CareerPlanImportErrors.UniversityNotFound;
        }

        var importResult = CareerPlanImport.Create(
            uploadedByUserId: command.UserId,
            universityId: new UniversityId(command.UniversityId),
            careerName: command.CareerName,
            planYear: command.PlanYear,
            studentEnrollmentYear: command.StudentEnrollmentYear,
            sourceType: command.SourceType,
            clock: clock);

        if (importResult.IsFailure)
        {
            return importResult.Error;
        }

        var import = importResult.Value;
        await imports.AddAsync(import, ct);
        await unitOfWork.SaveChangesAsync(ct);

        // Encolar el worker async para parsear. PublishAsync al outbox de Wolverine garantiza
        // at-least-once + transactional con el SaveChanges de arriba.
        await bus.PublishAsync(new ProcessCareerPlanImportCommand(
            ImportId: import.Id.Value,
            SourceType: command.SourceType,
            PdfBytes: command.PdfBytes,
            RawText: command.RawText));

        return new CreateCareerPlanImportResponse(
            Id: import.Id.Value,
            Status: import.Status.ToString());
    }
}
