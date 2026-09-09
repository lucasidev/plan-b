using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.Universities;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.AcademicUnits;

public class AcademicUnitTests
{
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    private static readonly UniversityId Unsta = new(Guid.NewGuid());

    private static AcademicUnit CreateValid() =>
        AcademicUnit.Create(Unsta, "Facultad de Ingeniería", "facultad-de-ingenieria", Clock).Value;

    // -------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------

    [Fact]
    public void Create_HappyPath_NormalizesSlugAndStartsActive()
    {
        var result = AcademicUnit.Create(Unsta, "  Facultad de Ingeniería  ", "  FACULTAD-DE-INGENIERIA  ", Clock);

        result.IsSuccess.ShouldBeTrue();
        var unit = result.Value;
        unit.UniversityId.ShouldBe(Unsta);
        unit.Name.ShouldBe("Facultad de Ingeniería"); // trim, preserva casing del nombre
        unit.Slug.ShouldBe("facultad-de-ingenieria"); // trim + lowercase
        unit.IsActive.ShouldBeTrue();
        unit.CreatedAt.ShouldBe(Clock.UtcNow);
        unit.UpdatedAt.ShouldBe(Clock.UtcNow);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankName_ReturnsError(string name)
    {
        var result = AcademicUnit.Create(Unsta, name, "facultad-de-ingenieria", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.NameRequired);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankSlug_ReturnsError(string slug)
    {
        var result = AcademicUnit.Create(Unsta, "Facultad de Ingeniería", slug, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.SlugRequired);
    }

    // -------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------

    [Fact]
    public void Update_Valid_ReplacesFieldsNormalizesAndBumpsUpdatedAt()
    {
        var unit = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = unit.Update("Facultad de Ciencias Exactas", "FACET", later);

        result.IsSuccess.ShouldBeTrue();
        unit.Name.ShouldBe("Facultad de Ciencias Exactas");
        unit.Slug.ShouldBe("facet");
        unit.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Update_BlankName_ReturnsErrorAndLeavesFieldsUnchanged()
    {
        var unit = CreateValid();

        var result = unit.Update("", "facultad-de-ingenieria", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.NameRequired);
        unit.Name.ShouldBe("Facultad de Ingeniería");
    }

    [Fact]
    public void Update_BlankSlug_ReturnsErrorAndLeavesFieldsUnchanged()
    {
        var unit = CreateValid();

        var result = unit.Update("Facultad de Ingeniería", "", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.SlugRequired);
        unit.Slug.ShouldBe("facultad-de-ingenieria");
    }

    // -------------------------------------------------------------------
    // Deactivate / Reactivate (soft delete, idempotencia explícita)
    // -------------------------------------------------------------------

    [Fact]
    public void Deactivate_Active_SetsInactive()
    {
        var unit = CreateValid();

        var result = unit.Deactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        unit.IsActive.ShouldBeFalse();
    }

    [Fact]
    public void Deactivate_AlreadyInactive_ReturnsError()
    {
        var unit = CreateValid();
        unit.Deactivate(Clock);

        var result = unit.Deactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.AlreadyInactive);
    }

    [Fact]
    public void Reactivate_Inactive_SetsActive()
    {
        var unit = CreateValid();
        unit.Deactivate(Clock);

        var result = unit.Reactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        unit.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void Reactivate_AlreadyActive_ReturnsError()
    {
        var unit = CreateValid();

        var result = unit.Reactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.AlreadyActive);
    }
}
