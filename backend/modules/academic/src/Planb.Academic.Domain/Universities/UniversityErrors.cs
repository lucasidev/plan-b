using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Universities;

public static class UniversityErrors
{
    public static readonly Error NameRequired =
        Error.Validation("academic.university.name_required", "University name is required.");

    public static readonly Error SlugRequired =
        Error.Validation("academic.university.slug_required", "University slug is required.");
}
