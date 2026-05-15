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
    public DateTimeOffset CreatedAt { get; private set; }

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
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

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

        // 40hs semanales = jornada laboral completa. Más es input degenerado.
        if (weeklyHours is < 1 or > 40)
        {
            return SubjectErrors.WeeklyHoursOutOfRange;
        }

        // Total al menos lo que ya cubre una semana (la materia dura como mínimo 1 semana).
        if (totalHours < weeklyHours || totalHours <= 0)
        {
            return SubjectErrors.TotalHoursOutOfRange;
        }

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
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            CreatedAt = clock.UtcNow,
        };
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
        DateTimeOffset createdAt) =>
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
            CreatedAt = createdAt,
        };
}
