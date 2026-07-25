using Planb.Academic.Domain.Commissions;
using Planb.Academic.Domain.Teachers;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Commissions;

public class CommissionTests
{
    private static readonly Guid AnySubject = Guid.NewGuid();
    private static readonly Guid AnyTerm = Guid.NewGuid();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    private static Commission CreateValid() =>
        Commission.Create(AnySubject, AnyTerm, "A", CommissionModality.Presencial, 40, null, Clock).Value;

    // -------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------

    [Fact]
    public void Create_HappyPath_TrimsNameAndStartsWithoutTeachers()
    {
        var result = Commission.Create(
            AnySubject, AnyTerm, "  Noche  ", CommissionModality.Hibrida, 30, "  nota  ", Clock);

        result.IsSuccess.ShouldBeTrue();
        var commission = result.Value;
        commission.SubjectId.ShouldBe(AnySubject);
        commission.TermId.ShouldBe(AnyTerm);
        commission.Name.ShouldBe("Noche"); // trim, sin lowercase (es un label de display)
        commission.Modality.ShouldBe(CommissionModality.Hibrida);
        commission.Capacity.ShouldBe(30);
        commission.Notes.ShouldBe("nota");
        commission.Teachers.ShouldBeEmpty();
        commission.CreatedAt.ShouldBe(Clock.UtcNow);
    }

    [Fact]
    public void Create_NullCapacityAndBlankNotes_StoredAsNull()
    {
        var commission = Commission.Create(
            AnySubject, AnyTerm, "B", CommissionModality.Virtual, null, "   ", Clock).Value;

        commission.Capacity.ShouldBeNull();
        commission.Notes.ShouldBeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankName_ReturnsError(string name)
    {
        var result = Commission.Create(
            AnySubject, AnyTerm, name, CommissionModality.Presencial, null, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.NameRequired);
    }

    [Fact]
    public void Create_NameTooLong_ReturnsError()
    {
        var longName = new string('a', Commission.MaxNameLength + 1);

        var result = Commission.Create(
            AnySubject, AnyTerm, longName, CommissionModality.Presencial, null, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.NameTooLong);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Create_NonPositiveCapacity_ReturnsError(int capacity)
    {
        var result = Commission.Create(
            AnySubject, AnyTerm, "A", CommissionModality.Presencial, capacity, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.CapacityNotPositive);
    }

    [Fact]
    public void Create_NotesTooLong_ReturnsError()
    {
        var longNotes = new string('a', Commission.MaxNotesLength + 1);

        var result = Commission.Create(
            AnySubject, AnyTerm, "A", CommissionModality.Presencial, null, longNotes, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.NotesTooLong);
    }

    // -------------------------------------------------------------------
    // AssignTeacher
    // -------------------------------------------------------------------

    [Fact]
    public void AssignTeacher_AddsTeacherWithRole()
    {
        var commission = CreateValid();
        var teacherId = TeacherId.New();

        var result = commission.AssignTeacher(teacherId, CommissionTeacherRole.Lead, Clock);

        result.IsSuccess.ShouldBeTrue();
        commission.Teachers.Count.ShouldBe(1);
        commission.Teachers[0].TeacherId.ShouldBe(teacherId);
        commission.Teachers[0].Role.ShouldBe(CommissionTeacherRole.Lead);
    }

    [Fact]
    public void AssignTeacher_DifferentRoles_AllowsMultiple()
    {
        var commission = CreateValid();

        commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Lead, Clock).IsSuccess.ShouldBeTrue();
        commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.PracticalLead, Clock).IsSuccess.ShouldBeTrue();
        commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Assistant, Clock).IsSuccess.ShouldBeTrue();

