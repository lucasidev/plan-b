using Planb.Academic.Application.Contracts;
using Planb.Enrollments.Application.Services.HistorialParser;
using Planb.Enrollments.Domain.HistorialImports;
using Shouldly;
using Xunit;

namespace Planb.Enrollments.Tests.HistorialImports;

/// <summary>
/// Unit tests del parser heurístico (US-014). El parser es puro (sin DB/network), así que
/// estos tests son rápidos y exhaustivos. Cubren los casos típicos del PDF SIU + el flow
/// de texto pegado.
/// </summary>
public class HistorialParserTests
{
    private static readonly Guid MatId = Guid.Parse("11111111-0000-4000-a000-000000000001");
    private static readonly Guid AlgId = Guid.Parse("11111111-0000-4000-a000-000000000002");
    private static readonly Guid IswId = Guid.Parse("11111111-0000-4000-a000-000000000003");
    private static readonly Guid PlanId = Guid.Parse("22222222-0000-4000-a000-000000000001");
    private static readonly Guid UniId = Guid.Parse("33333333-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_1cId = Guid.Parse("44444444-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_2cId = Guid.Parse("44444444-0000-4000-a000-000000000002");

    private readonly HistorialParser _parser = new();

    private static HistorialParserInputs DefaultInputs()
    {
        var subjects = new[]
        {
            new SubjectListItem(MatId, PlanId, "MAT101", "Análisis Matemático I", 1, 1, "FirstHalf"),
            new SubjectListItem(AlgId, PlanId, "ALG101", "Álgebra I", 1, 1, "FirstHalf"),
            new SubjectListItem(IswId, PlanId, "ISW301", "Ingeniería de Software", 3, 1, "FirstHalf"),
        };
        var terms = new[]
        {
            new AcademicTermListItem(Term2024_1cId, UniId, 2024, 1, "FirstHalf", "2024·1c"),
            new AcademicTermListItem(Term2024_2cId, UniId, 2024, 2, "SecondHalf", "2024·2c"),
        };

        var byCode = subjects.ToDictionary(s => s.Code, StringComparer.OrdinalIgnoreCase);
        return new HistorialParserInputs(byCode, terms);
    }

    // ── Happy paths ──────────────────────────────────────────────────────

    [Fact]
    public void Parse_LineaTipicaSIU_DetectaCodigoNotaStatus()
    {
        // Formato típico SIU: código + nombre + nota + status + método + período.
        // Necesitamos los 4 fields (grade + status + method + period) para High.
        var text = "MAT101  Análisis Matemático I  8.5  Aprobada  Cursada  2024 1c";
        var payload = _parser.Parse(text, DefaultInputs());

        payload.Items.ShouldNotBeEmpty();
        var item = payload.Items.First(i => i.DetectedCode == "MAT101");
        item.SubjectId.ShouldBe(MatId);
        item.SubjectName.ShouldBe("Análisis Matemático I");
        item.DetectedGrade.ShouldBe(8.5m);
        item.DetectedStatus.ShouldBe("Aprobada");
        item.Confidence.ShouldBe(ParseConfidence.High);
    }

    [Fact]
    public void Parse_LineaSIUSinMetodo_QuedaEnMediumConfidence()
    {
        // 3 fields detectados (grade + status + period). Sin approvalMethod queda en Medium.
        var text = "MAT101  Análisis Matemático I  8.5  Aprobada  2024 1c";
        var payload = _parser.Parse(text, DefaultInputs());

        var item = payload.Items.First(i => i.DetectedCode == "MAT101");
        item.Confidence.ShouldBe(ParseConfidence.Medium);
    }

    [Fact]
    public void Parse_TresMaterias_GeneraTresItemsResueltos()
    {
        var text = @"
MAT101  Análisis Matemático I  9  Aprobada  Cursada  2024 1c
ALG101  Álgebra I  7.5  Aprobada  Final  2024 1c
ISW301  Ingeniería de Software  Regular  6  2024 2c
";
        var payload = _parser.Parse(text, DefaultInputs());

        payload.Items.Count(i => i.SubjectId is not null).ShouldBe(3);
        payload.Summary.TotalDetected.ShouldBe(payload.Items.Count);
        payload.Summary.HighConfidence.ShouldBeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public void Parse_CodigoConGuion_LoNormaliza()
    {
        // El SIU a veces imprime ALG-101 con guión; el regex acepta ambos shapes.
        var text = "ALG-101  Álgebra I  8  Aprobada";
        var payload = _parser.Parse(text, DefaultInputs());

        payload.Items.ShouldContain(i => i.SubjectId == AlgId);
    }

    [Fact]
    public void Parse_NotaConComaDecimal_LaParsea()
    {
        var text = "MAT101  Análisis  7,75  Aprobada";
        var payload = _parser.Parse(text, DefaultInputs());

        var item = payload.Items.First(i => i.DetectedCode == "MAT101");
        item.DetectedGrade.ShouldBe(7.75m);
    }

    [Fact]
    public void Parse_StatusReprobada_LoDetecta()
    {
        var text = "MAT101  Análisis  4  Reprobada";
        var payload = _parser.Parse(text, DefaultInputs());

        var item = payload.Items.First(i => i.DetectedCode == "MAT101");
        item.DetectedStatus.ShouldBe("Reprobada");
    }

    [Fact]
    public void Parse_MetodoEquivalencia_LoDetecta()
    {
        var text = "ALG101  Álgebra  7  Aprobada  Equivalencia";
        var payload = _parser.Parse(text, DefaultInputs());

        var item = payload.Items.First(i => i.DetectedCode == "ALG101");
        item.DetectedApprovalMethod.ShouldBe("Equivalencia");
    }

    [Fact]
    public void Parse_Periodo_DetectaYearYNumeroCuatri()
    {
        var text = "MAT101  Análisis  8  Aprobada  2024 1c";
        var payload = _parser.Parse(text, DefaultInputs());

        var item = payload.Items.First(i => i.DetectedCode == "MAT101");
        item.DetectedYear.ShouldBe(2024);
        item.DetectedTermNumber.ShouldBe(1);
        item.TermId.ShouldBe(Term2024_1cId);
    }

    // ── Edge cases ───────────────────────────────────────────────────────

    [Fact]
    public void Parse_CodigoQueNoExisteEnPlan_LoSaltea()
    {
        // Decisión de diseño del parser: si el código no matchea el plan del student, no
        // inventamos materias — el item ni siquiera entra al payload. El alumno carga manual
        // si la materia faltante es legítima (US-013).
        var text = "ZZZ999  Materia Inexistente  8  Aprobada";
        var payload = _parser.Parse(text, DefaultInputs());

        payload.Items.ShouldNotContain(i => i.DetectedCode == "ZZZ999");
    }

    [Fact]
    public void Parse_TextoVacio_DevuelvePayloadVacio()
    {
        var payload = _parser.Parse(string.Empty, DefaultInputs());

        payload.Items.ShouldBeEmpty();
        payload.Summary.TotalDetected.ShouldBe(0);
    }

    [Fact]
    public void Parse_TextoSinCodigos_DevuelvePayloadVacio()
    {
        var text = "Esto es un texto sin códigos de materia válidos. Solo prosa.";
        var payload = _parser.Parse(text, DefaultInputs());

        payload.Items.ShouldBeEmpty();
    }

    [Fact]
    public void Parse_LineaSoloConCodigo_QuedaEnLowConfidence()
    {
        var text = "ISW301";
        var payload = _parser.Parse(text, DefaultInputs());

        var item = payload.Items.FirstOrDefault(i => i.DetectedCode == "ISW301");
        item.ShouldNotBeNull();
        item.Confidence.ShouldBe(ParseConfidence.Low);
    }

    [Fact]
    public void Parse_NotaDecimal10_NoConfundeConDosCifras()
    {
        // Garantiza que "10" se parsea como nota completa, no como "1" + "0".
        var text = "MAT101  Análisis  10  Aprobada  Promocion";
        var payload = _parser.Parse(text, DefaultInputs());

        var item = payload.Items.First(i => i.DetectedCode == "MAT101");
        item.DetectedGrade.ShouldBe(10m);
    }

    [Fact]
    public void Parse_MultiplesLineas_RespetaOrden()
    {
        var text = @"
MAT101 8 Aprobada
ALG101 7 Aprobada
ISW301 6 Regular
";
        var payload = _parser.Parse(text, DefaultInputs());

        var codes = payload.Items
            .Where(i => !string.IsNullOrEmpty(i.DetectedCode))
            .Select(i => i.DetectedCode)
            .ToList();
        codes.IndexOf("MAT101").ShouldBeLessThan(codes.IndexOf("ALG101"));
        codes.IndexOf("ALG101").ShouldBeLessThan(codes.IndexOf("ISW301"));
    }

    [Fact]
    public void Parse_NoLanzaExcepcionAnteInputCorrupto()
    {
        // Garantía explícita del comentario del parser: nunca tira. Lo peor que devuelve es
        // un payload con items vacíos o en Low.
        var weirdInputs = new[]
        {
            "\0\0\0\0",
            "███████████",
            new string('A', 10_000),
            "\n\n\n\n",
        };

        foreach (var input in weirdInputs)
        {
            Should.NotThrow(() => _parser.Parse(input, DefaultInputs()));
        }
    }
}
