namespace Planb.Academic.Domain.OfficialFacts;

/// <summary>
/// El vocabulario curado de campos (ADR-0090), en inglés, como constantes en código: agregar un
/// campo nuevo es una constante nueva y una regla de render, nunca una migración (la columna es un
/// <c>varchar</c> plano). Los catorce que arrancan salen del ADR y del relevamiento de las cuatro
/// carreras sembradas.
/// </summary>
public static class OfficialFactField
{
    /// <summary>Dura en el papel: duración del plan vigente, en años, según la resolución que reconoce el título.</summary>
    public const string PaperDuration = "paper_duration";

    /// <summary>Dura en la realidad: duración media real, por cohorte, de esa oferta. No publicado por ninguna fuente hoy.</summary>
    public const string RealDuration = "real_duration";

    /// <summary>Egreso por cohorte: de cada cien que entraron el mismo año, cuántos se recibieron.</summary>
    public const string CohortGraduation = "cohort_graduation";

    /// <summary>Plan vigente: año, materias y resolución que lo reconoce.</summary>
    public const string CurrentPlan = "current_plan";

    /// <summary>Acreditación CONEAU (grado): resolución y vigencia. No aplica al pregrado.</summary>
    public const string Accreditation = "accreditation";

    /// <summary>Validez nacional del título (pregrado): la resolución ministerial que la reconoce cuando CONEAU no acredita.</summary>
    public const string NationalValidity = "national_validity";

    /// <summary>Régimen de ingreso: irrestricto, curso, examen, cupo, y si tiene arancel.</summary>
    public const string AdmissionRegime = "admission_regime";

    /// <summary>Si las actas o resoluciones del órgano de gobierno se publican, dónde y con qué cadencia.</summary>
    public const string MinutesPublished = "minutes_published";

    /// <summary>Si la institución publica su presupuesto y la ejecución, y con qué detalle.</summary>
    public const string BudgetPublished = "budget_published";

    /// <summary>Si publica la nómina docente y con qué detalle (cargo, dedicación, condición regular o interina).</summary>
    public const string StaffRosterPublished = "staff_roster_published";

    /// <summary>Proporción de cargos interinos sobre el total, cuando la nómina lo permite calcular.</summary>
    public const string InterimShare = "interim_share";

    /// <summary>La evaluación institucional de CONEAU y las carreras de grado acreditadas del plantel.</summary>
    public const string InstitutionalEvaluation = "institutional_evaluation";

    /// <summary>Identidad de la institución: pública o privada, provincia, cantidad de facultades y de estudiantes.</summary>
    public const string InstitutionType = "institution_type";

    /// <summary>La unidad académica de la que cuelga la carrera.</summary>
    public const string AcademicUnit = "academic_unit";

    /// <summary>
    /// Los códigos que arrancan (ADR-0090). Abierto: sumar un campo es agregar una constante acá y
    /// no pide migración (la columna ya acepta cualquier <c>varchar</c>).
    /// </summary>
    public static readonly IReadOnlyCollection<string> Known =
    [
        PaperDuration,
        RealDuration,
        CohortGraduation,
        CurrentPlan,
        Accreditation,
        NationalValidity,
        AdmissionRegime,
        MinutesPublished,
        BudgetPublished,
        StaffRosterPublished,
        InterimShare,
        InstitutionalEvaluation,
        InstitutionType,
        AcademicUnit,
    ];

    /// <summary>True si <paramref name="field"/> es uno de los códigos curados (comparación exacta, case-sensitive: el contrato son los literales en inglés de acá).</summary>
    public static bool IsKnown(string? field) => field is not null && Known.Contains(field);
}