        commission.Teachers.Count.ShouldBe(3);
    }

    [Fact]
    public void AssignTeacher_SameTeacherTwice_ReturnsError()
    {
        var commission = CreateValid();
        var teacherId = TeacherId.New();
        commission.AssignTeacher(teacherId, CommissionTeacherRole.Associate, Clock);

        var result = commission.AssignTeacher(teacherId, CommissionTeacherRole.PracticalLead, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.TeacherAlreadyAssigned);
        commission.Teachers.Count.ShouldBe(1);
    }

    [Fact]
    public void AssignTeacher_SecondTitular_ReturnsError()
    {
        var commission = CreateValid();
        commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Lead, Clock);

        var result = commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Lead, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.TitularAlreadyAssigned);
        commission.Teachers.Count.ShouldBe(1);
    }

    // -------------------------------------------------------------------
    // UnassignTeacher
    // -------------------------------------------------------------------

    [Fact]
    public void UnassignTeacher_RemovesAssignedTeacher()
    {
        var commission = CreateValid();
        var teacherId = TeacherId.New();
        commission.AssignTeacher(teacherId, CommissionTeacherRole.Lead, Clock);

        var result = commission.UnassignTeacher(teacherId, Clock);

        result.IsSuccess.ShouldBeTrue();
        commission.Teachers.ShouldBeEmpty();
    }

    [Fact]
    public void UnassignTeacher_NotAssigned_ReturnsError()
    {
        var commission = CreateValid();

        var result = commission.UnassignTeacher(TeacherId.New(), Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.TeacherNotAssigned);
    }

    // -------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------

    [Fact]
    public void Update_Valid_ChangesMetadataAndBumpsUpdatedAt()
    {
        var commission = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = commission.Update("  B  ", CommissionModality.Virtual, 99, "nueva", later);

        result.IsSuccess.ShouldBeTrue();
        commission.Name.ShouldBe("B");
        commission.Modality.ShouldBe(CommissionModality.Virtual);
        commission.Capacity.ShouldBe(99);
        commission.Notes.ShouldBe("nueva");
        commission.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Update_Invalid_ReturnsErrorAndLeavesStateUnchanged()
    {
        var commission = CreateValid();

        var result = commission.Update("", CommissionModality.Virtual, 99, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.NameRequired);
        commission.Name.ShouldBe("A");
        commission.Modality.ShouldBe(CommissionModality.Presencial);
    }

    // -------------------------------------------------------------------
    // ReplaceSchedule (US-093)
    // -------------------------------------------------------------------

    private static (DayOfWeek, TimeOnly, TimeOnly) Block(DayOfWeek day, int fromHour, int toHour) =>
        (day, new TimeOnly(fromHour, 0), new TimeOnly(toHour, 0));

    [Fact]
    public void ReplaceSchedule_ValidBlocks_SetsSchedulesAndBumpsUpdatedAt()
    {
        var commission = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = commission.ReplaceSchedule(
            [Block(DayOfWeek.Monday, 18, 22), Block(DayOfWeek.Wednesday, 18, 20)], later);

        result.IsSuccess.ShouldBeTrue();
        commission.Schedules.Count.ShouldBe(2);
        commission.Schedules[0].Day.ShouldBe(DayOfWeek.Monday);
        commission.Schedules[0].StartTime.ShouldBe(new TimeOnly(18, 0));
        commission.Schedules[0].EndTime.ShouldBe(new TimeOnly(22, 0));
        commission.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void ReplaceSchedule_EmptySet_LeavesCommissionWithoutSchedule()
    {
        var commission = CreateValid();
        commission.ReplaceSchedule([Block(DayOfWeek.Monday, 18, 22)], Clock);

        var result = commission.ReplaceSchedule([], Clock);

        result.IsSuccess.ShouldBeTrue();
        commission.Schedules.ShouldBeEmpty();
    }

    [Theory]
    [InlineData(20, 20)] // termina cuando empieza: dura cero
    [InlineData(22, 18)] // termina antes de empezar
    public void ReplaceSchedule_EndNotAfterStart_ReturnsError(int fromHour, int toHour)
    {
        var commission = CreateValid();

        var result = commission.ReplaceSchedule([Block(DayOfWeek.Monday, fromHour, toHour)], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.ScheduleInvalidRange);
        commission.Schedules.ShouldBeEmpty();
    }

    [Fact]
    public void ReplaceSchedule_OverlappingSameDay_ReturnsError()
    {
        var commission = CreateValid();

        // 18-22 y 19-21 el mismo día se pisan.
        var result = commission.ReplaceSchedule(
            [Block(DayOfWeek.Tuesday, 18, 22), Block(DayOfWeek.Tuesday, 19, 21)], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.ScheduleOverlap);
    }

    [Fact]
    public void ReplaceSchedule_ContiguousSameDay_Allowed()
    {
        var commission = CreateValid();

        // 18-20 y 20-22 el mismo día son contiguos, no chocan (intervalo semiabierto [start, end)).
        var result = commission.ReplaceSchedule(
            [Block(DayOfWeek.Tuesday, 18, 20), Block(DayOfWeek.Tuesday, 20, 22)], Clock);

        result.IsSuccess.ShouldBeTrue();
        commission.Schedules.Count.ShouldBe(2);
    }

    [Fact]
    public void ReplaceSchedule_SameHoursDifferentDay_Allowed()
    {
        var commission = CreateValid();

        var result = commission.ReplaceSchedule(
            [Block(DayOfWeek.Monday, 18, 22), Block(DayOfWeek.Tuesday, 18, 22)], Clock);

        result.IsSuccess.ShouldBeTrue();
        commission.Schedules.Count.ShouldBe(2);
    }

    [Fact]
    public void ReplaceSchedule_InvalidSet_LeavesPreviousScheduleUnchanged()
    {
        var commission = CreateValid();
        commission.ReplaceSchedule([Block(DayOfWeek.Monday, 8, 10)], Clock);

        // Un set inválido (solapado) no debe tocar el horario ya cargado: valida antes de mutar.
        var result = commission.ReplaceSchedule(
            [Block(DayOfWeek.Tuesday, 18, 22), Block(DayOfWeek.Tuesday, 19, 21)], Clock);

        result.IsFailure.ShouldBeTrue();
        commission.Schedules.Count.ShouldBe(1);
        commission.Schedules[0].Day.ShouldBe(DayOfWeek.Monday);
    }
}
