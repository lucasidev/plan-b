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
            EnrollmentStatus.Aprobada, ApprovalMethod.Cursada, grade: 8m, Clock);

        result.IsSuccess.ShouldBeTrue();
        var r = result.Value;
        r.Status.ShouldBe(EnrollmentStatus.Aprobada);
        r.ApprovalMethod.ShouldBe(ApprovalMethod.Cursada);
        r.Grade!.Value.Value.ShouldBe(8m);
    }

    [Fact]
    public void Create_AprobadaConEquivalencia_Success_SinCommissionNiTerm()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: null,
            EnrollmentStatus.Aprobada, ApprovalMethod.Equivalencia, grade: 7m, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_AprobadaConFinalLibre_Success_SoloTerm()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: AnyTerm,
            EnrollmentStatus.Aprobada, ApprovalMethod.FinalLibre, grade: 6m, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_Regular_Success_SinApprovalMethod_ConGrade()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Regular, approvalMethod: null, grade: 6m, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ApprovalMethod.ShouldBeNull();
        result.Value.Grade.ShouldNotBeNull();
    }

    [Fact]
    public void Create_Cursando_Success_SinGradeNiMethod_ConTerm()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Cursando, approvalMethod: null, grade: null, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_Reprobada_Success_SinGradeNiMethod()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Reprobada, approvalMethod: null, grade: null, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_Abandonada_Success_SinGradeNiMethod()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Abandonada, approvalMethod: null, grade: null, Clock);

        result.IsSuccess.ShouldBeTrue();
    }

    // ── Invariantes: Status vs Grade ────────────────────────────────────

    [Theory]
    [InlineData(EnrollmentStatus.Aprobada)]
    [InlineData(EnrollmentStatus.Regular)]
    public void Create_StatusRequiereGrade_PeroFaltaGrade_ReturnsError(EnrollmentStatus status)
    {
        var method = status == EnrollmentStatus.Aprobada ? ApprovalMethod.Cursada : (ApprovalMethod?)null;
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            status, method, grade: null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.GradeRequiredForStatus);
    }

    [Theory]
    [InlineData(EnrollmentStatus.Cursando)]
    [InlineData(EnrollmentStatus.Reprobada)]
    [InlineData(EnrollmentStatus.Abandonada)]
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
            EnrollmentStatus.Aprobada, ApprovalMethod.Cursada, grade, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.GradeOutOfRange);
    }

    // ── Invariantes: Status vs ApprovalMethod ───────────────────────────

    [Fact]
    public void Create_AprobadaSinMethod_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Aprobada, approvalMethod: null, grade: 8m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.ApprovalMethodRequiredForAprobada);
    }

    [Theory]
    [InlineData(EnrollmentStatus.Regular)]
    [InlineData(EnrollmentStatus.Cursando)]
    [InlineData(EnrollmentStatus.Reprobada)]
    [InlineData(EnrollmentStatus.Abandonada)]
    public void Create_NoAprobadaConMethod_ReturnsError(EnrollmentStatus status)
    {
        var grade = status == EnrollmentStatus.Regular ? (decimal?)6m : null;
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            status, ApprovalMethod.Cursada, grade, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.ApprovalMethodNotAllowedForStatus);
    }

    // ── Invariantes: Method vs Commission/Term ──────────────────────────

    [Fact]
    public void Create_EquivalenciaConCommission_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, termId: null,
            EnrollmentStatus.Aprobada, ApprovalMethod.Equivalencia, grade: 8m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.EquivalenciaRequiresNoCommissionNorTerm);
    }

    [Fact]
    public void Create_EquivalenciaConTerm_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: AnyTerm,
            EnrollmentStatus.Aprobada, ApprovalMethod.Equivalencia, grade: 8m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.EquivalenciaRequiresNoCommissionNorTerm);
    }

    [Fact]
    public void Create_FinalLibreSinTerm_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: null,
            EnrollmentStatus.Aprobada, ApprovalMethod.FinalLibre, grade: 7m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.FinalLibreRequiresTermWithoutCommission);
    }

    [Fact]
    public void Create_FinalLibreConCommission_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, AnyTerm,
            EnrollmentStatus.Aprobada, ApprovalMethod.FinalLibre, grade: 7m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.FinalLibreRequiresTermWithoutCommission);
    }

    [Theory]
    [InlineData(ApprovalMethod.Cursada)]
    [InlineData(ApprovalMethod.Promocion)]
    [InlineData(ApprovalMethod.Final)]
    public void Create_CursadaSinCommissionOTerm_ReturnsError(ApprovalMethod method)
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, commissionId: null, termId: AnyTerm,
            EnrollmentStatus.Aprobada, method, grade: 8m, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EnrollmentRecordErrors.CursadaApprovalMissingCommissionOrTerm);
    }

    [Fact]
    public void Create_CursandoSinTerm_ReturnsError()
    {
        var result = EnrollmentRecord.Create(
            AnyStudent, AnySubject, AnyCommission, termId: null,
            EnrollmentStatus.Cursando, approvalMethod: null, grade: null, Clock);

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
            EnrollmentStatus.Aprobada, ApprovalMethod.Equivalencia, grade: 8m,
            Clock.UtcNow, Clock.UtcNow);

        r.Id.ShouldBe(id);
        r.Status.ShouldBe(EnrollmentStatus.Aprobada);
        r.ApprovalMethod.ShouldBe(ApprovalMethod.Equivalencia);
    }
}
