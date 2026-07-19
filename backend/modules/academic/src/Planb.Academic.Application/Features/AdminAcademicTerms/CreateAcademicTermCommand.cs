using Planb.Academic.Domain;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// Alta de un período lectivo, anclado a una universidad (US-064, admin). El label NO viaja en
/// el command: se computa en el dominio (<see cref="Domain.AcademicTerms.AcademicTerm.ComputeLabel"/>)
/// a partir de year/number/kind, así el admin no puede desalinear el label del período real. Kind
/// llega ya parseado a enum: el endpoint hace el <c>Enum.TryParse</c> desde el string del body.
/// </summary>
public sealed record CreateAcademicTermCommand(
    Guid UniversityId,
    int Year,
    int Number,
    TermKind Kind,
    DateOnly StartDate,
    DateOnly EndDate,
    DateTimeOffset EnrollmentOpens,
    DateTimeOffset EnrollmentCloses);
