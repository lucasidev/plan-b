using FluentValidation;
using Planb.Enrollments.Domain.HistorialImports;

namespace Planb.Enrollments.Application.Features.HistorialImports;

internal sealed class CreateHistorialImportValidator : AbstractValidator<CreateHistorialImportCommand>
{
    public CreateHistorialImportValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();

        // El endpoint ya rechazó payloads vacíos / > 5MB, pero defense en profundidad: el
        // handler nunca debería recibir un command donde la fuente y los datos no coincidan.
        RuleFor(c => c.PdfBytes)
            .NotNull()
            .When(c => c.SourceType == HistorialImportSourceType.Pdf)
            .WithMessage("PdfBytes es requerido cuando SourceType=Pdf.");

        RuleFor(c => c.RawText)
            .NotEmpty()
            .When(c => c.SourceType == HistorialImportSourceType.Text)
            .WithMessage("RawText es requerido cuando SourceType=Text.");
    }
}
