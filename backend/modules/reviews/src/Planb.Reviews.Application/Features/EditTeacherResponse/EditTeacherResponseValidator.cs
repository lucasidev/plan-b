using FluentValidation;

namespace Planb.Reviews.Application.Features.EditTeacherResponse;

internal sealed class EditTeacherResponseValidator : AbstractValidator<EditTeacherResponseCommand>
{
    public EditTeacherResponseValidator()
    {
        RuleFor(c => c.ReviewId).NotEmpty();
        // El largo (50..2000) lo valida el VO ReviewText en el handler; acá solo el caso vacío.
        RuleFor(c => c.Text)
            .NotEmpty()
            .WithMessage("Escribí tu respuesta.");
    }
}
