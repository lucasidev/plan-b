using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Teachers;

/// <summary>Errores de negocio del aggregate <see cref="Teacher"/> (US-063).</summary>
public static class TeacherErrors
{
    public static readonly Error FirstNameRequired =
        Error.Validation("academic.teacher.first_name_required", "First name is required.");

    public static readonly Error LastNameRequired =
        Error.Validation("academic.teacher.last_name_required", "Last name is required.");

    public static readonly Error NameTooLong =
        Error.Validation(
            "academic.teacher.name_too_long",
            $"First and last name must be at most {Teacher.MaxNameLength} characters each.");

    public static readonly Error TitleTooLong =
        Error.Validation(
            "academic.teacher.title_too_long",
            $"Title must be at most {Teacher.MaxTitleLength} characters.");

    public static readonly Error BioTooLong =
        Error.Validation(
            "academic.teacher.bio_too_long", $"Bio must be at most {Teacher.MaxBioLength} characters.");

    public static readonly Error PhotoUrlTooLong =
        Error.Validation(
            "academic.teacher.photo_url_too_long",
            $"Photo URL must be at most {Teacher.MaxPhotoUrlLength} characters.");

    public static readonly Error NotFound =
        Error.NotFound("academic.teacher.not_found", "Teacher not found.");

    public static readonly Error AlreadyInactive =
        Error.Conflict("academic.teacher.already_inactive", "Teacher is already inactive.");

    public static readonly Error AlreadyActive =
        Error.Conflict("academic.teacher.already_active", "Teacher is already active.");
}
