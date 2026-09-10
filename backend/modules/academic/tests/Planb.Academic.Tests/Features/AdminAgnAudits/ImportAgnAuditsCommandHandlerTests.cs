using NSubstitute;
using Planb.Academic.Application.Abstractions.AgnAudits;
using Planb.Academic.Application.Features.AdminAgnAudits;
using Planb.Academic.Infrastructure.AgnAudits;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Features.AdminAgnAudits;

/// <summary>
/// Handler unit tests de <see cref="ImportAgnAuditsCommandHandler"/> (issue #506): el handler solo
/// delega en <see cref="IAgnAuditImporter"/> y mapea el resultado, así que estos tests cubren esa
/// traducción, no el import en sí (eso lo cubren <c>AgnAuditSanityCheckTests</c> y los tests de
/// <c>AgnAuditFactBuilder</c>).
/// </summary>
public sealed class ImportAgnAuditsCommandHandlerTests
{
    [Fact]
    public async Task Handle_ImporterSucceeds_ReturnsResponseWithTheCount()
    {
        var importer = Substitute.For<IAgnAuditImporter>();
        importer.ImportAsync(Arg.Any<CancellationToken>()).Returns(Result.Success(5));

        var result = await ImportAgnAuditsCommandHandler.Handle(
            new ImportAgnAuditsCommand(), importer, CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.AuditsLoaded.ShouldBe(5);
    }

    [Fact]
    public async Task Handle_ImporterFails_ReturnsTheSameError()
    {
        // El control vacío (issue #506, "la trampa") es una de las formas en las que el importer
        // puede fallar; el handler no la distingue, solo relaya lo que venga.
        var importer = Substitute.For<IAgnAuditImporter>();
        importer.ImportAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Failure<int>(AgnAuditErrors.SanityCheckFailed()));

        var result = await ImportAgnAuditsCommandHandler.Handle(
            new ImportAgnAuditsCommand(), importer, CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(AgnAuditErrors.SanityCheckFailed());
    }
}
