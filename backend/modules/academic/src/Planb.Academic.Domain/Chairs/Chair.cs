using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Chairs;

/// <summary>
/// Aggregate root de la cátedra (US-196): el equipo docente a cargo de una materia, con su titular.
/// Es lo que el alumno recuerda al reseñar ("cursé con Pérez") y el sujeto de la ficha que publica
/// sus conteos (ADR-0083). La reseña la referencia por <see cref="ChairId"/> (cross-BC, sin FK;
/// ADR-0017).
///
/// <para>
/// La cátedra <b>persiste entre períodos</b>, y una materia puede tener varias en paralelo: eso es
/// exactamente lo que la ficha compara ("acá se pierden clases; en las otras dos cátedras de la
/// materia, no").
/// </para>
///
/// <para>
/// Invariantes internos (validados acá): nombre no vacío y dentro del largo, un docente no puede
/// estar dos veces vigente, y a lo sumo un titular vigente. La coherencia cross-aggregate (que la
/// materia exista y esté activa, que los docentes existan y sean de la misma universidad, que los
/// períodos del tramo existan y estén bien ordenados) la valida el application service, que es el
/// único que ve esos aggregates.
/// </para>
/// </summary>
public sealed class Chair : Entity<ChairId>, IAggregateRoot
{
    public const int MaxNameLength = 100;

    public SubjectId SubjectId { get; private set; }

    /// <summary>
    /// Cómo la nombra el alumno: casi siempre el apellido del titular ("Pérez"), a veces una letra
    /// ("A"). Se guarda tal cual se carga, sin normalizar a lowercase: es un label de display, no
    /// una clave de deduplicación como el nombre del docente.
    /// </summary>
    public string Name { get; private set; } = null!;

