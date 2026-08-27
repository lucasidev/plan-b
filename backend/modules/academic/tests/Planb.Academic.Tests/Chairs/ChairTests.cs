using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Chairs;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Chairs;

public class ChairTests
{
    private static readonly SubjectId AnySubject = SubjectId.New();
    private static readonly AcademicTermId AnyTerm = AcademicTermId.New();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    private static Chair CreateValid() =>
        Chair.Create(AnySubject, "Pérez", Clock).Value;

    // -------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------

    [Fact]
    public void Create_HappyPath_CreatesActiveChairWithTrimmedName()
    {
        var result = Chair.Create(AnySubject, "  Pérez  ", Clock);

        result.IsSuccess.ShouldBeTrue();
        var chair = result.Value;
        chair.SubjectId.ShouldBe(AnySubject);
        chair.Name.ShouldBe("Pérez"); // trim, sin lowercase: es un label de display
        chair.IsActive.ShouldBeTrue();
        chair.Members.ShouldBeEmpty();
        chair.CreatedAt.ShouldBe(Clock.UtcNow);
        chair.UpdatedAt.ShouldBe(Clock.UtcNow);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankName_ReturnsError(string name)
    {
        var result = Chair.Create(AnySubject, name, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.NameRequired);
    }

    [Fact]
    public void Create_NameTooLong_ReturnsError()
    {
        var longName = new string('a', Chair.MaxNameLength + 1);

        var result = Chair.Create(AnySubject, longName, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.NameTooLong);
    }

    // -------------------------------------------------------------------
    // AddMember
    // -------------------------------------------------------------------

    [Fact]
    public void AddMember_NewTeacher_AddsToCurrentMembers()
    {
        var chair = CreateValid();
        var teacherId = TeacherId.New();

        var result = chair.AddMember(teacherId, ChairMemberRole.PracticalLead, AnyTerm, Clock);

        result.IsSuccess.ShouldBeTrue();
        chair.Members.Count.ShouldBe(1);
        chair.Members[0].TeacherId.ShouldBe(teacherId);
        chair.Members[0].Role.ShouldBe(ChairMemberRole.PracticalLead);
        chair.Members[0].SinceTermId.ShouldBe(AnyTerm);
        chair.Members[0].IsCurrent.ShouldBeTrue();
    }

    [Fact]
    public void AddMember_TeacherAlreadyCurrent_ReturnsError()
    {
        var chair = CreateValid();
        var teacherId = TeacherId.New();
        chair.AddMember(teacherId, ChairMemberRole.Assistant, AnyTerm, Clock);

        var result = chair.AddMember(teacherId, ChairMemberRole.Guest, AnyTerm, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.TeacherAlreadyInChair);
        chair.Members.Count.ShouldBe(1);
    }

    [Fact]
    public void AddMember_TeacherWithClosedStint_AllowsReturning()
    {
        // Entró, salió y volvió: es el caso que justifica no deduplicar por TeacherId a secas.
        var chair = CreateValid();
        var teacherId = TeacherId.New();
        var termA = AcademicTermId.New();
        var termB = AcademicTermId.New();
        chair.AddMember(teacherId, ChairMemberRole.Assistant, termA, Clock);
        chair.CloseMember(teacherId, termB, Clock);

        var result = chair.AddMember(teacherId, ChairMemberRole.Assistant, termB, Clock);

        result.IsSuccess.ShouldBeTrue();
        chair.Members.Count.ShouldBe(2); // el tramo cerrado queda, más el tramo nuevo
        chair.CurrentMembers.Count().ShouldBe(1);
        chair.CurrentMembers.Single().TeacherId.ShouldBe(teacherId);
    }

    [Fact]
    public void AddMember_SecondCurrentLead_ReturnsError()
    {
        var chair = CreateValid();
        chair.AddMember(TeacherId.New(), ChairMemberRole.Lead, AnyTerm, Clock);

        var result = chair.AddMember(TeacherId.New(), ChairMemberRole.Lead, AnyTerm, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.LeadAlreadyAssigned);
        chair.CurrentMembers.Count().ShouldBe(1);
    }

    [Fact]
    public void AddMember_NewLeadAfterClosingPrevious_Succeeds()
    {
        // El flujo del cambio de titular: cerrar al anterior habilita nombrar al siguiente.
        var chair = CreateValid();
        var firstLead = TeacherId.New();
        var secondLead = TeacherId.New();
        var termA = AcademicTermId.New();
        var termB = AcademicTermId.New();
        chair.AddMember(firstLead, ChairMemberRole.Lead, termA, Clock);
        chair.CloseMember(firstLead, termB, Clock);

        var result = chair.AddMember(secondLead, ChairMemberRole.Lead, termB, Clock);

        result.IsSuccess.ShouldBeTrue();
        chair.CurrentLead.ShouldNotBeNull();
        chair.CurrentLead!.TeacherId.ShouldBe(secondLead);
    }

    // -------------------------------------------------------------------
    // CloseMember
    // -------------------------------------------------------------------

    [Fact]
    public void CloseMember_CurrentTeacher_ClosesStintAndKeepsInMembers()
    {
        var chair = CreateValid();
        var teacherId = TeacherId.New();
        var termUntil = AcademicTermId.New();
        chair.AddMember(teacherId, ChairMemberRole.Associate, AnyTerm, Clock);

        var result = chair.CloseMember(teacherId, termUntil, Clock);

        result.IsSuccess.ShouldBeTrue();
        chair.Members.Count.ShouldBe(1); // no se borra la fila: su paso queda registrado
        chair.Members[0].IsCurrent.ShouldBeFalse();
        chair.Members[0].UntilTermId.ShouldBe(termUntil);
        chair.CurrentMembers.ShouldBeEmpty();
    }

    [Fact]
    public void CloseMember_TeacherNeverAdded_ReturnsError()
    {
        var chair = CreateValid();

        var result = chair.CloseMember(TeacherId.New(), AnyTerm, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.TeacherNotInChair);
    }

    [Fact]
    public void CloseMember_TeacherAlreadyClosed_ReturnsError()
    {
        var chair = CreateValid();
        var teacherId = TeacherId.New();
        chair.AddMember(teacherId, ChairMemberRole.Guest, AnyTerm, Clock);
        chair.CloseMember(teacherId, AnyTerm, Clock);

        var result = chair.CloseMember(teacherId, AnyTerm, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.TeacherNotInChair);
    }

    // -------------------------------------------------------------------
    // CurrentLead / CurrentMembers
    // -------------------------------------------------------------------

    [Fact]
    public void CurrentMembers_MixOfCurrentAndClosed_ReturnsOnlyCurrent()
    {
        var chair = CreateValid();
        var staying = TeacherId.New();
        var leaving = TeacherId.New();
        chair.AddMember(staying, ChairMemberRole.Assistant, AnyTerm, Clock);
        chair.AddMember(leaving, ChairMemberRole.Guest, AnyTerm, Clock);
        chair.CloseMember(leaving, AnyTerm, Clock);

        chair.CurrentMembers.Count().ShouldBe(1);
        chair.CurrentMembers.Single().TeacherId.ShouldBe(staying);
    }

    [Fact]
    public void CurrentLead_NoneAssigned_ReturnsNull()
    {
        var chair = CreateValid();
        chair.AddMember(TeacherId.New(), ChairMemberRole.Assistant, AnyTerm, Clock);

        chair.CurrentLead.ShouldBeNull();
    }

    [Fact]
    public void CurrentLead_Assigned_ReturnsLead()
    {
        var chair = CreateValid();
        var leadId = TeacherId.New();
        chair.AddMember(leadId, ChairMemberRole.Lead, AnyTerm, Clock);

        chair.CurrentLead.ShouldNotBeNull();
        chair.CurrentLead!.TeacherId.ShouldBe(leadId);
    }

    [Fact]
    public void CurrentLead_ClosedAndNotReplaced_ReturnsNull()
    {
        var chair = CreateValid();
        var leadId = TeacherId.New();
        chair.AddMember(leadId, ChairMemberRole.Lead, AnyTerm, Clock);

        chair.CloseMember(leadId, AnyTerm, Clock);

        chair.CurrentLead.ShouldBeNull();
    }

    // -------------------------------------------------------------------
    // ReplaceStaff
    // -------------------------------------------------------------------

    [Fact]
    public void ReplaceStaff_ValidSet_ReplacesEntireTeamAndBumpsUpdatedAt()
    {
        var chair = CreateValid();
        chair.AddMember(TeacherId.New(), ChairMemberRole.Assistant, AnyTerm, Clock);
        var later = new FixedClock(Clock.UtcNow.AddDays(1));
        var newLead = TeacherId.New();
        var newAssistant = TeacherId.New();

        var result = chair.ReplaceStaff(
            [
                (newLead, ChairMemberRole.Lead, AnyTerm, null),
                (newAssistant, ChairMemberRole.Assistant, AnyTerm, null),
            ],
            later);

        result.IsSuccess.ShouldBeTrue();
        chair.Members.Count.ShouldBe(2); // el equipo viejo quedó afuera por completo
        chair.CurrentLead.ShouldNotBeNull();
        chair.CurrentLead!.TeacherId.ShouldBe(newLead);
        chair.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void ReplaceStaff_InvalidNewSet_LeavesOriginalTeamIntact()
    {
        // Valida antes de mutar: un set nuevo inválido no toca el equipo ya cargado.
        var chair = CreateValid();
        var original = TeacherId.New();
        chair.AddMember(original, ChairMemberRole.Lead, AnyTerm, Clock);

        var result = chair.ReplaceStaff(
            [
                (TeacherId.New(), ChairMemberRole.Lead, AnyTerm, null),
                (TeacherId.New(), ChairMemberRole.Lead, AnyTerm, null),
            ],
            Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.LeadAlreadyAssigned);
        chair.Members.Count.ShouldBe(1);
        chair.Members[0].TeacherId.ShouldBe(original);
    }

    [Fact]
    public void ReplaceStaff_TwoClosedLeadsFromDifferentEras_Allowed()
    {
        // Dos titulares en épocas distintas, ambos con su tramo ya cerrado: no compiten entre sí.
        var chair = CreateValid();
        var termA = AcademicTermId.New();
        var termB = AcademicTermId.New();
        var termC = AcademicTermId.New();

        var result = chair.ReplaceStaff(
            [
                (TeacherId.New(), ChairMemberRole.Lead, termA, termB),
                (TeacherId.New(), ChairMemberRole.Lead, termB, termC),
            ],
            Clock);

        result.IsSuccess.ShouldBeTrue();
        chair.Members.Count.ShouldBe(2);
        chair.CurrentLead.ShouldBeNull(); // ninguno de los dos sigue vigente
    }

    [Fact]
    public void ReplaceStaff_TwoCurrentLeads_ReturnsError()
    {
        var chair = CreateValid();

        var result = chair.ReplaceStaff(
            [
                (TeacherId.New(), ChairMemberRole.Lead, AnyTerm, null),
                (TeacherId.New(), ChairMemberRole.Lead, AnyTerm, null),
            ],
            Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.LeadAlreadyAssigned);
    }

    // -------------------------------------------------------------------
    // Hydrate
    // -------------------------------------------------------------------

    [Fact]
    public void Hydrate_ValidTeam_ReconstitutesChairWithMembers()
    {
        var id = ChairId.New();
        var closedLead = TeacherId.New();
        var currentLead = TeacherId.New();
        var assistant = TeacherId.New();
        var termA = AcademicTermId.New();
        var termB = AcademicTermId.New();

        var chair = Chair.Hydrate(
            id,
            AnySubject,
            "Pérez",
            [
                (closedLead, ChairMemberRole.Lead, termA, termB),
                (currentLead, ChairMemberRole.Lead, termB, null),
                (assistant, ChairMemberRole.Assistant, termB, null),
            ],
            isActive: true,
            createdAt: Clock.UtcNow,
            updatedAt: Clock.UtcNow);

        chair.Id.ShouldBe(id);
        chair.SubjectId.ShouldBe(AnySubject);
        chair.Name.ShouldBe("Pérez");
        chair.IsActive.ShouldBeTrue();
        chair.Members.Count.ShouldBe(3);
        chair.CurrentMembers.Count().ShouldBe(2);
        chair.CurrentLead.ShouldNotBeNull();
        chair.CurrentLead!.TeacherId.ShouldBe(currentLead);
    }

    [Fact]
    public void Hydrate_TwoCurrentLeads_ThrowsArgumentException()
    {
        Should.Throw<ArgumentException>(() => Chair.Hydrate(
            ChairId.New(),
            AnySubject,
            "A",
            [
                (TeacherId.New(), ChairMemberRole.Lead, AnyTerm, null),
                (TeacherId.New(), ChairMemberRole.Lead, AnyTerm, null),
            ],
            isActive: true,
            createdAt: Clock.UtcNow,
            updatedAt: Clock.UtcNow));
    }

    [Fact]
    public void Hydrate_RepeatedCurrentTeacher_ThrowsArgumentException()
    {
        var teacherId = TeacherId.New();

        Should.Throw<ArgumentException>(() => Chair.Hydrate(
            ChairId.New(),
            AnySubject,
            "A",
            [
                (teacherId, ChairMemberRole.Assistant, AnyTerm, null),
                (teacherId, ChairMemberRole.Guest, AnyTerm, null),
            ],
            isActive: true,
            createdAt: Clock.UtcNow,
            updatedAt: Clock.UtcNow));
    }

    // -------------------------------------------------------------------
    // Deactivate / Reactivate (soft delete, idempotencia explícita)
    // -------------------------------------------------------------------

    [Fact]
    public void Deactivate_Active_SetsInactive()
    {
        var chair = CreateValid();

        var result = chair.Deactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        chair.IsActive.ShouldBeFalse();
    }

    [Fact]
    public void Deactivate_AlreadyInactive_ReturnsError()
    {
        var chair = CreateValid();
        chair.Deactivate(Clock);

        var result = chair.Deactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.AlreadyInactive);
    }

    [Fact]
    public void Reactivate_Inactive_SetsActive()
    {
        var chair = CreateValid();
        chair.Deactivate(Clock);

        var result = chair.Reactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        chair.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void Reactivate_AlreadyActive_ReturnsError()
    {
        var chair = CreateValid();

        var result = chair.Reactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairErrors.AlreadyActive);
    }

    // -------------------------------------------------------------------
    // Timestamps: CreatedAt fijo desde el alta, UpdatedAt avanza con cada mutación.
    // -------------------------------------------------------------------

    [Fact]
    public void Mutations_AtDifferentTimes_KeepCreatedAtButBumpUpdatedAt()
    {
        var chair = CreateValid();
        var createdAt = chair.CreatedAt;
        var afterAdd = new FixedClock(Clock.UtcNow.AddDays(1));
        var afterDeactivate = new FixedClock(Clock.UtcNow.AddDays(2));
        var afterReactivate = new FixedClock(Clock.UtcNow.AddDays(3));

        chair.AddMember(TeacherId.New(), ChairMemberRole.Lead, AnyTerm, afterAdd);
        chair.CreatedAt.ShouldBe(createdAt);
        chair.UpdatedAt.ShouldBe(afterAdd.UtcNow);

        chair.Deactivate(afterDeactivate);
        chair.CreatedAt.ShouldBe(createdAt);
        chair.UpdatedAt.ShouldBe(afterDeactivate.UtcNow);

        chair.Reactivate(afterReactivate);
        chair.CreatedAt.ShouldBe(createdAt);
        chair.UpdatedAt.ShouldBe(afterReactivate.UtcNow);
    }
}
