using FluentValidation;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

internal sealed class CreatePrerequisiteValidator : AbstractValidator<CreatePrerequisiteCommand>
{
    public CreatePrerequisiteValidator()
    {
        // SubjectId viene de la ruta: el endpoint ya corta con 404 si es Guid.Empty (mismo
        // criterio que CreateAcademicTermCommand.UniversityId, no necesita revalidarse acá).
        // RequiredSubjectId viene del body, así que sí necesita su propio chequeo (mismo criterio
        // que CreateTeacherCommand.UniversityId).
        RuleFor(c => c.RequiredSubjectId).NotEmpty();
    }
}
