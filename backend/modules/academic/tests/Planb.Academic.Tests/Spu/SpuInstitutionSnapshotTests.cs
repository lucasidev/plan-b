using Planb.Academic.Infrastructure.Spu;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Spu;

public sealed class SpuInstitutionSnapshotTests
{
    [Fact]
    public void Snapshot_SeparatesNationalAndProvincialCordoba_AndDoesNotAttributeNationalUtnToRegional()
    {
        var rows = SpuInstitutionSnapshot.Load();
        rows.Count.ShouldBe(125);
        rows.Single(r => r.Institution == "Universidad Nacional de Córdoba").SourceName.ShouldBe("Córdoba");
        rows.Single(r => r.Institution == "Universidad Provincial de Córdoba").SourceName.ShouldBe("Provincial de Córdoba");
        rows.ShouldNotContain(r => r.Institution.Contains("Regional", StringComparison.Ordinal));
        rows.Single(r => r.Institution == "Universidad de Buenos Aires").Students.ShouldBe(347280);
        rows.Single(r => r.Institution == "Universidad del Norte Santo Tomás de Aquino").Graduates.ShouldBe(401);
        rows.ShouldNotContain(r => r.Institution == "Universidad Nacional Madres de Plaza de Mayo");
    }

    [Fact]
    public void ReadTable_DistinguishesMissingFromZero_AndHomonymsFromDifferentGroups()
    {
        using var input = new StringReader("nombre_corto|_2022\nTotal Universidades Privadas|1\nGran Rosario|0\nTotal Institutos Universitarios Privados|1\nGran Rosario|\n");
        var rows = SpuInstitutionSnapshot.ReadTable(input);
        rows["Total Universidades Privadas/Gran Rosario"].ShouldBe(0);
        rows["Total Institutos Universitarios Privados/Gran Rosario"].ShouldBeNull();
    }

    [Theory]
    [InlineData("nombre_corto|_2023\n")]
    [InlineData("nombre_corto|_2022\nTotal Instituciones Estatales|1\nUBA|oops\n")]
    [InlineData("nombre_corto|_2022\nTotal Instituciones Estatales|1\nUBA\n")]
    [InlineData("nombre_corto|_2022\nTotal Instituciones Estatales|1\nUBA|1\nUBA|2\n")]
    public void ReadTable_RejectsInvalidSource(string csv)
    {
        using var input = new StringReader(csv);
        Should.Throw<InvalidDataException>(() => SpuInstitutionSnapshot.ReadTable(input));
    }
}
