using Planb.Academic.Domain.Prerequisites;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// Alta de una correlativa entre dos materias del mismo plan (US-062, admin). Type llega ya
/// parseado a enum: el endpoint hace el Enum.TryParse desde el string del body (mismo criterio que
/// CreateAcademicTermCommand.Kind).
/// </summary>
public sealed record CreatePrerequisiteCommand(
    Guid SubjectId,
    Guid RequiredSubjectId,
    PrerequisiteType Type);
