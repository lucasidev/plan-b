using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Handler del POST /api/me/historial-imports:
///
/// <list type="number">
///   <item>Resolver el StudentProfile activo del user (cross-BC via IIdentityQueryService).
///         Sin profile → NotFound.</item>
///   <item>Crear el aggregate en estado Pending.</item>
///   <item>Persistir.</item>
///   <item>Enviar <see cref="ProcessHistorialImportCommand"/> al bus para que el worker
///         lo procese async.</item>
///   <item>Responder 202 con <see cref="CreateHistorialImportResponse"/>.</item>
/// </list>
///
/// El handler no procesa el PDF ni corre el parser — eso lo hace el worker. Esto mantiene el
/// endpoint rápido (responde inmediato) y el procesamiento desacoplado (puede tomar segundos
/// sin bloquear al user).
/// </summary>
public static class CreateHistorialImportCommandHandler
{
    public static async Task<Result<CreateHistorialImportResponse>> Handle(
        CreateHistorialImportCommand command,
        IHistorialImportRepository imports,
        IEnrollmentsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IMessageBus bus,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // Identity ya validó el JWT (RequireAuthorization en el endpoint). Verificamos que
        // el user tiene profile activo para asociar el import.
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return HistorialImportErrors.StudentProfileRequired;
        }

        var import = HistorialImport.Create(profile.Id, command.SourceType, clock);
        await imports.AddAsync(import, ct);
        await unitOfWork.SaveChangesAsync(ct);

        // Encolar para que el worker procese. PublishAsync va al outbox de Wolverine (mismo
        // schema), así que la garantía es "at-least-once" + transactional con el SaveChanges
        // de arriba.
        await bus.PublishAsync(new ProcessHistorialImportCommand(
            ImportId: import.Id.Value,
            SourceType: command.SourceType,
            PdfBytes: command.PdfBytes,
            RawText: command.RawText));

        return new CreateHistorialImportResponse(
            Id: import.Id.Value,
            Status: import.Status.ToString());
    }
}
