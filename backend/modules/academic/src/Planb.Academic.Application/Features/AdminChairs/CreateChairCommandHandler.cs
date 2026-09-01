using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Chairs;
using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Handler del alta de una cátedra (US-196). Valida en app-layer lo que no puede validar el
/// aggregate: que la materia exista y esté activa, y que el nombre no lo use otra cátedra de la
/// misma materia.
///
/// <para>
/// Resuelve la materia por su repo de escritura y no por <c>IAcademicQueryService</c>: el read
/// público ya filtra <c>is_active = true</c> y colapsaría "no existe" con "existe pero archivada",
/// que son dos respuestas distintas.
/// </para>
/// </summary>
public static class CreateChairCommandHandler
{
    public static async Task<Result<CreateChairResponse>> Handle(
        CreateChairCommand command,
        IChairRepository chairs,
        ISubjectRepository subjects,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var subjectId = new SubjectId(command.SubjectId);

        var subject = await subjects.GetByIdAsync(subjectId, ct);
        if (subject is null)
        {
            return ChairErrors.SubjectNotFound;
        }

        // No se abren cátedras sobre una materia que ya no se dicta: archivar tiene que significar
        // algo, y una cátedra nueva la devolvería a la superficie del producto.
        if (!subject.IsActive)
        {
            return ChairErrors.SubjectInactive;
        }

        var name = command.Name.Trim();
        if (await chairs.ExistsByNameAsync(subjectId, name, excludeId: null, ct))
        {
            return ChairErrors.NameAlreadyExists;
        }

        var result = Chair.Create(subjectId, name, clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await chairs.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateChairResponse(result.Value.Id.Value, result.Value.Name);
    }
}
