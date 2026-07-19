using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.AcademicTerms;

/// <summary>
/// Período lectivo concreto de una universidad. La cadencia (<see cref="Kind"/>) la define la
/// uni y puede convivir con materias de cadencias distintas del mismo plan (ej. una uni con
/// terms cuatrimestrales tiene materias cuatrimestrales y materias anuales).
///
/// <para>
/// Cross-BC: <see cref="AcademicTermId"/> se usa en EnrollmentRecord (US-013), Commission y
/// SimulationDraft. Como con Subject, las refs son UUIDs sin FK ni nav cross-schema; la
/// validación de existencia vive en <c>IAcademicQueryService</c> cuando algún caller la
/// necesite (hoy solo se valida via listing a la hora de mostrar dropdowns).
/// </para>
/// </summary>
public sealed class AcademicTerm : Entity<AcademicTermId>, IAggregateRoot
{
    public UniversityId UniversityId { get; private set; }
    public int Year { get; private set; }
    public int Number { get; private set; }
    public TermKind Kind { get; private set; }
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }
    public DateTimeOffset EnrollmentOpens { get; private set; }
    public DateTimeOffset EnrollmentCloses { get; private set; }
    public string Label { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }

    private AcademicTerm() { }

    /// <summary>
    /// Crea un período lectivo con sus ventanas. <paramref name="label"/> queda calculado por el
    /// caller (típicamente el seeder o un futuro endpoint admin) porque depende de la convención
    /// de cada universidad (ej. "2026·1c" para UNSTA, "2026-S1" para SIGLO 21).
    /// </summary>
    public static Result<AcademicTerm> Create(
        UniversityId universityId,
        int year,
        int number,
        TermKind kind,
        DateOnly startDate,
        DateOnly endDate,
        DateTimeOffset enrollmentOpens,
        DateTimeOffset enrollmentCloses,
        string label,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = Validate(
            year, number, kind, startDate, endDate, enrollmentOpens, enrollmentCloses, label, clock);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        return new AcademicTerm
        {
            Id = AcademicTermId.New(),
            UniversityId = universityId,
            Year = year,
            Number = number,
            Kind = kind,
            StartDate = startDate,
            EndDate = endDate,
            EnrollmentOpens = enrollmentOpens,
            EnrollmentCloses = enrollmentCloses,
            Label = label.Trim(),
            CreatedAt = clock.UtcNow,
        };
    }

    /// <summary>
    /// Edición de un período lectivo (US-064, admin). Replace del form completo: re-valida todos
    /// los campos con las mismas reglas que <see cref="Create"/> (incluido el año contra el reloj
    /// actual) y re-normaliza el label. No toca <see cref="UniversityId"/>: un período no cambia
    /// de universidad, coherente con que la ruta del PATCH admin no lleva ese segmento.
    /// </summary>
    public Result Update(
        int year,
        int number,
        TermKind kind,
        DateOnly startDate,
        DateOnly endDate,
        DateTimeOffset enrollmentOpens,
        DateTimeOffset enrollmentCloses,
        string label,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = Validate(
            year, number, kind, startDate, endDate, enrollmentOpens, enrollmentCloses, label, clock);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        Year = year;
        Number = number;
        Kind = kind;
        StartDate = startDate;
        EndDate = endDate;
        EnrollmentOpens = enrollmentOpens;
        EnrollmentCloses = enrollmentCloses;
        Label = label.Trim();
        return Result.Success();
    }

    /// <summary>
    /// Computa el label human-readable de un período a partir de su cadencia (US-064, admin): el
    /// admin no lo tipea, lo arma el dominio para que nunca quede desalineado del período real
    /// (year/number/kind). El seeder sigue pasando labels manuales con su propia convención
    /// (ej. "2026·1c") vía <see cref="Create"/>/<see cref="Hydrate"/>, que no cambiaron de firma.
    /// </summary>
    public static string ComputeLabel(int year, int number, TermKind kind) => kind switch
    {
        TermKind.Anual => $"{year}",
        TermKind.Cuatrimestral => $"{year}-C{number}",
        TermKind.Semestral => $"{year}-S{number}",
        TermKind.Bimestral => $"{year}-B{number}",
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown TermKind."),
    };

    private static Result Validate(
        int year,
        int number,
        TermKind kind,
        DateOnly startDate,
        DateOnly endDate,
        DateTimeOffset enrollmentOpens,
        DateTimeOffset enrollmentCloses,
        string label,
        IDateTimeProvider clock)
    {
        // No floor por año: hay terms históricos legítimos para EnrollmentRecord de
        // alumnos viejos. Sí frenamos años negativos/cero y > 2 décadas en el futuro.
        var currentYear = clock.UtcNow.Year;
        if (year <= 0 || year > currentYear + 20)
        {
            return AcademicTermErrors.YearOutOfRange;
        }

        if (number < 1 || number > 6)
        {
            return AcademicTermErrors.NumberOutOfRange;
        }

        // Anual implica número 1 (no hay "anual 2"). Las otras cadencias permiten más de 1
        // (ej. bimestre 3 del año, cuatrimestre 2).
        if (kind == TermKind.Anual && number != 1)
        {
            return AcademicTermErrors.NumberInconsistentWithKind;
        }

        if (endDate <= startDate)
        {
            return AcademicTermErrors.DatesInverted;
        }

        if (enrollmentCloses <= enrollmentOpens)
        {
            return AcademicTermErrors.EnrollmentWindowInverted;
        }

        if (string.IsNullOrWhiteSpace(label))
        {
            return AcademicTermErrors.LabelRequired;
        }

        return Result.Success();
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado para seeder + EF rehydration. Saltea validaciones.
    /// </summary>
    public static AcademicTerm Hydrate(
        AcademicTermId id,
        UniversityId universityId,
        int year,
        int number,
        TermKind kind,
        DateOnly startDate,
        DateOnly endDate,
        DateTimeOffset enrollmentOpens,
        DateTimeOffset enrollmentCloses,
        string label,
        DateTimeOffset createdAt) =>
        new()
        {
            Id = id,
            UniversityId = universityId,
            Year = year,
            Number = number,
            Kind = kind,
            StartDate = startDate,
            EndDate = endDate,
            EnrollmentOpens = enrollmentOpens,
            EnrollmentCloses = enrollmentCloses,
            Label = label,
            CreatedAt = createdAt,
        };
}
