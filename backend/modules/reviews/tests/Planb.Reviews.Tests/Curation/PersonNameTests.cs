using Planb.Reviews.Domain.Curation;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Curation;

/// <summary>
/// Domain unit tests de <see cref="PersonName.IsNamedIn"/>: la regla de detección de ADR-0084 que
/// decide si una nota editorial nombra a alguien del catálogo de docentes.
/// </summary>
public class PersonNameTests
{
    private static readonly PersonName Perez = new("Martín", "Pérez");
    private static readonly PersonName Campos = new("Alguien", "Campos");
    private static readonly PersonName DeLaFuente = new("Alguien", "De la Fuente");
    private static readonly PersonName RosaCampos = new("Rosa", "Campos");

    [Fact]
    public void IsNamedIn_LastNameAlone_ReturnsTrue()
    {
        Perez.IsNamedIn("La cátedra Pérez no responde nunca.").ShouldBeTrue();
    }

    [Fact]
    public void IsNamedIn_FirstAndLastNameTogether_ReturnsTrue()
    {
        Perez.IsNamedIn("La cátedra de Martín Pérez no responde nunca.").ShouldBeTrue();
    }

    /// <summary>El nombre de pila en minúscula no impide encontrar el apellido.</summary>
    [Fact]
    public void IsNamedIn_LastNameAloneWithLowercaseFirstNameNearby_ReturnsTrue()
    {
        Perez.IsNamedIn("martín Pérez faltó.").ShouldBeTrue();
    }

    [Fact]
    public void IsNamedIn_LastNameWithoutAccent_ReturnsTrue()
    {
        Perez.IsNamedIn("La cátedra Perez no responde nunca.").ShouldBeTrue();
    }

    [Fact]
    public void IsNamedIn_LastNameAllUppercase_ReturnsTrue()
    {
        Perez.IsNamedIn("LA CÁTEDRA DE PÉREZ NO RESPONDE.").ShouldBeTrue();
    }

    [Fact]
    public void IsNamedIn_LowercaseDoesNotMatch_ReturnsFalse()
    {
        Perez.IsNamedIn("che, perez nunca responde.").ShouldBeFalse();
    }

    /// <summary>Un apellido que también es palabra común no dispara si el texto la usa en minúscula.</summary>
    [Fact]
    public void IsNamedIn_CommonWordLastNameInLowercase_ReturnsFalse()
    {
        Campos.IsNamedIn("Se perdieron los campos de la planilla.").ShouldBeFalse();
    }

    [Fact]
    public void IsNamedIn_CommonWordLastNameCapitalized_ReturnsTrue()
    {
        Campos.IsNamedIn("Se quejaron de Campos en la reunión.").ShouldBeTrue();
    }

    [Fact]
    public void IsNamedIn_PartialWordMatch_ReturnsFalse()
    {
        Perez.IsNamedIn("Qué Pereza da cursar esta materia.").ShouldBeFalse();
    }

    /// <summary>El apellido puede ser de más de una palabra: las tres cuentan como una secuencia.</summary>
    [Fact]
    public void IsNamedIn_CompoundLastName_ReturnsTrue()
    {
        DeLaFuente.IsNamedIn("Che, De La Fuente no contesta nunca.").ShouldBeTrue();
    }

    /// <summary>
    /// La prosa suele llevar las partículas del apellido en minúscula; solo la última palabra
    /// ("Fuente") tiene que arrancar con mayúscula.
    /// </summary>
    [Fact]
    public void IsNamedIn_CompoundLastNameWithLowercaseParticles_ReturnsTrue()
    {
        DeLaFuente.IsNamedIn("la cátedra de la Fuente no contesta.").ShouldBeTrue();
    }

    /// <summary>Si la última palabra del apellido ("Fuente") va en minúscula, no dispara.</summary>
    [Fact]
    public void IsNamedIn_CompoundLastNameWithLowercaseLastWord_ReturnsFalse()
    {
        DeLaFuente.IsNamedIn("la cátedra de la fuente no contesta.").ShouldBeFalse();
    }

    [Fact]
    public void IsNamedIn_CompoundLastNameIncompleteAndLowercase_ReturnsFalse()
    {
        DeLaFuente.IsNamedIn("che, la fuente no contesta nunca.").ShouldBeFalse();
    }

    /// <summary>Las palabras del apellido en otro orden nunca forman la secuencia buscada.</summary>
    [Fact]
    public void IsNamedIn_CompoundLastNameWordsInUnrelatedPhrase_ReturnsFalse()
    {
        DeLaFuente.IsNamedIn("la fuente de agua").ShouldBeFalse();
    }

    [Fact]
    public void IsNamedIn_TextWithoutNames_ReturnsFalse()
    {
        Perez.IsNamedIn("La cátedra no responde nunca.").ShouldBeFalse();
    }

    // ── Apellido sin letras ──────────────────────────────────────────────

    /// <summary>
    /// Un apellido cargado sin ninguna letra (ej. "-", ".") tokeniza a una lista vacía; sin esta
    /// guarda, ContainsAsWholeWords con nameWords vacío matchea cualquier texto.
    /// </summary>
    [Fact]
    public void IsNamedIn_LastNameWithNoLetters_ReturnsFalse()
    {
        var noLetters = new PersonName("Juan", "-");

        noLetters.IsNamedIn("Juan faltó a clase").ShouldBeFalse();
    }

    // ── Nombre y apellido seguidos: sin la ambigüedad del apellido solo ───

    /// <summary>
    /// A diferencia del apellido solo, la secuencia nombre+apellido no es ambigua con una palabra
    /// común: no exige mayúscula en ninguna de las dos palabras.
    /// </summary>
    [Fact]
    public void IsNamedIn_FirstAndLastNameTogetherWithLowercaseLastName_ReturnsTrue()
    {
        Perez.IsNamedIn("La cátedra de Martín perez no responde.").ShouldBeTrue();
    }

    [Fact]
    public void IsNamedIn_CommonWordLastNameAloneInLowercase_ReturnsFalse()
    {
        RosaCampos.IsNamedIn("los campos").ShouldBeFalse();
    }

    [Fact]
    public void IsNamedIn_CommonWordFirstAndLastNameTogetherInLowercase_ReturnsTrue()
    {
        RosaCampos.IsNamedIn("rosa campos").ShouldBeTrue();
    }

    // ── Unicode descompuesto (NFD) ─────────────────────────────────────────

    /// <summary>
    /// "Pérez" con el acento como marca combinante separada (NFD) no puede partirse en dos
    /// palabras: quitar diacríticos corre antes de tokenizar, no al revés.
    /// </summary>
    [Fact]
    public void IsNamedIn_LastNameInDecomposedUnicodeForm_ReturnsTrue()
    {
        // El \u0301 es el acento combinante suelto (forma NFD): pegado a la letra anterior
        // arma la misma letra que "Perez" ya trae precompuesta en un solo caracter (forma NFC).
        var text = "La catedra de Martin Pe\u0301rez no responde.";

        Perez.IsNamedIn(text).ShouldBeTrue();
    }
}
