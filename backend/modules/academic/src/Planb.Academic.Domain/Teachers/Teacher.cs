using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Teachers;

/// <summary>
/// Aggregate root del docente del catálogo (US-063). Pertenece a una <see cref="University"/>. Las
/// reseñas lo referencian por <see cref="TeacherId"/> (cross-BC, sin FK; ADR-0017).
///
/// <para>
/// Normalización de nombre (decisión del data-model): se persiste en <b>lowercase</b> (storage),
/// el display en title case lo decide la presentation layer. Así "JUAN PÉREZ" y "Juan Pérez" se
/// guardan igual y se evitan duplicados por mayúsculas/minúsculas. La identidad real (claim) y la
/// respuesta a reseñas (US-040) son verticales aparte; este aggregate es solo el catálogo.
/// </para>
///
/// <para>Soft delete vía <see cref="IsActive"/>: una reseña ancla a <c>docente_reseñado_id</c>, así
/// que hard-deletear dejaría reseñas colgadas. Desactivar preserva la integridad histórica.</para>
/// </summary>
public sealed class Teacher : Entity<TeacherId>, IAggregateRoot
{
    public const int MaxNameLength = 100;
    public const int MaxTitleLength = 100;
    public const int MaxBioLength = 2000;
    public const int MaxPhotoUrlLength = 500;

    public UniversityId UniversityId { get; private set; }
    public string FirstName { get; private set; } = null!;
    public string LastName { get; private set; } = null!;
    public string? Title { get; private set; }
    public string? Bio { get; private set; }
    public string? PhotoUrl { get; private set; }
    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Teacher() { }

    /// <summary>
    /// Crea un docente del catálogo. Nombres normalizados a lowercase; campos opcionales (title,
    /// bio, photoUrl) trimmeados y validados por longitud. Arranca activo.
    /// </summary>
    public static Result<Teacher> Create(
        UniversityId universityId,
        string firstName,
        string lastName,
        string? title,
        string? bio,
        string? photoUrl,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var namesResult = ValidateNames(firstName, lastName);
        if (namesResult.IsFailure)
        {
            return namesResult.Error;
        }

        var detailsResult = ValidateOptionalDetails(title, bio, photoUrl);
        if (detailsResult.IsFailure)
        {
            return detailsResult.Error;
        }

        var now = clock.UtcNow;
        return new Teacher
        {
            Id = TeacherId.New(),
            UniversityId = universityId,
            FirstName = Normalize(firstName),
            LastName = Normalize(lastName),
            Title = TrimToNull(title),
            Bio = TrimToNull(bio),
            PhotoUrl = TrimToNull(photoUrl),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado, para seeder y EF rehydration. Saltea validaciones: el
    /// caller (seed cerrado o repo cargando un row) se hace responsable de datos coherentes.
    /// </summary>
    public static Teacher Hydrate(
        TeacherId id,
        UniversityId universityId,
        string firstName,
        string lastName,
        string? title,
        string? bio,
        string? photoUrl,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            UniversityId = universityId,
            FirstName = firstName,
            LastName = lastName,
            Title = title,
            Bio = bio,
            PhotoUrl = photoUrl,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

    /// <summary>Renombra (lowercase storage). Para corregir tipeos del backoffice.</summary>
    public Result Rename(string firstName, string lastName, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var namesResult = ValidateNames(firstName, lastName);
        if (namesResult.IsFailure)
        {
            return namesResult.Error;
        }

        FirstName = Normalize(firstName);
        LastName = Normalize(lastName);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Patch de los campos opcionales (title, bio, photoUrl). Null deja el campo como está.</summary>
    public Result UpdateProfile(string? title, string? bio, string? photoUrl, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var detailsResult = ValidateOptionalDetails(title, bio, photoUrl);
        if (detailsResult.IsFailure)
        {
            return detailsResult.Error;
        }

        if (title is not null)
        {
            Title = TrimToNull(title);
        }
        if (bio is not null)
        {
            Bio = TrimToNull(bio);
        }
        if (photoUrl is not null)
        {
            PhotoUrl = TrimToNull(photoUrl);
        }

        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Soft delete (US-063). Idempotencia explícita: re-desactivar devuelve error.</summary>
    public Result Deactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsActive)
        {
            return TeacherErrors.AlreadyInactive;
        }

        IsActive = false;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    public Result Reactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (IsActive)
        {
            return TeacherErrors.AlreadyActive;
        }

        IsActive = true;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    private static Result ValidateNames(string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(firstName))
        {
            return TeacherErrors.FirstNameRequired;
        }
        if (string.IsNullOrWhiteSpace(lastName))
        {
            return TeacherErrors.LastNameRequired;
        }
        if (firstName.Trim().Length > MaxNameLength || lastName.Trim().Length > MaxNameLength)
        {
            return TeacherErrors.NameTooLong;
        }
        return Result.Success();
    }

    private static Result ValidateOptionalDetails(string? title, string? bio, string? photoUrl)
    {
        if (title is not null && title.Trim().Length > MaxTitleLength)
        {
            return TeacherErrors.TitleTooLong;
        }
        if (bio is not null && bio.Trim().Length > MaxBioLength)
        {
            return TeacherErrors.BioTooLong;
        }
        if (photoUrl is not null && photoUrl.Trim().Length > MaxPhotoUrlLength)
        {
            return TeacherErrors.PhotoUrlTooLong;
        }
        return Result.Success();
    }

    private static string Normalize(string name) => name.Trim().ToLowerInvariant();

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }
        return value.Trim();
    }
}
