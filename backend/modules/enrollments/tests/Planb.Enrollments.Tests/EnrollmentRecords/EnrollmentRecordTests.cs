using Planb.Enrollments.Domain.EnrollmentRecords;
using Shouldly;
using Xunit;

namespace Planb.Enrollments.Tests.EnrollmentRecords;

public class EnrollmentRecordTests
{
    private static readonly Guid AnyStudent = Guid.NewGuid();
    private static readonly Guid AnySubject = Guid.NewGuid();
    private static readonly Guid AnyCommission = Guid.NewGuid();
    private static readonly Guid AnyTerm = Guid.NewGuid();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 5, 15, 12, 0, 0, TimeSpan.Zero));

    // ── Happy paths ──────────────────────────────────────────────────────

    [Fact]
    public void Create_AprobadaWithCursada_Success()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Passed, ApprovalMethod.Coursework, grade: 8m, Clock);

        result.IsSuccess.ShouldBeTrue();
        var r = result.Value;
        r.Status.ShouldBe(EnrollmentStatus.Passed);
        r.ApprovalMethod.ShouldBe(ApprovalMethod.Coursework);
        r.Grade!.Value.Value.ShouldBe(8m);
    }

    [Fact]
    public void Create_AprobadaConEquivalencia_Success_SinCommissionNiTerm()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: null,
            EnrollmentStatus.Passed, ApprovalMethod.CreditTransfer, grade: 7m, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_AprobadaConFinalLibre_Success_SoloTerm()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: AnyTerm,
            EnrollmentStatus.Passed, ApprovalMethod.IndependentFinalExam, grade: 6m, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_Regular_Success_SinApprovalMethod_ConGrade()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Regularized, approvalMethod: null, grade: 6m, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ApprovalMethod.ShouldBeNull();
        result.Value.Grade.ShouldNotBeNull();
    }

    [Fact]
    public void Create_Cursando_Success_SinGradeNiMethod_ConTerm()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.InProgress, approvalMethod: null, grade: null, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_Reprobada_Success_SinGradeNiMethod()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Failed, approvalMethod: null, grade: null, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_Abandonada_Success_SinGradeNiMethod()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Dropped, approvalMethod: null, grade: null, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    // ── Invariantes: Status vs Grade ────────────────────────────────────

    [Theory]
    [InlineData(EnrollmentStatus.Passed)]
    [InlineData(EnrollmentStatus.Regularized)]
    public void Create_StatusRequiereGrade_PeroFaltaGrade_ReturnsError(EnrollmentStatus status)
    {
        var method = status == EnrollmentStatus.Passed ? ApprovalMethod.Coursework : (ApprovalMethod?)null;
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            status, method, grade: null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.GradeRequiredForStatus);
    }

    [Theory]
    [InlineData(EnrollmentStatus.InProgress)]
    [InlineData(EnrollmentStatus.Failed)]
    [InlineData(EnrollmentStatus.Dropped)]
    public void Create_StatusNoPermiteGrade_PeroVieneGrade_ReturnsError(EnrollmentStatus status)
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            status, approvalMethod: null, grade: 7m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.GradeNotAllowedForStatus);
    }

    [Theory]
    [InlineData(-0.1)]
    [InlineData(10.1)]
    [InlineData(15)]
    public void Create_GradeFueraDeRango_ReturnsError(decimal grade)
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Passed, ApprovalMethod.Coursework, grade, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.GradeOutOfRange);
    }

    // ── Invariantes: Status vs ApprovalMethod ───────────────────────────

    [Fact]
    public void Create_AprobadaSinMethod_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Passed, approvalMethod: null, grade: 8m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.ApprovalMethodRequiredForAprobada);
    }

    [Theory]
    [InlineData(EnrollmentStatus.Regularized)]
    [InlineData(EnrollmentStatus.InProgress)]
    [InlineData(EnrollmentStatus.Failed)]
    [InlineData(EnrollmentStatus.Dropped)]
    public void Create_NoAprobadaConMethod_ReturnsError(EnrollmentStatus status)
    {
        var grade = status == EnrollmentStatus.Regularized ? (decimal?)6m : null;
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            status, ApprovalMethod.Coursework, grade, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.ApprovalMethodNotAllowedForStatus);
    }

    // ── Invariantes: Method vs Commission/Term ──────────────────────────

    [Fact]
    public void Create_EquivalenciaConCommission_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, termId: null,
            EnrollmentStatus.Passed, ApprovalMethod.CreditTransfer, grade: 8m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.EquivalenciaRequiresNoCommissionNorTerm);
    }

    [Fact]
    public void Create_EquivalenciaConTerm_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: AnyTerm,
            EnrollmentStatus.Passed, ApprovalMethod.CreditTransfer, grade: 8m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.EquivalenciaRequiresNoCommissionNorTerm);
    }

    [Fact]
    public void Create_FinalLibreSinTerm_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: null,
            EnrollmentStatus.Passed, ApprovalMethod.IndependentFinalExam, grade: 7m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.FinalLibreRequiresTermWithoutCommission);
    }

    [Fact]
    public void Create_FinalLibreConCommission_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Passed, ApprovalMethod.IndependentFinalExam, grade: 7m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.FinalLibreRequiresTermWithoutCommission);
    }

    [Theory]
    [InlineData(ApprovalMethod.Coursework)]
    [InlineData(ApprovalMethod.Promotion)]
    [InlineData(ApprovalMethod.FinalExam)]
    public void Create_CursadaSinTerm_ReturnsError(ApprovalMethod method)
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, termId: null,
            EnrollmentStatus.Passed, method, grade: 8m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.CursadaApprovalRequiresTerm);
    }

    /// <summary>
    /// El camino del import de historial: aprobada por cursada, con período y sin comisión. El
    /// documento que sube el alumno no dice en qué comisión cursó, así que si el aggregate la
    /// exigiera no habría forma de registrar la cursada más común que existe.
    /// </summary>
    [Theory]
    [InlineData(ApprovalMethod.Coursework)]
    [InlineData(ApprovalMethod.Promotion)]
    [InlineData(ApprovalMethod.FinalExam)]
    public void Create_CursadaSinCommissionPeroConTerm_Succeeds(ApprovalMethod method)
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: AnyTerm,
            EnrollmentStatus.Passed, method, grade: 8m, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.CommissionId.ShouldBeNull();
        result.Value.TermId.ShouldBe(AnyTerm);
    }

    [Fact]
    public void Create_CursandoSinTerm_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, termId: null,
            EnrollmentStatus.InProgress, approvalMethod: null, grade: null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.CursandoRequiresTerm);
    }

    // ── Hydrate ─────────────────────────────────────────────────────────

    [Fact]
    public void Hydrate_NoValida()
    {
        var id = EnrollmentRecordId.New();
        // Combinación inválida que Create rechazaría (Aprobada sin method, Equivalencia con commission).
        var r = EnrollmentRecord.Hydrate(
            id, AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Passed, ApprovalMethod.CreditTransfer, grade: 8m,
            Clock.UtcNow, Clock.UtcNow);

        r.Id.ShouldBe(id);
        r.Status.ShouldBe(EnrollmentStatus.Passed);
        r.ApprovalMethod.ShouldBe(ApprovalMethod.CreditTransfer);
    }

    // ── Update (US-015) ──────────────────────────────────────────────────

    /// <summary>Cursada en curso, el estado del que sale toda edición de cierre de cuatrimestre.</summary>
    private static EnrollmentRecord InProgressRecord(FixedClock clock) =>
        EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.InProgress, approvalMethod: null, grade: null, clock).Value;

    [Fact]
    public void Update_CursandoAAprobada_Success_YSellaUpdatedAt()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero));
        var record = InProgressRecord(clock);
        var createdAt = record.CreatedAt;
        clock.Advance(TimeSpan.FromDays(30));

        var result = record.Update(
            AnyCommission, AnyTerm, EnrollmentStatus.Passed,
            ApprovalMethod.Promotion, grade: 9m, clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBeTrue();
        record.Status.ShouldBe(EnrollmentStatus.Passed);
        record.ApprovalMethod.ShouldBe(ApprovalMethod.Promotion);
        record.Grade!.Value.Value.ShouldBe(9m);
        record.CreatedAt.ShouldBe(createdAt);
        record.UpdatedAt.ShouldBe(clock.UtcNow);
    }

    [Fact]
    public void Update_MismoPayload_DevuelveFalse_YNoTocaUpdatedAt()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero));
        var record = InProgressRecord(clock);
        var updatedAt = record.UpdatedAt;
        clock.Advance(TimeSpan.FromDays(30));

        var result = record.Update(
            AnyCommission, AnyTerm, EnrollmentStatus.InProgress,
            approvalMethod: null, grade: null, clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBeFalse();
        record.UpdatedAt.ShouldBe(updatedAt);
    }

    [Fact]
    public void Update_AprobadaSinNota_Falla_YNoMuta()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero));
        var record = InProgressRecord(clock);

        var result = record.Update(
            AnyCommission, AnyTerm, EnrollmentStatus.Passed,
            ApprovalMethod.Coursework, grade: null, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.GradeRequiredForStatus);
        record.Status.ShouldBe(EnrollmentStatus.InProgress);
    }

    [Fact]
    public void Update_AprobadaSinMetodo_Falla()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero));
        var record = InProgressRecord(clock);

        var result = record.Update(
            AnyCommission, AnyTerm, EnrollmentStatus.Passed,
            approvalMethod: null, grade: 8m, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.ApprovalMethodRequiredForAprobada);
    }

    [Fact]
    public void Update_EquivalenciaConservandoComision_Falla()
    {
        // La combinación era válida antes del update (Cursando con comisión) y deja de serlo
        // después: es exactamente el caso que obliga a revalidar el estado resultante entero en vez
        // de solo los campos que llegaron en el PATCH.
        var clock = new FixedClock(new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero));
        var record = InProgressRecord(clock);

        var result = record.Update(
            AnyCommission, AnyTerm, EnrollmentStatus.Passed,
            ApprovalMethod.CreditTransfer, grade: 8m, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.EquivalenciaRequiresNoCommissionNorTerm);
    }

    [Fact]
    public void Update_VolverACursandoSinTerm_Falla()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero));
        var record = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Passed, ApprovalMethod.Coursework, grade: 8m, clock).Value;

        var result = record.Update(
            AnyCommission, termId: null, EnrollmentStatus.InProgress,
            approvalMethod: null, grade: null, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.CursandoRequiresTerm);
    }

    [Fact]
    public void Update_NotaFueraDeRango_Falla()
    {
        var clock = new FixedClock(new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero));
        var record = InProgressRecord(clock);

        var result = record.Update(
            AnyCommission, AnyTerm, EnrollmentStatus.Passed,
            ApprovalMethod.Coursework, grade: 11m, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.GradeOutOfRange);
    }
}
