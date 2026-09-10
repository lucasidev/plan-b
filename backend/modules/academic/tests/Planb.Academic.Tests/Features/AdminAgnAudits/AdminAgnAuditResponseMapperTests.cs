using Planb.Academic.Application.Features.AdminAgnAudits;
using Planb.Academic.Application.Features.AdminUniversities;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Features.AdminAgnAudits;

/// <summary>
/// <see cref="AdminAgnAuditResponseMapper"/> puro (sin base): combina el catálogo completo de
/// universidades con las afirmaciones <c>agn_audit</c> existentes (issue #506).
/// </summary>
public sealed class AdminAgnAuditResponseMapperTests
{
    private static readonly DateTimeOffset T0 = new(2026, 9, 1, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset T1 = new(2026, 9, 8, 12, 0, 0, TimeSpan.Zero);

    private static AdminUniversityListItem University(Guid id, string name) =>
        new() { Id = id, Name = name, Slug = name.ToLowerInvariant(), IsActive = true };

    [Fact]
    public void Combine_UniversityWithoutAnyFact_MarksItUncheckedWithNullFields()
    {
        var universityId = Guid.NewGuid();
        var universities = new[] { University(universityId, "UNSE") };

        var items = AdminAgnAuditResponseMapper.Combine(universities, []);

        items.Count.ShouldBe(1);
        items[0].UniversityId.ShouldBe(universityId);
        items[0].Checked.ShouldBeFalse();
        items[0].Status.ShouldBeNull();
        items[0].LastCheckedAt.ShouldBeNull();
    }

    [Fact]
    public void Combine_UniversityWithOneFact_CarriesItsFields()
    {
        var universityId = Guid.NewGuid();
        var universities = new[] { University(universityId, "UNT") };
        var facts = new[]
        {
            new AdminAgnAuditFactRow
            {
                UniversityId = universityId,
                UniversityName = "UNT",
                Status = "Published",
                Value = "Plan de obras",
                Period = "2013",
                SourceUrl = "https://www.agn.gob.ar/plan-de-obras",
                SourceRetrievedAt = T0,
                RelievedAt = T0,
                CreatedAt = T0,
            },
        };

        var items = AdminAgnAuditResponseMapper.Combine(universities, facts);

        items.Count.ShouldBe(1);
        items[0].Checked.ShouldBeTrue();
        items[0].Status.ShouldBe("Published");
        items[0].Value.ShouldBe("Plan de obras");
        items[0].LastCheckedAt.ShouldBe(T0);
    }

    [Fact]
    public void Combine_UniversityWithTwoFacts_PicksTheMostRecentlyRelieved()
    {
        // Dos imports separados en el tiempo: el segundo encontró informes donde el primero no.
        var universityId = Guid.NewGuid();
        var universities = new[] { University(universityId, "UNT") };
        var facts = new[]
        {
            new AdminAgnAuditFactRow
            {
                UniversityId = universityId,
                UniversityName = "UNT",
                Status = "NotPublished",
                SourceUrl = "https://www.agn.gob.ar/auditorias/buscador",
                SourceRetrievedAt = T0,
                RelievedAt = T0,
                CreatedAt = T0,
            },
            new AdminAgnAuditFactRow
            {
                UniversityId = universityId,
                UniversityName = "UNT",
                Status = "Published",
                Value = "Informe nuevo",
                SourceUrl = "https://www.agn.gob.ar/informe-nuevo",
                SourceRetrievedAt = T1,
                RelievedAt = T1,
                CreatedAt = T1,
            },
        };

        var items = AdminAgnAuditResponseMapper.Combine(universities, facts);

        items.Count.ShouldBe(1);
        items[0].Status.ShouldBe("Published");
        items[0].Value.ShouldBe("Informe nuevo");
        items[0].LastCheckedAt.ShouldBe(T1);
    }

    [Fact]
    public void Combine_MultipleUniversities_OrdersByName()
    {
        var utn = Guid.NewGuid();
        var unt = Guid.NewGuid();
        var universities = new[] { University(utn, "UTN-FRT"), University(unt, "UNT") };

        var items = AdminAgnAuditResponseMapper.Combine(universities, []);

        items.Select(i => i.UniversityName).ShouldBe(["UNT", "UTN-FRT"]);
    }
}
