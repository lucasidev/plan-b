using Planb.Academic.Domain.Teachers;
using Planb.Academic.Domain.Universities;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Teachers;

public class TeacherTests
{
    private static readonly UniversityId AnyUni = UniversityId.New();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    private static Teacher CreateValid() =>
        Teacher.Create(AnyUni, "Carlos", "Brandt", "Profesor Titular", null, null, Clock).Value;

    // -------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------

    [Fact]
    public void Create_HappyPath_NormalizesNamesAndStartsActive()
    {
        var result = Teacher.Create(
            AnyUni, "  JUAN  ", "Pérez", "  Profesor Adjunto  ", "  bio  ", "  url  ", Clock);

        result.IsSuccess.ShouldBeTrue();
        var teacher = result.Value;
        teacher.UniversityId.ShouldBe(AnyUni);
        teacher.FirstName.ShouldBe("juan");   // trim + lowercase
        teacher.LastName.ShouldBe("pérez");   // lowercase preserva acento
        teacher.Title.ShouldBe("Profesor Adjunto");
        teacher.Bio.ShouldBe("bio");
        teacher.PhotoUrl.ShouldBe("url");
        teacher.IsActive.ShouldBeTrue();
        teacher.CreatedAt.ShouldBe(Clock.UtcNow);
        teacher.UpdatedAt.ShouldBe(Clock.UtcNow);
    }

    [Fact]
    public void Create_BlankOptionalDetails_StoredAsNull()
    {
        var teacher = Teacher.Create(AnyUni, "Ana", "Sosa", "   ", "", null, Clock).Value;

        teacher.Title.ShouldBeNull();
        teacher.Bio.ShouldBeNull();
        teacher.PhotoUrl.ShouldBeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankFirstName_ReturnsError(string firstName)
    {
        var result = Teacher.Create(AnyUni, firstName, "Brandt", null, null, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.FirstNameRequired);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankLastName_ReturnsError(string lastName)
    {
        var result = Teacher.Create(AnyUni, "Carlos", lastName, null, null, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.LastNameRequired);
    }

    [Fact]
    public void Create_NameTooLong_ReturnsError()
    {
        var longName = new string('a', Teacher.MaxNameLength + 1);

        var result = Teacher.Create(AnyUni, longName, "Brandt", null, null, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.NameTooLong);
    }

    [Fact]
    public void Create_TitleTooLong_ReturnsError()
    {
        var longTitle = new string('a', Teacher.MaxTitleLength + 1);

        var result = Teacher.Create(AnyUni, "Carlos", "Brandt", longTitle, null, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.TitleTooLong);
    }

    [Fact]
    public void Create_BioTooLong_ReturnsError()
    {
        var longBio = new string('a', Teacher.MaxBioLength + 1);

        var result = Teacher.Create(AnyUni, "Carlos", "Brandt", null, longBio, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.BioTooLong);
    }

    [Fact]
    public void Create_PhotoUrlTooLong_ReturnsError()
    {
        var longUrl = new string('a', Teacher.MaxPhotoUrlLength + 1);

        var result = Teacher.Create(AnyUni, "Carlos", "Brandt", null, null, longUrl, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.PhotoUrlTooLong);
    }

    // -------------------------------------------------------------------
    // Rename
    // -------------------------------------------------------------------

    [Fact]
    public void Rename_Valid_NormalizesAndBumpsUpdatedAt()
    {
        var teacher = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = teacher.Rename("MARÍA", "Gómez", later);

        result.IsSuccess.ShouldBeTrue();
        teacher.FirstName.ShouldBe("maría");
        teacher.LastName.ShouldBe("gómez");
        teacher.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Rename_Blank_ReturnsErrorAndLeavesNameUnchanged()
    {
        var teacher = CreateValid();

        var result = teacher.Rename("", "Gómez", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.FirstNameRequired);
        teacher.FirstName.ShouldBe("carlos");
    }

    // -------------------------------------------------------------------
    // UpdateProfile (patch: null deja como está)
    // -------------------------------------------------------------------

    [Fact]
    public void UpdateProfile_NullFields_LeaveExistingUntouched()
    {
        var teacher = CreateValid(); // Title = "Profesor Titular", Bio/PhotoUrl null

        var result = teacher.UpdateProfile(null, "nueva bio", null, Clock);

        result.IsSuccess.ShouldBeTrue();
        teacher.Title.ShouldBe("Profesor Titular"); // null -> sin cambios
        teacher.Bio.ShouldBe("nueva bio");
        teacher.PhotoUrl.ShouldBeNull();
    }

    [Fact]
    public void UpdateProfile_TooLong_ReturnsError()
    {
        var teacher = CreateValid();
        var longBio = new string('a', Teacher.MaxBioLength + 1);

        var result = teacher.UpdateProfile(null, longBio, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.BioTooLong);
    }

    // -------------------------------------------------------------------
    // Deactivate / Reactivate (soft delete, idempotencia explícita)
    // -------------------------------------------------------------------

    [Fact]
    public void Deactivate_Active_SetsInactive()
    {
        var teacher = CreateValid();

        var result = teacher.Deactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        teacher.IsActive.ShouldBeFalse();
    }

    [Fact]
    public void Deactivate_AlreadyInactive_ReturnsError()
    {
        var teacher = CreateValid();
        teacher.Deactivate(Clock);

        var result = teacher.Deactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.AlreadyInactive);
    }

    [Fact]
    public void Reactivate_Inactive_SetsActive()
    {
        var teacher = CreateValid();
        teacher.Deactivate(Clock);

        var result = teacher.Reactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        teacher.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void Reactivate_AlreadyActive_ReturnsError()
    {
        var teacher = CreateValid();

        var result = teacher.Reactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherErrors.AlreadyActive);
    }
}
