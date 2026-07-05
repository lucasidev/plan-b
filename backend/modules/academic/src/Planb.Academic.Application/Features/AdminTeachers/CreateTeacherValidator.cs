using FluentValidation;
using Planb.Academic.Domain.Teachers;

namespace Planb.Academic.Application.Features.AdminTeachers;

internal sealed class CreateTeacherValidator : AbstractValidator<CreateTeacherCommand>
{
    public CreateTeacherValidator()
    {
        RuleFor(c => c.UniversityId).NotEmpty();
        RuleFor(c => c.FirstName).NotEmpty().MaximumLength(Teacher.MaxNameLength);
        RuleFor(c => c.LastName).NotEmpty().MaximumLength(Teacher.MaxNameLength);
        RuleFor(c => c.Title).MaximumLength(Teacher.MaxTitleLength).When(c => c.Title is not null);
        RuleFor(c => c.Bio).MaximumLength(Teacher.MaxBioLength).When(c => c.Bio is not null);
        RuleFor(c => c.PhotoUrl).MaximumLength(Teacher.MaxPhotoUrlLength).When(c => c.PhotoUrl is not null);
    }
}
