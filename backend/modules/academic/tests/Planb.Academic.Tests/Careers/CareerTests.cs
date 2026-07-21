using Planb.Academic.Domain;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Careers;

public class CareerTests
{
    private static readonly UniversityId AnyUniversity = UniversityId.New();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    [Fact]
    public void Create_HappyPath_NormalizesAndStartsActive()
    {
        var result = Career.Create(
            AnyUniversity, "  Ingeniería en Sistemas  ", "  ING-SIS  ", Clock,
            shortName: "  Ing. Sistemas  ", code: "  ISI  ");

        result.IsSuccess.ShouldBeTrue();
        var career = result.Value;
        career.Name.ShouldBe("Ingeniería en Sistemas");
        career.Slug.ShouldBe("ing-sis");
        career.ShortName.ShouldBe("Ing. Sistemas");
        career.Code.ShouldBe("ISI");
        career.IsActive.ShouldBeTrue();
        career.IsOfficial.ShouldBeTrue();
        career.CreatedAt.ShouldBe(Clock.UtcNow);
        career.UpdatedAt.ShouldBe(Clock.UtcNow);
    }

    [Fact]
    public void Create_BlankOptionalFields_StoredAsNull()
    {
        var result = Career.Create(
            AnyUniversity, "Carrera", "carrera", Clock, shortName: "   ", code: "");

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShortName.ShouldBeNull();
        result.Value.Code.ShouldBeNull();
    }

    [Fact]
    public void Create_CrowdsourcedDefault_IsNotOfficialButActive()
    {
        var result = Career.Create(AnyUniversity, "Carrera", "carrera", Clock, isOfficial: false);

        result.IsSuccess.ShouldBeTrue();
        result.Value.IsOfficial.ShouldBeFalse();
        result.Value.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void Create_BlankName_ReturnsNameRequired()
    {
        var result = Career.Create(AnyUniversity, "   ", "slug", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.NameRequired);
    }

    [Fact]
    public void Create_BlankSlug_ReturnsSlugRequired()
    {
        var result = Career.Create(AnyUniversity, "Name", "  ", Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.SlugRequired);
    }

    [Fact]
    public void Update_HappyPath_ReplacesFieldsAndBumpsUpdatedAt()
    {
        var career = Career.Create(AnyUniversity, "Old", "old", Clock).Value;
        var laterClock = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = career.Update(
            "  New Name  ", "  NEW-SLUG  ", "Short", "COD",
            CareerDegreeType.Grado, 5, TermKind.FourMonth, "  Descripción  ",
            laterClock);

        result.IsSuccess.ShouldBeTrue();
        career.Name.ShouldBe("New Name");
        career.Slug.ShouldBe("new-slug");
        career.ShortName.ShouldBe("Short");
        career.Code.ShouldBe("COD");
        career.DegreeType.ShouldBe(CareerDegreeType.Grado);
        career.DurationYears.ShouldBe(5);
        career.Cadence.ShouldBe(TermKind.FourMonth);
        career.Description.ShouldBe("Descripción");
        career.UpdatedAt.ShouldBe(laterClock.UtcNow);
    }

    [Fact]
    public void Update_ClearsOptionalFields_WhenBlank()
    {
        var career = Career.Create(
            AnyUniversity, "Name", "slug", Clock, shortName: "Short", code: "COD").Value;

        career.Update("Name", "slug", shortName: null, code: "   ", null, null, null, null, Clock);

        career.ShortName.ShouldBeNull();
        career.Code.ShouldBeNull();
    }

    [Fact]
    public void Update_BlankName_ReturnsNameRequired()
    {
        var career = Career.Create(AnyUniversity, "Name", "slug", Clock).Value;

        var result = career.Update("  ", "slug", null, null, null, null, null, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.NameRequired);
    }

    [Fact]
    public void Deactivate_WhenActive_SetsInactive()
    {
        var career = Career.Create(AnyUniversity, "Name", "slug", Clock).Value;

        var result = career.Deactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        career.IsActive.ShouldBeFalse();
    }

    [Fact]
    public void Deactivate_WhenAlreadyInactive_ReturnsAlreadyInactive()
    {
        var career = Career.Create(AnyUniversity, "Name", "slug", Clock).Value;
        career.Deactivate(Clock);

        var result = career.Deactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.AlreadyInactive);
    }

    [Fact]
    public void Reactivate_WhenInactive_SetsActive()
    {
        var career = Career.Create(AnyUniversity, "Name", "slug", Clock).Value;
        career.Deactivate(Clock);

        var result = career.Reactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        career.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void Reactivate_WhenAlreadyActive_ReturnsAlreadyActive()
    {
        var career = Career.Create(AnyUniversity, "Name", "slug", Clock).Value;

        var result = career.Reactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CareerErrors.AlreadyActive);
    }
}
