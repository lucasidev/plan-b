using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// Handler del POST /api/academic/official-facts (admin, ADR-0090). El sujeto (institución, unidad
/// académica u oferta) no tiene FK (ADR-0017): se valida su existencia contra el repo del aggregate
/// que corresponde a <see cref="CreateOfficialFactCommand.SubjectType"/> antes de crear la afirmación.
/// </summary>
public static class CreateOfficialFactCommandHandler
{
    public static async Task<Result<CreateOfficialFactResponse>> Handle(
        CreateOfficialFactCommand command,
        IUniversityRepository universities,
        IAcademicUnitRepository academicUnits,
        ICareerRepository careers,
        IOfficialFactRepository officialFacts,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var subjectExists = command.SubjectType switch
        {
            OfficialFactSubjectType.Institution =>
                await universities.FindByIdAsync(new UniversityId(command.SubjectId), ct) is not null,
            OfficialFactSubjectType.AcademicUnit =>
                await academicUnits.FindByIdAsync(new AcademicUnitId(command.SubjectId), ct) is not null,
            OfficialFactSubjectType.Offering =>
                await careers.FindByIdAsync(new CareerId(command.SubjectId), ct) is not null,
            _ => false,
        };
        if (!subjectExists)
        {
            return OfficialFactErrors.SubjectNotFound;
        }

        var result = OfficialFact.Create(
            command.SubjectType,
            command.SubjectId,
            command.Field,
            command.Status,
            command.Value,
            command.Unit,
            command.Period,
            command.SourceName,
            command.SourceUrl,
            command.SourceDocument,
            command.SourceRetrievedAt,
            command.DerivationRuleId,
            command.Note,
            command.RelievedAt,
            command.RelievedBy,
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await officialFacts.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateOfficialFactResponse(result.Value.Id.Value);
    }
}