    /// <summary>
    /// Soft delete (ADR-0057). Una cátedra archivada desaparece de lo que Reseñar ofrece y sigue
    /// existiendo para las reseñas que ya la referencian: su ficha se lee igual, porque lo que se
    /// dictó se dictó.
    /// </summary>
    public bool IsActive { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<ChairMember> _members = [];

    /// <summary>El equipo completo, histórico incluido. Se carga eager con el aggregate.</summary>
    public IReadOnlyList<ChairMember> Members => _members;

    /// <summary>Quiénes están hoy: lo que la ficha nombra y lo que Reseñar muestra.</summary>
    public IEnumerable<ChairMember> CurrentMembers => _members.Where(m => m.IsCurrent);

    /// <summary>El titular vigente, si hay. Null cuando la cátedra quedó sin titular nombrado.</summary>
    public ChairMember? CurrentLead =>
        _members.FirstOrDefault(m => m.IsCurrent && m.Role == ChairMemberRole.Lead);

    private Chair() { }

    /// <summary>
    /// Crea una cátedra vacía (el equipo se suma con <see cref="AddMember"/>). Arranca activa. El
    /// nombre se trimea; que no esté repetido dentro de la materia lo valida el application layer
    /// contra el UNIQUE de DB.
    /// </summary>
    public static Result<Chair> Create(
        SubjectId subjectId,
        string name,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = ValidateName(name);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        var now = clock.UtcNow;
        return new Chair
        {
            Id = ChairId.New(),
            SubjectId = subjectId,
            Name = name.Trim(),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado, para el seeder. EF no pasa por acá (materializa por ctor
    /// privado y setters). Valida el equipo y tira si viene incoherente: el manifiesto del seeder
    /// entra sin que nadie lo revise, y un equipo con dos titulares vigentes se persistiría sin
    /// ruido para romper la ficha después.
    /// </summary>
    /// <exception cref="ArgumentException">Si el equipo viola los invariantes del aggregate.</exception>
    public static Chair Hydrate(
        ChairId id,
        SubjectId subjectId,
        string name,
        IEnumerable<(TeacherId TeacherId, ChairMemberRole Role, AcademicTermId Since, AcademicTermId? Until)> members,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var chair = new Chair
        {
            Id = id,
            SubjectId = subjectId,
            Name = name,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

        var built = BuildMemberSet(members);
        if (built.IsFailure)
        {
            throw new ArgumentException(
                $"Chair '{name}' ({id.Value}) has an invalid teaching staff: {built.Error.Code}.",
                nameof(members));
        }

        chair._members.AddRange(built.Value);
        return chair;
    }

    /// <summary>Renombra la cátedra. Para corregir tipeos o seguir cómo la nombra el alumno.</summary>
    public Result Rename(string name, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = ValidateName(name);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        Name = name.Trim();
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Suma un docente al equipo desde el período dado. Invariantes: no puede estar vigente dos
    /// veces, y si entra como titular no puede haber otro titular vigente (cerralo primero con
    /// <see cref="CloseMember"/>, que es lo que deja el rastro del cambio de titular).
    /// </summary>
    public Result AddMember(
        TeacherId teacherId,
        ChairMemberRole role,
        AcademicTermId sinceTermId,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (_members.Any(m => m.IsCurrent && m.TeacherId == teacherId))
        {
            return ChairErrors.TeacherAlreadyInChair;
        }

        if (role == ChairMemberRole.Lead && CurrentLead is not null)
        {
            return ChairErrors.LeadAlreadyAssigned;
        }

        _members.Add(new ChairMember(teacherId, role, sinceTermId));
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Cierra el tramo de un docente en el período dado: deja de estar en el equipo y su paso queda
    /// registrado. No se borra la fila, porque las reseñas de esos períodos siguen siendo suyas.
    /// </summary>
    public Result CloseMember(TeacherId teacherId, AcademicTermId untilTermId, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var current = _members.FirstOrDefault(m => m.IsCurrent && m.TeacherId == teacherId);
        if (current is null)
        {
            return ChairErrors.TeacherNotInChair;
        }

        current.CloseAt(untilTermId);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Reemplaza el equipo entero por el conjunto dado, validándolo antes de mutar. Es la operación
    /// del PUT del backoffice, y es atómica porque un <c>Result.Failure</c> no es una excepción y no
    /// dispara el rollback de Wolverine: mutar en pasos dejaría un equipo a medio aplicar
    /// commiteado.
    /// </summary>
    public Result ReplaceStaff(
        IEnumerable<(TeacherId TeacherId, ChairMemberRole Role, AcademicTermId Since, AcademicTermId? Until)> members,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(members);
        ArgumentNullException.ThrowIfNull(clock);

        var built = BuildMemberSet(members);
        if (built.IsFailure)
        {
            return built.Error;
        }

        _members.Clear();
        _members.AddRange(built.Value);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Soft delete (ADR-0057). Idempotencia explícita: re-archivar devuelve error.</summary>
    public Result Deactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsActive)
        {
            return ChairErrors.AlreadyInactive;
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
            return ChairErrors.AlreadyActive;
        }

        IsActive = true;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Arma el equipo validando los invariantes sin mutar: ningún docente vigente dos veces, un solo
    /// titular vigente. Los tramos ya cerrados no compiten entre sí, porque un docente puede haber
    /// entrado, salido y vuelto, y dos personas distintas pueden haber sido titulares en épocas
    /// distintas: que los tramos cerrados no se pisen entre sí exige ordenar períodos, y eso lo
    /// valida el application service, que sí ve los <c>AcademicTerm</c>.
    /// </summary>
    private static Result<List<ChairMember>> BuildMemberSet(
        IEnumerable<(TeacherId TeacherId, ChairMemberRole Role, AcademicTermId Since, AcademicTermId? Until)> members)
    {
        var result = new List<ChairMember>();
        foreach (var (teacherId, role, since, until) in members)
        {
            var isCurrent = until is null;
            if (isCurrent && result.Any(m => m.IsCurrent && m.TeacherId == teacherId))
            {
                return ChairErrors.TeacherAlreadyInChair;
            }
            if (isCurrent
                && role == ChairMemberRole.Lead
                && result.Any(m => m.IsCurrent && m.Role == ChairMemberRole.Lead))
            {
                return ChairErrors.LeadAlreadyAssigned;
            }
            result.Add(new ChairMember(teacherId, role, since, until));
        }
        return result;
    }

    private static Result ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return ChairErrors.NameRequired;
        }
        if (name.Trim().Length > MaxNameLength)
        {
            return ChairErrors.NameTooLong;
        }
        return Result.Success();
    }
}
