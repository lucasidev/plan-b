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

        var result = commission.AssignTeacher(teacherId, CommissionTeacherRole.Titular, Clock);

        result.IsSuccess.ShouldBeTrue();
        commission.Teachers.Count.ShouldBe(1);
        commission.Teachers[0].TeacherId.ShouldBe(teacherId);
        commission.Teachers[0].Role.ShouldBe(CommissionTeacherRole.Titular);
    }

    [Fact]
    public void AssignTeacher_DifferentRoles_AllowsMultiple()
    {
        var commission = CreateValid();

        commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Titular, Clock).IsSuccess.ShouldBeTrue();
        commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Jtp, Clock).IsSuccess.ShouldBeTrue();
        commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Ayudante, Clock).IsSuccess.ShouldBeTrue();

        commission.Teachers.Count.ShouldBe(3);
    }

    [Fact]
    public void AssignTeacher_SameTeacherTwice_ReturnsError()
    {
        var commission = CreateValid();
        var teacherId = TeacherId.New();
        commission.AssignTeacher(teacherId, CommissionTeacherRole.Adjunto, Clock);

        var result = commission.AssignTeacher(teacherId, CommissionTeacherRole.Jtp, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CommissionErrors.TeacherAlreadyAssigned);
        commission.Teachers.Count.ShouldBe(1);
    }

    [Fact]
    public void AssignTeacher_SecondTitular_ReturnsError()
    {
        var commission = CreateValid();
        commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Titular, Clock);

        var result = commission.AssignTeacher(TeacherId.New(), CommissionTeacherRole.Titular, Clock);

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
        commission.AssignTeacher(teacherId, CommissionTeacherRole.Titular, Clock);

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
}
