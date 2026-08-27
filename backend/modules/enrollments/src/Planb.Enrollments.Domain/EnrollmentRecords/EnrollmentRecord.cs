using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Domain.EnrollmentRecords;

/// <summary>
/// Cursada concreta de un alumno (StudentProfile) sobre una materia (Subject) en un cuatrimestre
/// (AcademicTerm). Es el aggregate root del módulo Enrollments: cada acto académico del alumno
/// (cursar, regularizar, aprobar, reprobar, abandonar, dar equivalencia) se representa con un
/// row separado.
///
/// <para>
/// Cross-BC references son UUIDs sin FK Postgres ni nav cross-schema (ADR-0017):
/// <list type="bullet">
///   <item><see cref="StudentProfileId"/> → identity.student_profiles.id</item>
///   <item><see cref="SubjectId"/> → academic.subjects.id</item>
///   <item><see cref="CommissionId"/> → academic.commissions.id (cuando exista, hoy nullable)</item>
///   <item><see cref="TermId"/> → academic.academic_terms.id</item>
/// </list>
/// La validación de existencia + pertenencia (subject pertenece al plan del student) vive en el
/// handler del Application layer usando <c>IAcademicQueryService.IsSubjectInPlanAsync</c> y
/// <c>IIdentityQueryService.GetStudentProfileForUserAsync</c>.
/// </para>
///
/// <para>
/// Invariantes del data-model (CHECKs Postgres + validación acá en <see cref="Create"/>):
/// <list type="bullet">
///   <item>Status=Aprobada → grade NOT NULL AND approval_method NOT NULL</item>
///   <item>Status=Regular → grade NOT NULL AND approval_method NULL</item>
///   <item>Status ∈ {Cursando, Reprobada, Abandonada} → grade NULL AND approval_method NULL</item>
///   <item>ApprovalMethod=Equivalencia → commission_id NULL AND term_id NULL</item>
///   <item>ApprovalMethod=FinalLibre → commission_id NULL AND term_id NOT NULL</item>
///   <item>ApprovalMethod ∈ {Cursada, Promocion, Final} → term_id requerido. La comisión NO: el
///         historial académico que sube el alumno no dice en cuál cursó, y exigirla hacía imposible
///         el import de US-014 (ver <c>EnrollmentRecordErrors.CursadaApprovalRequiresTerm</c>).</item>
///   <item>Status=Cursando → term_id requerido (no se cursa "en algún momento")</item>
/// </list>
/// </para>
/// </summary>
public sealed class EnrollmentRecord : Entity<EnrollmentRecordId>, IAggregateRoot
{
    public Guid StudentProfileId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid? CommissionId { get; private set; }
    public Guid? TermId { get; private set; }
    public EnrollmentStatus Status { get; private set; }
    public ApprovalMethod? ApprovalMethod { get; private set; }
    public Grade? Grade { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private EnrollmentRecord() { }

    /// <summary>
    /// Crea un nuevo enrollment record con todas las invariantes del data-model validadas.
    /// <paramref name="grade"/> puede ser <c>decimal?</c>; si es no-null se construye el VO
    /// (que enforca rango 0..10). Los CHECKs del aggregate se evalúan en el orden: status vs
    /// grade/method, method vs commission/term, status=Cursando vs term.
    /// </summary>
    public static Result<EnrollmentRecord> Create(
        Guid studentProfileId,
        Guid subjectId,
        Guid? commissionId,
        Guid? termId,
        EnrollmentStatus status,
        ApprovalMethod? approvalMethod,
        decimal? grade,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = ValidateInvariants(commissionId, termId, status, approvalMethod, grade);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        var now = clock.UtcNow;
        return new EnrollmentRecord
        {
            Id = EnrollmentRecordId.New(),
            StudentProfileId = studentProfileId,
            SubjectId = subjectId,
            CommissionId = commissionId,
            TermId = termId,
            Status = status,
            ApprovalMethod = approvalMethod,
            Grade = ToGradeVo(grade),
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Reemplaza los datos académicos de la cursada (US-015), revalidando el juego completo de
    /// invariantes: una edición parcial puede romper una combinación que era válida antes, así que
    /// se valida el estado resultante entero y no solo los campos que llegaron.
    ///
    /// <para>
    /// Devuelve si el update cambió algo. El caller lo usa para la idempotencia del PATCH: mandar
    /// dos veces el mismo payload no puede sellar <see cref="UpdatedAt"/> de nuevo ni emitir el
    /// evento de edición dos veces.
    /// </para>
    ///
    /// <para>
    /// Lo que NO se puede cambiar acá: el alumno y la materia. Cambiar cualquiera de los dos no es
    /// editar esta cursada, es cargar otra, y arrastraría la reseña anclada a un `EnrollmentRecord`
    /// que ya no habla de lo mismo (decisión de la versión anterior del producto, retirada con
    /// ADR-0063).
    /// </para>
    /// </summary>
    public Result<bool> Update(
        Guid? commissionId,
        Guid? termId,
        EnrollmentStatus status,
        ApprovalMethod? approvalMethod,
        decimal? grade,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var validation = ValidateInvariants(commissionId, termId, status, approvalMethod, grade);
        if (validation.IsFailure)
        {
            return validation.Error;
        }

        var gradeVo = ToGradeVo(grade);
        var unchanged = CommissionId == commissionId
            && TermId == termId
            && Status == status
            && ApprovalMethod == approvalMethod
            && Grade == gradeVo;

        if (unchanged)
        {
            return false;
        }

        CommissionId = commissionId;
        TermId = termId;
        Status = status;
        ApprovalMethod = approvalMethod;
        Grade = gradeVo;
        UpdatedAt = clock.UtcNow;
        return true;
    }

    /// <summary>
    /// Las invariantes del data-model, compartidas por <see cref="Create"/> y <see cref="Update"/>.
    /// Viven acá y no duplicadas en cada uno porque son las mismas: un record editado tiene que
    /// cumplir exactamente lo que cumple un record recién creado, y dos copias de estas reglas
    /// driftean.
    ///
    /// Orden de evaluación: status vs grade/method, method vs commission/term, status=Cursando vs term.
    /// </summary>
    private static Result ValidateInvariants(
        Guid? commissionId,
        Guid? termId,
        EnrollmentStatus status,
        ApprovalMethod? approvalMethod,
        decimal? grade)
    {
        // ── Status vs Grade ──────────────────────────────────────────────
        var statusRequiresGrade = status is EnrollmentStatus.Passed or EnrollmentStatus.Regularized;
        if (statusRequiresGrade && grade is null)
        {
            return EnrollmentRecordErrors.GradeRequiredForStatus;
        }
        if (!statusRequiresGrade && grade is not null)
        {
            return EnrollmentRecordErrors.GradeNotAllowedForStatus;
        }

        if (grade is not null && (grade.Value < 0m || grade.Value > 10m))
        {
            return EnrollmentRecordErrors.GradeOutOfRange;
        }

        // ── Status vs ApprovalMethod ─────────────────────────────────────
        if (status == EnrollmentStatus.Passed && approvalMethod is null)
        {
            return EnrollmentRecordErrors.ApprovalMethodRequiredForAprobada;
        }
        if (status != EnrollmentStatus.Passed && approvalMethod is not null)
        {
            return EnrollmentRecordErrors.ApprovalMethodNotAllowedForStatus;
        }

        // ── ApprovalMethod vs Commission/Term ────────────────────────────
        // Solo se evalúan si hay method (status=Aprobada). Para los otros status, el caller
        // puede mandar commission/term o no según haya cursado realmente.
        if (approvalMethod is EnrollmentRecords.ApprovalMethod.CreditTransfer)
        {
            if (commissionId is not null || termId is not null)
            {
                return EnrollmentRecordErrors.EquivalenciaRequiresNoCommissionNorTerm;
            }
        }
        else if (approvalMethod is EnrollmentRecords.ApprovalMethod.IndependentFinalExam)
        {
            if (commissionId is not null || termId is null)
            {
                return EnrollmentRecordErrors.FinalLibreRequiresTermWithoutCommission;
            }
        }
        else if (approvalMethod is EnrollmentRecords.ApprovalMethod.Coursework
                                  or EnrollmentRecords.ApprovalMethod.Promotion
                                  or EnrollmentRecords.ApprovalMethod.FinalExam)
        {
            // Solo el período. La comisión queda opcional a propósito: ver el docstring de
            // CursadaApprovalRequiresTerm (el historial académico no la trae, y exigirla rompía el
            // import entero de US-014).
            if (termId is null)
            {
                return EnrollmentRecordErrors.CursadaApprovalRequiresTerm;
            }
        }

        // ── Status=Cursando exige term ──────────────────────────────────
        // No tiene sentido "cursando" sin saber en qué cuatri. commission opcional (ej. está
        // anotado pero todavía no asignaron comisión, raro pero permitido en el MVP).
        if (status == EnrollmentStatus.InProgress && termId is null)
        {
            return EnrollmentRecordErrors.CursandoRequiresTerm;
        }

        return Result.Success();
    }

    private static Grade? ToGradeVo(decimal? grade) =>
        grade is null ? null : new Grade(grade.Value);

    /// <summary>
    /// Reconstitución con Id pre-asignado, para EF rehydration y seeder. Saltea las validaciones
    /// (caller responsable de datos coherentes).
    /// </summary>
    public static EnrollmentRecord Hydrate(
        EnrollmentRecordId id,
        Guid studentProfileId,
        Guid subjectId,
        Guid? commissionId,
        Guid? termId,
        EnrollmentStatus status,
        ApprovalMethod? approvalMethod,
        decimal? grade,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            StudentProfileId = studentProfileId,
            SubjectId = subjectId,
            CommissionId = commissionId,
            TermId = termId,
            Status = status,
            ApprovalMethod = approvalMethod,
            Grade = grade is null ? null : new Grade(grade.Value),
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };
}
