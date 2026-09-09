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
    private const string ValidAddress = "Av. Perón 2085 - Yerba Buena - Tucumán";

    private static AcademicUnit CreateValid() =>
        AcademicUnit.Create(Unsta, "Facultad de Ingeniería", "facultad-de-ingenieria", ValidAddress, Clock).Value;

    // -------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------

    [Fact]
    public void Create_HappyPath_NormalizesSlugAndStartsActive()
    {
        var result = AcademicUnit.Create(
            Unsta, "  Facultad de Ingeniería  ", "  FACULTAD-DE-INGENIERIA  ", "  " + ValidAddress + "  ", Clock);

        result.IsSuccess.ShouldBeTrue();
        var unit = result.Value;
        unit.UniversityId.ShouldBe(Unsta);
        unit.Name.ShouldBe("Facultad de Ingeniería"); // trim, preserva casing del nombre
        unit.Slug.ShouldBe("facultad-de-ingenieria"); // trim + lowercase
        unit.Address.ShouldBe(ValidAddress); // trim, sin normalizar el contenido (es la evidencia)
        unit.LocalityId.ShouldBeNull(); // sin resolver hasta que corra el resolvedor de Georef
        unit.LocalityName.ShouldBeNull();
        unit.IsActive.ShouldBeTrue();
        unit.CreatedAt.ShouldBe(Clock.UtcNow);
        unit.UpdatedAt.ShouldBe(Clock.UtcNow);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankName_ReturnsError(string name)
    {
        var result = AcademicUnit.Create(Unsta, name, "facultad-de-ingenieria", ValidAddress, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.NameRequired);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankSlug_ReturnsError(string slug)
    {
        var result = AcademicUnit.Create(Unsta, "Facultad de Ingeniería", slug, ValidAddress, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.SlugRequired);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankAddress_ReturnsError(string address)
    {
        var result = AcademicUnit.Create(Unsta, "Facultad de Ingeniería", "facultad-de-ingenieria", address, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.AddressRequired);
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
    // ResolveLocality (tarea 19): el resolvedor de Georef corre al sembrar, separado de Create.
    // -------------------------------------------------------------------

    [Fact]
    public void ResolveLocality_Valid_SetsIdAndNameAndBumpsUpdatedAt()
    {
        var unit = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = unit.ResolveLocality("90084010", "San Miguel de Tucumán", later);

        result.IsSuccess.ShouldBeTrue();
        unit.LocalityId.ShouldBe("90084010");
        unit.LocalityName.ShouldBe("San Miguel de Tucumán");
        unit.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void ResolveLocality_BlankName_ReturnsErrorAndLeavesLocalityUnresolved()
    {
        var unit = CreateValid();

        var result = unit.ResolveLocality("90084010", "", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AcademicUnitErrors.LocalityRequired);
        unit.LocalityId.ShouldBeNull();
        unit.LocalityName.ShouldBeNull();
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
