using System.Text;
using System.Text.RegularExpressions;
using Planb.Academic.Infrastructure.Seeding;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Seeding;

/// <summary>
/// Guarda de regresión del duplicado que rompía Dónde estudiarla (R6, tarea 5): la misma oferta
/// real cargada dos veces para la misma (universidad, unidad académica), una vez con el sufijo de
/// género ("Licenciado/a en Enfermería") y otra sin él ("Licenciado en Enfermería"). No detecta
/// variantes de raíz distinta ("Ingeniería en Computación" contra "Ingeniero/a en Computación",
/// el caso que originó esta tarea): esa comparación exige criterio humano, no normalización.
/// </summary>
public class AcademicSeedDataTests
{
    [Fact]
    public void Careers_NoTwoOfferingsShareUniversityAcademicUnitAndNormalizedName()
    {
        var duplicates = AcademicSeedData.Careers
            .GroupBy(seed => (
                seed.Career.UniversityId,
                seed.Career.AcademicUnitId,
                Normalize(seed.Career.Name)))
            .Where(group => group.Count() > 1)
            .Select(group => group.Select(seed => seed.Career.Name))
            .ToList();

        duplicates.ShouldBeEmpty();
    }

    private static string Normalize(string name)
    {
        var withoutGenderSuffix = Regex.Replace(name, "/[a-z]+", string.Empty, RegexOptions.IgnoreCase);
        var decomposed = withoutGenderSuffix.Normalize(NormalizationForm.FormD);
        var withoutAccents = new string(decomposed
            .Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
                != System.Globalization.UnicodeCategory.NonSpacingMark)
            .ToArray());

        return Regex.Replace(withoutAccents.ToLowerInvariant(), "[^a-z0-9 ]", string.Empty)
            .Trim();
    }
}
