using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Careers;

public static class CareerErrors
{
    public static readonly Error NameRequired =
        Error.Validation("academic.career.name_required", "Career name is required.");

    public static readonly Error SlugRequired =
        Error.Validation("academic.career.slug_required", "Career slug is required.");
}
