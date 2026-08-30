using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Commissions;

/// <summary>
/// Aggregate root del bounded context Academic (US-065). Oferta concreta de una Subject en un
/// AcademicTerm: la comisión que un alumno cursa. La <c>Review</c> ancla su
/// <c>docente_reseñado_id</c> a uno de los <see cref="Teachers"/> de la comisión del enrollment
/// (cross-BC, sin FK; ADR-0017).
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

    /// <summary>
    /// Soft delete (US-093). Review ancla a la comisión por id sin FK
    /// cross-schema (ADR-0017), así que no hay hard delete: mismo criterio que Subject.IsActive /
    /// Teacher.IsActive.
    /// </summary>
    public bool IsActive { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<CommissionTeacher> _teachers = [];

    /// <summary>Docentes asignados, cargados eager con el aggregate (OwnsMany + AutoInclude).</summary>
    public IReadOnlyList<CommissionTeacher> Teachers => _teachers;

    /// <summary>
    /// Franjas horarias de cursada. A diferencia de <see cref="Teachers"/>, no es una tabla hija:
    /// se persiste como documento embebido en una columna <c>jsonb</c> de la comisión (ADR-0053).
    ///
    /// <para>
    /// Por eso la colección se reemplaza entera en vez de mutarse item por item, y por eso la
    /// propiedad tiene setter privado en lugar de exponer un backing field: es la forma que refleja
    /// cómo se lee y cómo se escribe. Ningún read filtra ni joinea por franja; los docentes sí se
    /// joinean contra <c>academic.teachers</c> para el nombre, y por eso ellos siguen siendo tabla.
    /// </para>
    /// </summary>
    public IReadOnlyList<CommissionSchedule> Schedules { get; private set; } = [];

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
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado + docentes + horarios. Su único caller es el seeder: EF no
    /// pasa por acá (materializa por ctor privado y setters). Recibe docentes y franjas como
    /// pares/tuplas crudas porque <see cref="CommissionTeacher"/> y <see cref="CommissionSchedule"/>
    /// tienen ctor internal al dominio.
    /// </summary>
    /// <remarks>
    /// <para>
    /// A diferencia del resto de los <c>Hydrate</c> del proyecto, este SÍ valida docentes y franjas,
    /// y tira si el dato no es coherente. La razón es que sus invariantes dejaron de tener red en la
    /// base: las franjas pasaron a documento embebido (ADR-0053), y un CHECK de Postgres no puede
    /// recorrer un array jsonb sin una función IMMUTABLE aparte.
    /// </para>
    /// <para>
    /// Cerrar el bypass es mejor que ponerle red igual: el manifiesto del seeder entra sin que nadie
    /// lo revise, y un <c>Slot(Monday, 22, 18)</c> mal tipeado se persistía sin ruido para después
    /// romper el detector de choques, que compara <c>start &lt; end</c> y nunca marca conflicto
    /// contra un rango invertido. Tira en vez de devolver Result porque no es una falla de negocio:
    /// es un manifiesto roto, y el seeder ya falla ruidoso.
    /// </para>
    /// </remarks>
    /// <exception cref="ArgumentException">
    /// Si los docentes o las franjas violan los invariantes del aggregate.
    /// </exception>
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
        bool isActive,
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
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

        var teacherSet = BuildTeacherSet(teachers);
        if (teacherSet.IsFailure)
        {
            throw new ArgumentException(
                $"Commission '{name}' ({id.Value}) has invalid teachers: {teacherSet.Error.Code}.",
                nameof(teachers));
        }

        var scheduleSet = BuildScheduleSet(schedules);
        if (scheduleSet.IsFailure)
        {
            throw new ArgumentException(
                $"Commission '{name}' ({id.Value}) has an invalid schedule: {scheduleSet.Error.Code}.",
                nameof(schedules));
        }

        commission._teachers.AddRange(teacherSet.Value);
        commission.Schedules = scheduleSet.Value;

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

        var built = BuildScheduleSet(blocks);
        if (built.IsFailure)
        {
            return built.Error;
        }

        Schedules = built.Value;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Reconfiguración atómica de la comisión (US-093): metadata + docentes + horarios en una sola
    /// operación. Valida los TRES sets antes de mutar nada, y solo aplica si todos pasan. Es la
    /// operación del PUT del backoffice. Sin esta atomicidad, un fallo tardío (doble titular, horario
    /// solapado) dejaría la metadata y los docentes ya mutados: el middleware de transacción de
    /// Wolverine commitea igual, porque un <c>Result.Failure</c> no es una excepción y no dispara el
    /// rollback. Por eso el handler no puede mutar en pasos; muta todo o nada, acá adentro.
    /// </summary>
    public Result Reconfigure(
        string name,
        CommissionModality modality,
        int? capacity,
        string? notes,
        IEnumerable<(TeacherId TeacherId, CommissionTeacherRole Role)> teachers,
        IEnumerable<(DayOfWeek Day, TimeOnly Start, TimeOnly End)> schedule,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(teachers);
        ArgumentNullException.ThrowIfNull(schedule);
        ArgumentNullException.ThrowIfNull(clock);

        var metadata = Validate(name, capacity, notes);
        if (metadata.IsFailure)
        {
            return metadata.Error;
        }

        var teacherSet = BuildTeacherSet(teachers);
        if (teacherSet.IsFailure)
        {
            return teacherSet.Error;
        }

        var scheduleSet = BuildScheduleSet(schedule);
        if (scheduleSet.IsFailure)
        {
            return scheduleSet.Error;
        }

        // Los tres sets validados: recién ahora mutamos.
        Name = name.Trim();
        Modality = modality;
        Capacity = capacity;
        Notes = TrimToNull(notes);
        _teachers.Clear();
        _teachers.AddRange(teacherSet.Value);
        Schedules = scheduleSet.Value;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Arma el set de docentes validando (sin duplicados, a lo sumo un titular) sin mutar.</summary>
    private static Result<List<CommissionTeacher>> BuildTeacherSet(
        IEnumerable<(TeacherId TeacherId, CommissionTeacherRole Role)> teachers)
    {
        var result = new List<CommissionTeacher>();
        foreach (var (teacherId, role) in teachers)
        {
            if (result.Any(t => t.TeacherId == teacherId))
            {
                return CommissionErrors.TeacherAlreadyAssigned;
            }
            if (role == CommissionTeacherRole.Lead
                && result.Any(t => t.Role == CommissionTeacherRole.Lead))
            {
                return CommissionErrors.TitularAlreadyAssigned;
            }
            result.Add(new CommissionTeacher(teacherId, role));
        }
        return result;
    }

    /// <summary>Arma el set de franjas validando (rango válido, sin solape) sin mutar.</summary>
    private static Result<List<CommissionSchedule>> BuildScheduleSet(
        IEnumerable<(DayOfWeek Day, TimeOnly Start, TimeOnly End)> blocks)
    {
        var result = new List<CommissionSchedule>();
        foreach (var (day, start, end) in blocks)
        {
            if (end <= start)
            {
                return CommissionErrors.ScheduleInvalidRange;
            }
            var slot = new CommissionSchedule(day, start, end);
            if (result.Any(existing => existing.OverlapsWith(slot)))
            {
                return CommissionErrors.ScheduleOverlap;
            }
            result.Add(slot);
        }
        return result;
    }

    /// <summary>Soft delete (US-093). Idempotencia explícita: re-desactivar devuelve error.</summary>
    public Result Deactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsActive)
        {
            return CommissionErrors.AlreadyInactive;
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
            return CommissionErrors.AlreadyActive;
        }

        IsActive = true;
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
