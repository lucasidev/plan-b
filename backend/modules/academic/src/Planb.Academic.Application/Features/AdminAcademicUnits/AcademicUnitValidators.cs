using FluentValidation;
using Planb.Academic.Domain.AcademicUnits;

namespace Planb.Academic.Application.Features.AdminAcademicUnits;

internal sealed class CreateAcademicUnitValidator : AbstractValidator<CreateAcademicUnitCommand>
{
    public CreateAcademicUnitValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(AcademicUnit.MaxNameLength);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(AcademicUnit.MaxSlugLength);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(AcademicUnit.MaxAddressLength);
        RuleFor(x => x.Province).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Locality).NotEmpty().MaximumLength(AcademicUnit.MaxLocalityLength);
    }
}

internal sealed class UpdateAcademicUnitValidator : AbstractValidator<UpdateAcademicUnitCommand>
{
    public UpdateAcademicUnitValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(AcademicUnit.MaxNameLength);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(AcademicUnit.MaxSlugLength);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(AcademicUnit.MaxAddressLength);
        RuleFor(x => x.Province).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Locality).NotEmpty().MaximumLength(AcademicUnit.MaxLocalityLength);
    }
}
