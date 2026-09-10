using Planb.Academic.Infrastructure.AgnAudits;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.AgnAudits;

/// <summary>
/// <see cref="AgnAuditSanityCheck"/> puro (sin HTTP ni base): decide si el control (issue #506, "la
/// trampa") alcanza para confiar en el resto de la consulta.
/// </summary>
public sealed class AgnAuditSanityCheckTests
{
    [Fact]
    public void Verify_ControlHasReports_ReturnsSuccess()
    {
        IReadOnlyList<AgnReport> control = [new AgnReport("Informe", 2013, 126, null, "/informe", [1140])];

        var result = AgnAuditSanityCheck.Verify(control);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Verify_ControlIsEmpty_ReturnsSanityCheckFailed()
    {
        var result = AgnAuditSanityCheck.Verify([]);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AgnAuditErrors.SanityCheckFailed());
    }
}
