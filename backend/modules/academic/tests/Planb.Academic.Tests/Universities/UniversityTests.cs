using Planb.Academic.Domain.Universities;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Universities;

public class UniversityTests
{
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    private static University CreateValid() =>
        University.Create(
            "Universidad del Norte Santo Tomás de Aquino", "unsta", ["unsta.edu.ar"], Clock).Value;

    // -------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------

    [Fact]
    public void Create_HappyPath_NormalizesSlugAndDomainsAndStartsActive()
    {
        var result = University.Create(
            "  UNSTA  ", "  UNSTA  ", ["UNSTA.edu.ar", "unsta.edu.ar", "  "], Clock);

        result.IsSuccess.ShouldBeTrue();
        var university = result.Value;
        university.Name.ShouldBe("UNSTA");           // trim, preserva casing del nombre
        university.Slug.ShouldBe("unsta");            // trim + lowercase
        university.InstitutionalEmailDomains.ShouldBe(["unsta.edu.ar"]); // normalizado + dedup
        university.IsActive.ShouldBeTrue();
        university.CreatedAt.ShouldBe(Clock.UtcNow);
        university.UpdatedAt.ShouldBe(Clock.UtcNow);
    }

    [Fact]
    public void Create_NullDomains_StoredAsEmpty()
    {
        var university = University.Create("UNSTA", "unsta", null, Clock).Value;

        university.InstitutionalEmailDomains.ShouldBeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankName_ReturnsError(string name)
    {
        var result = University.Create(name, "unsta", null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UniversityErrors.NameRequired);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankSlug_ReturnsError(string slug)
    {
        var result = University.Create("UNSTA", slug, null, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UniversityErrors.SlugRequired);
    }

    // -------------------------------------------------------------------
    // Update (replace del form completo: re-valida + re-normaliza domains)
    // -------------------------------------------------------------------

    [Fact]
    public void Update_Valid_ReplacesFieldsNormalizesAndBumpsUpdatedAt()
    {
        var university = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = university.Update(
            "Universidad Siglo 21", "SIGLO21", ["UES21.edu.ar"], later);

        result.IsSuccess.ShouldBeTrue();
        university.Name.ShouldBe("Universidad Siglo 21");
        university.Slug.ShouldBe("siglo21");
        university.InstitutionalEmailDomains.ShouldBe(["ues21.edu.ar"]);
        university.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Update_BlankName_ReturnsErrorAndLeavesFieldsUnchanged()
    {
        var university = CreateValid();

        var result = university.Update("", "unsta", ["unsta.edu.ar"], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UniversityErrors.NameRequired);
        university.Name.ShouldBe("Universidad del Norte Santo Tomás de Aquino");
    }

    [Fact]
    public void Update_BlankSlug_ReturnsErrorAndLeavesFieldsUnchanged()
    {
        var university = CreateValid();

        var result = university.Update("UNSTA", "", ["unsta.edu.ar"], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UniversityErrors.SlugRequired);
        university.Slug.ShouldBe("unsta");
    }

    [Fact]
    public void Update_NullDomains_ClearsToEmpty()
    {
        var university = CreateValid(); // domains: ["unsta.edu.ar"]

        var result = university.Update("UNSTA", "unsta", null, Clock);

        result.IsSuccess.ShouldBeTrue();
        university.InstitutionalEmailDomains.ShouldBeEmpty();
    }

    // -------------------------------------------------------------------
    // Deactivate / Reactivate (soft delete, idempotencia explícita)
    // -------------------------------------------------------------------

    [Fact]
    public void Deactivate_Active_SetsInactive()
    {
        var university = CreateValid();

        var result = university.Deactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        university.IsActive.ShouldBeFalse();
    }

    [Fact]
    public void Deactivate_AlreadyInactive_ReturnsError()
    {
        var university = CreateValid();
        university.Deactivate(Clock);

        var result = university.Deactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UniversityErrors.AlreadyInactive);
    }

    [Fact]
    public void Reactivate_Inactive_SetsActive()
    {
        var university = CreateValid();
        university.Deactivate(Clock);

        var result = university.Reactivate(Clock);

        result.IsSuccess.ShouldBeTrue();
        university.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void Reactivate_AlreadyActive_ReturnsError()
    {
        var university = CreateValid();

        var result = university.Reactivate(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UniversityErrors.AlreadyActive);
    }
}
