using Planb.Academic.Infrastructure.AgnAudits;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.AgnAudits;

/// <summary>Pin del organismo de control (issue #506): si el mapeo de la UNT cambia de id, el control deja de apuntarle sin avisar.</summary>
public sealed class AgnOrganismoCatalogTests
{
    [Fact]
    public void ControlOrganismoId_ResolvesToUnt() =>
        AgnOrganismoCatalog.ControlOrganismoId.ShouldBe(1140);
}
