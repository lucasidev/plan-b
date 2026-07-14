using Planb.Academic.Application.Services.CareerPlanParser;
using Planb.Academic.Domain.CareerPlanImports;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.CareerPlanImports;

/// <summary>
/// Unit tests del parser heurístico de planes de estudio (US-088, <see cref="CareerPlanParser"/>).
/// Puro (sin DB/network), así que cubrimos exhaustivamente los formatos de encabezado + el
/// scoring de confidence.
/// </summary>
public class CareerPlanParserTests
{
    private readonly CareerPlanParser _parser = new();

    [Theory]
    [InlineData("Primer año\nMAT101 Analisis I", 1)]
    [InlineData("año 2\nMAT101 Analisis I", 2)]
    [InlineData("1° año\nMAT101 Analisis I", 1)]
    [InlineData("1er año\nMAT101 Analisis I", 1)]
    public void Parse_YearHeaderVariants_AttributesDetectedYearInPlanToSubject(string text, int expectedYear)
    {
        var payload = _parser.Parse(text);

        payload.Items.ShouldHaveSingleItem();
        payload.Items[0].DetectedYearInPlan.ShouldBe(expectedYear);
    }

    [Theory]
    [InlineData("Segundo cuatrimestre\nMAT101 Analisis I", 2)]
    [InlineData("2do cuatrimestre\nMAT101 Analisis I", 2)]
    [InlineData("1c\nMAT101 Analisis I", 1)]
    [InlineData("2c\nMAT101 Analisis I", 2)]
    public void Parse_TermHeaderVariants_AttributesDetectedTermInYearToSubject(string text, int expectedTerm)
    {
        var payload = _parser.Parse(text);

        payload.Items.ShouldHaveSingleItem();
        payload.Items[0].DetectedTermInYear.ShouldBe(expectedTerm);
    }

    [Fact]
    public void Parse_AnualKeywordOnSubjectLine_SetsTermKindAnualAndNullTermInYear()
    {
        // La línea de la materia trae el keyword "anual", que prevalece sobre el contexto de
        // cuatrimestre seteado por el header anterior.
        var text = "Primer año\nSegundo cuatrimestre\nMAT101 Analisis I anual";

        var payload = _parser.Parse(text);

        payload.Items.ShouldHaveSingleItem();
        var item = payload.Items[0];
        item.DetectedTermKind.ShouldBe("Anual");
        item.DetectedTermInYear.ShouldBeNull();
        item.DetectedYearInPlan.ShouldBe(1);
    }

    [Fact]
    public void Parse_SubjectLineWithoutYearContext_ReturnsLowConfidenceWithYearIssue()
    {
        var payload = _parser.Parse("MAT101 Analisis I");

        payload.Items.ShouldHaveSingleItem();
        var item = payload.Items[0];
        item.DetectedYearInPlan.ShouldBeNull();
        item.Confidence.ShouldBe(SubjectParseConfidence.Low);
        item.Issues.ShouldContain(i => i.Contains("año", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Parse_TextWithoutAnySubjectCode_ReturnsEmptyItems()
    {
        var payload = _parser.Parse("no hay ningun codigo aca solamente texto libre");

        payload.Items.ShouldBeEmpty();
        payload.Summary.TotalDetected.ShouldBe(0);
        payload.Summary.HighConfidence.ShouldBe(0);
        payload.Summary.MediumConfidence.ShouldBe(0);
        payload.Summary.LowConfidence.ShouldBe(0);
    }

    [Fact]
    public void Parse_BlankRawText_ReturnsEmptyPayloadWithoutThrowing()
    {
        var payload = _parser.Parse("   ");

        payload.Items.ShouldBeEmpty();
        payload.Summary.TotalDetected.ShouldBe(0);
    }

    [Theory]
    // High: header de año presente → year + name + término default-con-issue = 3 campos.
    [InlineData("Primer año\nMAT101 Analisis I", SubjectParseConfidence.High)]
    // Medium: header de cuatrimestre presente, sin año → name + término = 2 campos.
    [InlineData("1er cuatrimestre\nMAT101 Analisis I", SubjectParseConfidence.Medium)]
    // Low: sin ningún header → solo se detecta el nombre = 1 campo.
    [InlineData("MAT101 Analisis I", SubjectParseConfidence.Low)]
    public void Parse_ScoresConfidenceAccordingToDetectedFieldCount(
        string text, SubjectParseConfidence expectedConfidence)
    {
        var payload = _parser.Parse(text);

        payload.Items.ShouldHaveSingleItem();
        payload.Items[0].Confidence.ShouldBe(expectedConfidence);
    }
}
