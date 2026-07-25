using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Commissions;

/// <summary>
/// Aggregate root del bounded context Academic (US-065). Oferta concreta de una Subject en un
/// AcademicTerm: la comisión que un alumno cursa. El <c>EnrollmentRecord</c> la referencia por
/// <see cref="CommissionId"/> y la <c>Review</c> ancla su <c>docente_reseñado_id</c> a uno de los
/// <see cref="Teachers"/> de la comisión del enrollment (cross-BC, sin FK; ADR-0017).
///
/// <para>
/// Invariantes internos del aggregate (validados acá): nombre no vacío, capacity &gt; 0 cuando
/// aplica, a lo sumo un docente con rol <see cref="CommissionTeacherRole.Lead"/>, y no se asigna
/// el mismo docente dos veces. La coherencia cross-aggregate (misma universidad de Subject + Term +
/// Teacher, <c>Subject.term_kind == Term.kind</c>, UNIQUE(subject, term, name)) la valida el app
/// service que cree comisiones, no el aggregate (no tiene acceso a esas entidades).
/// </para>
/// </summary>
public sealed class Commission : Entity<CommissionId>, IAggregateRoot
{
    public const int MaxNameLength = 100;
    public const int MaxNotesLength = 2000;

    public Guid SubjectId { get; private set; }
    public Guid TermId { get; private set; }
    public string Name { get; private set; } = null!;
    public CommissionModality Modality { get; private set; }
    public int? Capacity { get; private set; }
    public string? Notes { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<CommissionTeacher> _teachers = [];

    /// <summary>Docentes asignados, cargados eager con el aggregate (OwnsMany + AutoInclude).</summary>
    public IReadOnlyList<CommissionTeacher> Teachers => _teachers;

    private readonly List<CommissionSchedule> _schedules = [];

    /// <summary>Franjas horarias de cursada, cargadas eager con el aggregate (OwnsMany + AutoInclude).</summary>
    public IReadOnlyList<CommissionSchedule> Schedules => _schedules;

    private Commission() { }

    /// <summary>
    /// Crea una comisión sin docentes (se asignan después con <see cref="AssignTeacher"/>). El name
    /// se trimea (es un label de display, no se lowercasea como los nombres de docente).
    /// </summary>
    public static Result<Commission> Create(
        Guid subjectId,
        Guid termId,
        string name,
        CommissionModality modality,
        int? capacity,
        string? notes,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = Validate(name, capacity, notes);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        var now = clock.UtcNow;
        return new Commission
        {
            Id = CommissionId.New(),
            SubjectId = subjectId,
            TermId = termId,
            Name = name.Trim(),
            Modality = modality,
            Capacity = capacity,
            Notes = TrimToNull(notes),
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado + docentes + horarios, para seeder y EF rehydration.
    /// Saltea validaciones (el caller se hace responsable de datos coherentes). Recibe docentes y
    /// franjas como pares/tuplas crudas porque <see cref="CommissionTeacher"/> y
    /// <see cref="CommissionSchedule"/> tienen ctor internal al dominio.
    /// </summary>
    public static Commission Hydrate(
        CommissionId id,
        Guid subjectId,
        Guid termId,
        string name,
        CommissionModality modality,
        int? capacity,
        string? notes,
        IEnumerable<(TeacherId TeacherId, CommissionTeacherRole Role)> teachers,
        IEnumerable<(DayOfWeek Day, TimeOnly Start, TimeOnly End)> schedules,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var commission = new Commission
        {
            Id = id,
            SubjectId = subjectId,
            TermId = termId,
            Name = name,
            Modality = modality,
            Capacity = capacity,
            Notes = notes,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

        foreach (var (teacherId, role) in teachers)
        {
            commission._teachers.Add(new CommissionTeacher(teacherId, role));
        }

        foreach (var (day, start, end) in schedules)
        {
            commission._schedules.Add(new CommissionSchedule(day, start, end));
        }

        return commission;
    }

    /// <summary>Modifica metadata (name / modality / capacity / notes). No toca los docentes.</summary>
    public Result Update(
        string name,
        CommissionModality modality,
        int? capacity,
        string? notes,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = Validate(name, capacity, notes);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        Name = name.Trim();
        Modality = modality;
        Capacity = capacity;
        Notes = TrimToNull(notes);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Asigna un docente con su rol. Invariantes: no duplicar docente, y a lo sumo un titular.
    /// </summary>
    public Result AssignTeacher(TeacherId teacherId, CommissionTeacherRole role, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (_teachers.Any(t => t.TeacherId == teacherId))
        {
            return CommissionErrors.TeacherAlreadyAssigned;
        }

        if (role == CommissionTeacherRole.Lead
            && _teachers.Any(t => t.Role == CommissionTeacherRole.Lead))
        {
            return CommissionErrors.TitularAlreadyAssigned;
        }

        _teachers.Add(new CommissionTeacher(teacherId, role));
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Remueve un docente de la comisión. Error si no estaba asignado.</summary>
    public Result UnassignTeacher(TeacherId teacherId, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var existing = _teachers.FirstOrDefault(t => t.TeacherId == teacherId);
        if (existing is null)
        {
            return CommissionErrors.TeacherNotAssigned;
        }

        _teachers.Remove(existing);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Reemplaza todas las franjas horarias por el conjunto dado (US-093). Valida el set completo
    /// antes de mutar: cada bloque termina después de empezar, y ningún par se solapa (una comisión
    /// no se pisa a sí misma). Un set vacío deja la comisión sin horario cargado, que es válido:
    /// una virtual asincrónica, o una oferta cuyos horarios todavía no se cargaron. Es el método que
    /// usa la grilla del backoffice, que manda la grilla entera y no un diff.
    /// </summary>
    public Result ReplaceSchedule(
        IEnumerable<(DayOfWeek Day, TimeOnly Start, TimeOnly End)> blocks,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(blocks);
        ArgumentNullException.ThrowIfNull(clock);

        var candidates = new List<CommissionSchedule>();
        foreach (var (day, start, end) in blocks)
        {
            if (end <= start)
            {
                return CommissionErrors.ScheduleInvalidRange;
            }

            var slot = new CommissionSchedule(day, start, end);
            if (candidates.Any(existing => existing.OverlapsWith(slot)))
            {
                return CommissionErrors.ScheduleOverlap;
            }

            candidates.Add(slot);
        }

        _schedules.Clear();
        _schedules.AddRange(candidates);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    private static Result Validate(string name, int? capacity, string? notes)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return CommissionErrors.NameRequired;
        }
        if (name.Trim().Length > MaxNameLength)
        {
            return CommissionErrors.NameTooLong;
        }
        if (capacity is not null && capacity.Value <= 0)
        {
            return CommissionErrors.CapacityNotPositive;
        }
        if (notes is not null && notes.Trim().Length > MaxNotesLength)
        {
            return CommissionErrors.NotesTooLong;
        }
        return Result.Success();
    }

    private static string? TrimToNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
