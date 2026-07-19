using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// Handler del POST /api/academic/universities/{universityId}/terms (admin). (year, number, kind)
/// es único por universidad (UNIQUE(university_id, year, number, kind) intra-schema), así que se
/// chequea contra el repo antes de crear el aggregate. El label se computa acá (no lo tipea el
/// admin) y se pasa a <see cref="AcademicTerm.Create"/>.
/// </summary>
public static class CreateAcademicTermCommandHandler
{
    public static async Task<Result<CreateAcademicTermResponse>> Handle(
        CreateAcademicTermCommand command,
        IAcademicTermRepository terms,
        IAcademicQueryService academic,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // University y AcademicTerm viven en el mismo schema academic (sin FK declarada):
        // validamos la existencia en el app-layer, igual que CreateCareer (ADR-0017). Sin esto
        // quedan terms huérfanos.
        if (!await academic.UniversityExistsAsync(command.UniversityId, ct))
        {
            return AcademicTermErrors.UniversityNotFound;
        }

        var universityId = new UniversityId(command.UniversityId);

        if (await terms.ExistsAsync(
            universityId, command.Year, command.Number, command.Kind, excludeId: null, ct))
        {
            return AcademicTermErrors.AlreadyExists;
        }

        var label = AcademicTerm.ComputeLabel(command.Year, command.Number, command.Kind);

        var result = AcademicTerm.Create(
            universityId,
            command.Year,
            command.Number,
            command.Kind,
            command.StartDate,
            command.EndDate,
            command.EnrollmentOpens,
            command.EnrollmentCloses,
            label,
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await terms.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateAcademicTermResponse(result.Value.Id.Value);
    }
}
