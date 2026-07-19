using Planb.Academic.Domain;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// Edición de un período lectivo (US-064, admin). Replace del form completo: year, number, kind y
/// las ventanas de fecha se re-validan; el label se recomputa a partir de los nuevos valores. Kind
/// llega ya parseado a enum: el endpoint hace el <c>Enum.TryParse</c> desde el string del body.
/// </summary>
public sealed record UpdateAcademicTermCommand(
    Guid AcademicTermId,
    int Year,
    int Number,
    TermKind Kind,
    DateOnly StartDate,
    DateOnly EndDate,
    DateTimeOffset EnrollmentOpens,
    DateTimeOffset EnrollmentCloses);
