namespace Planb.Identity.Domain.Users;

/// <summary>
/// Child entity de <see cref="User"/> que asocia al user con un CareerPlan + año de ingreso.
/// Es una "capability" del member (ADR-0008): tener StudentProfile activo desbloquea cargar
/// historial, simular cuatrimestre, reseñar materias.
///
/// Por qué child entity (no aggregate independiente):
/// <list type="bullet">
///   <item>Lifecycle ligado al User: si el User se disable o expire, sus StudentProfiles
///         deben afectarse en sintonía sin coordinación cross-aggregate.</item>
///   <item>Invariantes compartidas: solo un user con role=Member y email verificado puede
///         tener profiles. Ese check vive en <see cref="User.AddStudentProfile"/>, no
///         distribuido.</item>
///   <item>El UNIQUE(user_id, career_id) es local al user, no a una colección global.</item>
/// </list>
///
/// References cross-BC (<see cref="CareerPlanId"/>, <see cref="CareerId"/>) son UUIDs sin FK
/// Postgres (ADR-0017). La validación de que apunten a algo real vive en el handler que llama
/// <c>IAcademicQueryService.GetCareerPlanByIdAsync</c> antes de invocar este método.
///
/// El <see cref="CareerId"/> se denormaliza acá (a pesar de que se podría derivar via lookup
/// del plan) para que el constraint UNIQUE(user_id, career_id) en DB sea evaluable sin JOIN
/// cross-schema. Ese trade-off es aceptable: si el plan migrara a otra carrera (caso degenerado
/// que no debería pasar) el dato queda stale, y se resuelve con un domain event capturado por
/// este aggregate cuando Academic exponga edits.
/// </summary>
public sealed class StudentProfile
{
    public StudentProfileId Id { get; private set; }
    public Guid CareerPlanId { get; private set; }
    public Guid CareerId { get; private set; }
    public int EnrollmentYear { get; private set; }
    public StudentProfileStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private StudentProfile() { }

    internal StudentProfile(
        StudentProfileId id,
        Guid careerPlanId,
        Guid careerId,
        int enrollmentYear,
        DateTimeOffset createdAt)
    {
        Id = id;
        CareerPlanId = careerPlanId;
        CareerId = careerId;
        EnrollmentYear = enrollmentYear;
        Status = StudentProfileStatus.Active;
        CreatedAt = createdAt;
    }

    public bool IsActive => Status == StudentProfileStatus.Active;
}
