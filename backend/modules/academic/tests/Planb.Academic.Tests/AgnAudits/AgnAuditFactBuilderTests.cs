using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Infrastructure.AgnAudits;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.AgnAudits;

/// <summary>
/// <see cref="AgnAuditFactBuilder"/> puro (sin HTTP ni base): decide Published/NotPublished por
/// sujeto a partir de una lista de <see cref="AgnReport"/> ya parseada (issue #506, ADR-0090).
/// </summary>
public sealed class AgnAuditFactBuilderTests
{
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 9, 9, 12, 0, 0, TimeSpan.Zero));

    private static readonly Guid RelievedBy = Guid.NewGuid();

    [Fact]
    public void Build_MultipleReportsForOrganismo_PicksMostRecentByYearThenActaThenResolution()
    {
        var universityId = Guid.NewGuid();
        var subject = new AgnAuditSubject(universityId, OrganismoId: 500);
        IReadOnlyList<AgnReport> reports =
        [
            new AgnReport("Informe viejo", 2010, 10, null, "/informe-viejo", [500]),
            new AgnReport("Informe del medio", 2020, 50, new DateOnly(2020, 5, 1), "/informe-medio", [500]),
            // Mismo año y misma fecha de acta que el siguiente: desempata por resolución, no por
            // orden de la lista.
            new AgnReport("Empate, resolución menor", 2020, 10, new DateOnly(2020, 5, 1), "/x", [500]),
            new AgnReport("Empate, resolución mayor: este gana", 2020, 99, new DateOnly(2020, 5, 1), "/informe-correcto", [500]),
        ];

        var result = AgnAuditFactBuilder.Build(reports, [subject], Clock.UtcNow, RelievedBy, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Count.ShouldBe(1);
        var fact = result.Value[0];
        fact.SubjectType.ShouldBe(OfficialFactSubjectType.Institution);
        fact.SubjectId.ShouldBe(universityId);
        fact.Field.ShouldBe(OfficialFactField.AgnAudit);
        fact.Status.ShouldBe(OfficialFactStatus.Published);
        fact.Value.ShouldBe("Empate, resolución mayor: este gana");
        fact.Period.ShouldBe("2020");
        fact.SourceName.ShouldBe(AgnAuditFactBuilder.SourceName);
        fact.SourceUrl.ShouldBe("https://www.agn.gob.ar/informe-correcto");
        fact.SourceDocument.ShouldBe("Resolución AGN 99/2020");
        fact.RelievedAt.ShouldBe(Clock.UtcNow);
        fact.RelievedBy.ShouldBe(RelievedBy);
        fact.CreatedAt.ShouldBe(Clock.UtcNow);
    }

    [Fact]
    public void Build_OrganismoInPadronButNoMatchingReport_ReturnsNotPublishedWithoutNote()
    {
        var subject = new AgnAuditSubject(Guid.NewGuid(), OrganismoId: 500);
        IReadOnlyList<AgnReport> reports = [new AgnReport("De otro organismo", 2020, 1, null, "/otro", [999])];

        var result = AgnAuditFactBuilder.Build(reports, [subject], Clock.UtcNow, RelievedBy, Clock);

        result.IsSuccess.ShouldBeTrue();
        var fact = result.Value[0];
        fact.Status.ShouldBe(OfficialFactStatus.NotPublished);
        fact.Value.ShouldBeNull();
        fact.Note.ShouldBeNull();
        fact.SourceName.ShouldBe(AgnAuditFactBuilder.SourceName);
        fact.SourceUrl.ShouldBe(AgnAuditFactBuilder.SearchUrl);
    }

    [Fact]
    public void Build_SubjectNotInPadron_ReturnsNotPublishedWithPadronNote()
    {
        var subject = new AgnAuditSubject(Guid.NewGuid(), OrganismoId: null);

        var result = AgnAuditFactBuilder.Build([], [subject], Clock.UtcNow, RelievedBy, Clock);

        result.IsSuccess.ShouldBeTrue();
        var fact = result.Value[0];
        fact.Status.ShouldBe(OfficialFactStatus.NotPublished);
        fact.Note.ShouldBe("La institución no figura en el padrón de organismos auditados de la AGN.");
    }

    [Fact]
    public void Build_IncompleteLatestReport_FailsForTheWholeBatch()
    {
        // subjectGood por sí solo construiría bien: prueba que un solo sujeto roto tira abajo el
        // batch entero, no solo el suyo (todo o nada, comentario de AgnAuditFactBuilder.Build).
        var subjectGood = new AgnAuditSubject(Guid.NewGuid(), OrganismoId: 1);
        var subjectBad = new AgnAuditSubject(Guid.NewGuid(), OrganismoId: 2);
        IReadOnlyList<AgnReport> reports =
        [
            new AgnReport("Informe completo", 2020, 1, null, "/completo", [1]),
            new AgnReport(Titulo: null, 2021, 2, null, "/incompleto", [2]),
        ];

        var result = AgnAuditFactBuilder.Build(
            reports, [subjectGood, subjectBad], Clock.UtcNow, RelievedBy, Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AgnAuditErrors.IncompleteReport(2));
    }

    [Fact]
    public void Build_MixOfSubjects_ReturnsOneFactPerSubjectInTheSameOrder()
    {
        var notInPadron = new AgnAuditSubject(Guid.NewGuid(), OrganismoId: null);
        var published = new AgnAuditSubject(Guid.NewGuid(), OrganismoId: 500);
        var noMatch = new AgnAuditSubject(Guid.NewGuid(), OrganismoId: 700);
        IReadOnlyList<AgnReport> reports = [new AgnReport("Informe", 2020, 1, null, "/informe", [500])];

        var result = AgnAuditFactBuilder.Build(
            reports, [notInPadron, published, noMatch], Clock.UtcNow, RelievedBy, Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Count.ShouldBe(3);
        result.Value[0].SubjectId.ShouldBe(notInPadron.UniversityId);
        result.Value[0].Status.ShouldBe(OfficialFactStatus.NotPublished);
        result.Value[0].Note.ShouldNotBeNull();
        result.Value[1].SubjectId.ShouldBe(published.UniversityId);
        result.Value[1].Status.ShouldBe(OfficialFactStatus.Published);
        result.Value[2].SubjectId.ShouldBe(noMatch.UniversityId);
        result.Value[2].Status.ShouldBe(OfficialFactStatus.NotPublished);
        result.Value[2].Note.ShouldBeNull();
    }
}
