using Planb.Academic.Domain.OfficialFacts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.OfficialFacts;

public class OfficialFactTests
{
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 9, 7, 12, 0, 0, TimeSpan.Zero));

    private static readonly Guid SubjectId = Guid.NewGuid();
    private static readonly Guid RelievedBy = Guid.NewGuid();
    private static readonly DateTimeOffset SourceRetrievedAt =
        new(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset RelievedAt =
        new(2026, 9, 7, 0, 0, 0, TimeSpan.Zero);

    private static Result<OfficialFact> CreatePublished(
        string? value = "2,5 años",
        string? sourceName = "Sitio UNSTA",
        string? sourceUrl = "https://unsta.edu.ar/ingenieria/tecnicatura",
        DateTimeOffset? sourceRetrievedAt = null,
        DateTimeOffset? relievedAt = null,
        Guid? relievedBy = null,
        IDateTimeProvider? clock = null) =>
        OfficialFact.Create(
            OfficialFactSubjectType.Offering,
            SubjectId,
            OfficialFactField.PaperDuration,
            OfficialFactStatus.Published,
            value,
            unit: "years",
            period: "plan vigente",
            sourceName!,
            sourceUrl!,
            sourceDocument: null,
            sourceRetrievedAt ?? SourceRetrievedAt,
            derivationRuleId: null,
            note: null,
            relievedAt ?? RelievedAt,
            relievedBy ?? RelievedBy,
            clock ?? Clock);

    // -------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------

    [Fact]
    public void Create_HappyPath_Published_NormalizesAndStoresEveryField()
    {
        var result = CreatePublished(
            value: "  2,5 años  ", sourceName: "  Sitio UNSTA  ",
            sourceUrl: "  https://unsta.edu.ar/ingenieria/tecnicatura  ");

        result.IsSuccess.ShouldBeTrue();
        var fact = result.Value;
        fact.SubjectType.ShouldBe(OfficialFactSubjectType.Offering);
        fact.SubjectId.ShouldBe(SubjectId);
        fact.Field.ShouldBe(OfficialFactField.PaperDuration);
        fact.Value.ShouldBe("2,5 años"); // trim
        fact.SourceName.ShouldBe("Sitio UNSTA"); // trim
        fact.SourceUrl.ShouldBe("https://unsta.edu.ar/ingenieria/tecnicatura"); // trim
        fact.Status.ShouldBe(OfficialFactStatus.Published);
        fact.RelievedAt.ShouldBe(RelievedAt);
        fact.RelievedBy.ShouldBe(RelievedBy);
        fact.CreatedAt.ShouldBe(Clock.UtcNow);
    }

    // -------------------------------------------------------------------
    // Sujeto, campo: obligatorios y curados
    // -------------------------------------------------------------------

    [Fact]
    public void Create_EmptySubjectId_ReturnsError()
    {
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, Guid.Empty, OfficialFactField.PaperDuration,
            OfficialFactStatus.Published, "2,5 años", "years", "plan vigente",
            "Sitio UNSTA", "https://unsta.edu.ar", null, SourceRetrievedAt,
            null, null, RelievedAt, RelievedBy, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SubjectRequired);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankField_ReturnsError(string field)
    {
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, field,
            OfficialFactStatus.Published, "2,5 años", "years", "plan vigente",
            "Sitio UNSTA", "https://unsta.edu.ar", null, SourceRetrievedAt,
            null, null, RelievedAt, RelievedBy, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.FieldRequired);
    }

    [Fact]
    public void Create_FieldOutsideCuratedVocabulary_ReturnsError()
    {
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, "cantidad_de_egresados_random",
            OfficialFactStatus.Published, "2,5 años", "years", "plan vigente",
            "Sitio UNSTA", "https://unsta.edu.ar", null, SourceRetrievedAt,
            null, null, RelievedAt, RelievedBy, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.UnknownField);
    }

    // -------------------------------------------------------------------
    // La fuente es obligatoria siempre, incluso NotPublished (ADR-0090)
    // -------------------------------------------------------------------

    [Fact]
    public void Create_WithoutSourceName_ReturnsError()
    {
        var result = CreatePublished(sourceName: "");

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SourceNameRequired);
    }

    [Fact]
    public void Create_WithoutSourceUrl_ReturnsError()
    {
        var result = CreatePublished(sourceUrl: "");

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SourceUrlRequired);
    }

    [Fact]
    public void Create_NotPublished_WithoutSource_StillReturnsSourceError()
    {
        // "Dura en la realidad no está publicada" (relevamiento real): el estado dice que se buscó
        // y no está, pero ahí la fuente es dónde se buscó, y sigue siendo obligatoria.
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, OfficialFactField.RealDuration,
            OfficialFactStatus.NotPublished, value: null, unit: null, period: null,
            sourceName: "", sourceUrl: "", sourceDocument: null, SourceRetrievedAt,
            derivationRuleId: null, note: null, RelievedAt, RelievedBy, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SourceNameRequired);
    }

    [Fact]
    public void Create_NotPublished_WithSourceButNoValue_Succeeds()
    {
        // La fuente dice dónde se buscó (la SPU); no hay valor porque no está publicado.
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, OfficialFactField.RealDuration,
            OfficialFactStatus.NotPublished, value: null, unit: null, period: null,
            sourceName: "SPU, anuarios estadísticos", sourceUrl: "https://spu.gob.ar",
            sourceDocument: null, SourceRetrievedAt,
            derivationRuleId: null, note: "No publica egreso por carrera.",
            RelievedAt, RelievedBy, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Value.ShouldBeNull();
        result.Value.Status.ShouldBe(OfficialFactStatus.NotPublished);
    }

    // -------------------------------------------------------------------
    // Published/Derived exigen valor
    // -------------------------------------------------------------------

    [Fact]
    public void Create_Published_WithoutValue_ReturnsError()
    {
        var result = CreatePublished(value: null);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.ValueRequired);
    }

    // -------------------------------------------------------------------
    // Un Derived cita la regla (ADR-0090)
    // -------------------------------------------------------------------

    [Fact]
    public void Create_Derived_WithoutDerivationRule_ReturnsError()
    {
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, OfficialFactField.CohortGraduation,
            OfficialFactStatus.Derived, value: "21,4 %", unit: "percent", period: "2022",
            sourceName: "Anuario SPU 2022", sourceUrl: "https://spu.gob.ar/anuario-2022",
            sourceDocument: null, SourceRetrievedAt,
            derivationRuleId: null, note: null, RelievedAt, RelievedBy, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.DerivationRuleRequired);
    }

    [Fact]
    public void Create_Derived_WithValueAndRule_Succeeds()
    {
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, OfficialFactField.CohortGraduation,
            OfficialFactStatus.Derived, value: "21,4 %", unit: "percent", period: "2022",
            sourceName: "Anuario SPU 2022", sourceUrl: "https://spu.gob.ar/anuario-2022",
            sourceDocument: null, SourceRetrievedAt,
            derivationRuleId: "graduation-flow-proxy", note: null,
            RelievedAt, RelievedBy, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.DerivationRuleId.ShouldBe("graduation-flow-proxy");
    }

    // -------------------------------------------------------------------
    // NotApplicable exige la razón en Note (ADR-0090)
    // -------------------------------------------------------------------

    [Fact]
    public void Create_NotApplicable_WithoutNote_ReturnsError()
    {
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, OfficialFactField.Accreditation,
            OfficialFactStatus.NotApplicable, value: null, unit: null, period: null,
            sourceName: "CONEAU", sourceUrl: "https://coneau.gob.ar",
            sourceDocument: null, SourceRetrievedAt,
            derivationRuleId: null, note: null, RelievedAt, RelievedBy, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.ReasonRequired);
    }

    [Fact]
    public void Create_NotApplicable_WithNote_Succeeds()
    {
        var result = OfficialFact.Create(
            OfficialFactSubjectType.Offering, SubjectId, OfficialFactField.Accreditation,
            OfficialFactStatus.NotApplicable, value: null, unit: null, period: null,
            sourceName: "CONEAU", sourceUrl: "https://coneau.gob.ar",
            sourceDocument: null, SourceRetrievedAt,
            derivationRuleId: null,
            note: "Las tecnicaturas no se acreditan: el título tiene validez nacional por RM 2495/2018.",
            RelievedAt, RelievedBy, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Note.ShouldNotBeNull();
    }

    // -------------------------------------------------------------------
    // Fechas y autoría del relevamiento
    // -------------------------------------------------------------------

    [Fact]
    public void Create_DefaultSourceRetrievedAt_ReturnsError()
    {
        // sourceRetrievedAt: default(DateTimeOffset), no null: el helper solo cae al default válido
        // cuando el argumento es null (?? SourceRetrievedAt), así que hay que pasar el cero explícito.
        var result = CreatePublished(sourceRetrievedAt: default(DateTimeOffset));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.SourceRetrievedAtRequired);
    }

    [Fact]
    public void Create_DefaultRelievedAt_ReturnsError()
    {
        var result = CreatePublished(relievedAt: default(DateTimeOffset));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.RelievedAtRequired);
    }

    [Fact]
    public void Create_EmptyRelievedBy_ReturnsError()
    {
        var result = CreatePublished(relievedBy: Guid.Empty);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(OfficialFactErrors.RelievedByRequired);
    }

    // -------------------------------------------------------------------
    // Varias afirmaciones conviven para el mismo sujeto y campo (ADR-0090)
    // -------------------------------------------------------------------

    [Fact]
    public void Create_TwoFactsSameSubjectAndField_BothConstructAsIndependentClaims()
    {
        // SIPES y el sitio institucional no cierran (K04 del relevamiento): las dos afirmaciones
        // tienen que poder existir, cada una con su propia fuente. Create no conoce ni rechaza lo
        // que ya existe: no hay ningún estado compartido entre llamadas.
        var fromSipes = CreatePublished(value: "Presencial", sourceName: "SIPES", sourceUrl: "https://sipes.siu.edu.ar");
        var fromSite = CreatePublished(value: "Presencial y a distancia", sourceName: "Sitio UNSTA", sourceUrl: "https://unsta.edu.ar");

        fromSipes.IsSuccess.ShouldBeTrue();
        fromSite.IsSuccess.ShouldBeTrue();
        fromSipes.Value.Id.ShouldNotBe(fromSite.Value.Id);
        fromSipes.Value.SubjectId.ShouldBe(fromSite.Value.SubjectId);
        fromSipes.Value.Field.ShouldBe(fromSite.Value.Field);
        fromSipes.Value.SourceName.ShouldNotBe(fromSite.Value.SourceName);
    }
}
