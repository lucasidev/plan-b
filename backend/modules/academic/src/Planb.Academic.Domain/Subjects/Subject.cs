using Planb.Academic.Domain.CareerPlans;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Subjects;

/// <summary>
/// Materia de un plan de estudios. Aggregate independiente: pertenece lógicamente a un
/// <see cref="CareerPlan"/> via <see cref="CareerPlanId"/> pero no es child entity (los planes
/// pueden tener cientos de materias y no queremos cargarlas en bloque al hidratar el plan).
///
/// <para>
/// Cross-BC references desde Enrollments (US-013), Reviews y Planning son siempre via
/// <see cref="SubjectId"/> sin FK Postgres ni nav EF (ADR-0017). La validación de
/// "este subject pertenece al plan X" vive en <c>IAcademicQueryService.IsSubjectInPlan</c>.
/// </para>
///
/// <para>
/// El invariante <see cref="TermKind"/>/<see cref="TermInYear"/> es app-level: si la materia es
/// <see cref="Planb.Academic.Domain.TermKind.Anual"/>, <c>TermInYear</c> debe ser null. Para
/// cualquier otra cadencia, <c>TermInYear</c> es obligatorio (1-N según la cadencia).
/// </para>
///
/// <para>
/// Las correlativas (<see cref="Prerequisites.Prerequisite"/>) NO cuelgan de acá: son un aggregate
/// aparte, porque validar aciclicidad necesita el grafo del plan entero y no las aristas de una
/// materia sola (ADR-0003).
/// </para>
/// </summary>
public sealed class Subject : Entity<SubjectId>, IAggregateRoot
{
    public CareerPlanId CareerPlanId { get; private set; }
    public string Code { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public int YearInPlan { get; private set; }
    public int? TermInYear { get; private set; }
    public TermKind TermKind { get; private set; }
    public int WeeklyHours { get; private set; }
    public int TotalHours { get; private set; }
    public string? Description { get; private set; }
    /// <summary>
    /// True cuando la materia la creó el backoffice. False cuando se materializó al confirmar
    /// un <c>CareerPlanImport</c> de un alumno (US-088). Heredada del <c>CareerPlan</c> padre
    /// al crearse: si el plan es no oficial, todas sus materias también lo son.
    /// </summary>
    public bool IsOfficial { get; private set; }

    /// <summary>
    /// Soft delete (US-062). No hay hard delete: EnrollmentRecord, Review y Commission referencian
    /// la materia por id sin FK cross-schema, así que borrarla de verdad dejaría filas colgadas
    /// (mismo criterio que <c>Career.IsActive</c>).
    /// </summary>
    public bool IsActive { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Subject() { }

    /// <summary>
    /// Crea una nueva materia con validaciones del data-model. Los rangos numéricos son límites
    /// defensivos contra inputs degenerados; el constraint real (UNIQUE(career_plan_id, code))
    /// lo enforca Postgres al insertar.
    /// </summary>
    public static Result<Subject> Create(
        CareerPlanId careerPlanId,
        string code,
        string name,
        int yearInPlan,
        int? termInYear,
        TermKind termKind,
        int weeklyHours,
        int totalHours,
        string? description,
        IDateTimeProvider clock,
        bool isOfficial = true)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = Validate(code, name, yearInPlan, termInYear, termKind, weeklyHours, totalHours);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        var now = clock.UtcNow;
        return new Subject
        {
            Id = SubjectId.New(),
            CareerPlanId = careerPlanId,
            Code = code.Trim(),
            Name = name.Trim(),
            YearInPlan = yearInPlan,
            TermInYear = termInYear,
            TermKind = termKind,
            WeeklyHours = weeklyHours,
            TotalHours = totalHours,
            Description = NormalizeOptional(description),
            IsOfficial = isOfficial,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Edición del catálogo (US-062, admin). Replace del form completo, mismas reglas que
    /// <see cref="Create"/>. El plan NO se puede mover: cambiar de plan rompería las correlativas
    /// ya cargadas (que asumen mismo plan) y los EnrollmentRecord que apuntan a esta materia; para
    /// eso está la migración asistida de plan (US-084).
    /// </summary>
    public Result Update(
        string code,
        string name,
        int yearInPlan,
        int? termInYear,
        TermKind termKind,
        int weeklyHours,
        int totalHours,
        string? description,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = Validate(code, name, yearInPlan, termInYear, termKind, weeklyHours, totalHours);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        Code = code.Trim();
        Name = name.Trim();
        YearInPlan = yearInPlan;
        TermInYear = termInYear;
        TermKind = termKind;
        WeeklyHours = weeklyHours;
        TotalHours = totalHours;
        Description = NormalizeOptional(description);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Promueve materia no-oficial a oficial. Idempotente. Lo invoca el flujo de backoffice
    /// cuando un admin valida en bloque las materias de un plan crowdsourced.
    /// </summary>
    public void MarkOfficial()
    {
        if (!IsOfficial) IsOfficial = true;
    }

    /// <summary>
    /// Soft delete (US-062). El chequeo de "otras materias la tienen como correlativa" NO va acá:
    /// necesita el grafo del plan, así que lo hace el handler antes de llamar (409 has_dependents).
    /// </summary>
    public Result Deactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsActive)
        {
            return SubjectErrors.AlreadyInactive;
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
            return SubjectErrors.AlreadyActive;
        }

        IsActive = true;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado para seeder + eventual EF rehydration. Saltea las
    /// validaciones; el caller se hace responsable de pasar datos coherentes (mismo contract
    /// que <see cref="University.Hydrate"/>).
    /// </summary>
    public static Subject Hydrate(
        SubjectId id,
        CareerPlanId careerPlanId,
        string code,
        string name,
        int yearInPlan,
        int? termInYear,
        TermKind termKind,
        int weeklyHours,
        int totalHours,
        string? description,
        bool isOfficial,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            CareerPlanId = careerPlanId,
            Code = code,
            Name = name,
            YearInPlan = yearInPlan,
            TermInYear = termInYear,
            TermKind = termKind,
            WeeklyHours = weeklyHours,
            TotalHours = totalHours,
            Description = description,
            IsOfficial = isOfficial,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

    /// <summary>
    /// Reglas compartidas por <see cref="Create"/> y <see cref="Update"/>. Los rangos son límites
    /// defensivos, no reglas académicas finas.
    /// </summary>
    private static Result Validate(
        string code,
        string name,
        int yearInPlan,
        int? termInYear,
        TermKind termKind,
        int weeklyHours,
        int totalHours)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return SubjectErrors.CodeRequired;
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return SubjectErrors.NameRequired;
        }

        // 10 es un techo holgado: pocas carreras IT pasan de 6 años. Si alguna ingeniería con plan
        // viejo lo rompe, subir el techo.
        if (yearInPlan is < 1 or > 10)
        {
            return SubjectErrors.YearInPlanOutOfRange;
        }

        // Invariante anual vs no-anual: el data-model lo declara como CHECK. Lo enforcamos acá
        // para que el Result<> tenga el motivo claro.
        if (termKind == TermKind.Anual)
        {
            if (termInYear is not null)
            {
                return SubjectErrors.TermInYearInconsistentWithKind;
            }
        }
        else
        {
            if (termInYear is null)
            {
                return SubjectErrors.TermInYearInconsistentWithKind;
            }

            // 6 cubre Bimestral (hasta 5-6 bimestres anuales). Cuatrimestral/Semestral siempre
            // 1 o 2.
            if (termInYear is < 1 or > 6)
            {
                return SubjectErrors.TermInYearOutOfRange;
            }
        }

        // 0 es válido y no es un caso raro: hay materias con carga total pero sin carga semanal
        // fija (Proyecto Final de la TUDCS son 0 hs/sem y 350 totales, y lo mismo pasa con
        // prácticas profesionales y tesis). Rechazarlo dejaba planes reales fuera del modelo.
        // El techo de 40 sigue: es una jornada laboral completa, más que eso es input degenerado.
        if (weeklyHours is < 0 or > 40)
        {
            return SubjectErrors.WeeklyHoursOutOfRange;
        }

        // La carga total sí tiene que ser positiva (una materia sin horas no existe) y nunca menor
        // que la semanal.
        if (totalHours < weeklyHours || totalHours <= 0)
        {
            return SubjectErrors.TotalHoursOutOfRange;
        }

        return Result.Success();
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
