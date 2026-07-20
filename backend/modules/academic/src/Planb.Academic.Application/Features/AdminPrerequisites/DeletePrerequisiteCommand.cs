using Planb.Academic.Domain.Prerequisites;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// Baja de una correlativa puntual (US-062, admin). La tripla (subjectId, requiredSubjectId, type)
/// identifica la arista sin ambigüedad: no hay id sintético (ver docstring de <c>Prerequisite</c>).
/// </summary>
public sealed record DeletePrerequisiteCommand(
    Guid SubjectId,
    Guid RequiredSubjectId,
    PrerequisiteType Type);
