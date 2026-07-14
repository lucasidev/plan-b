using NSubstitute;
using Planb.Moderation.Application.Abstractions.Persistence;
using Planb.Moderation.Application.Features.ResolveReport;
using Planb.Moderation.Domain.Reports;
using Planb.Reviews.Application.IntegrationEvents;
using Shouldly;
using Wolverine;
using Xunit;

namespace Planb.Moderation.Tests.Features.ResolveReport;

/// <summary>
/// Handler unit tests para <see cref="DismissReportCommandHandler"/>. Cubre la rama
/// <c>report is null</c> (404), que en integration queda tapada por el chequeo de rol 403 (solo
/// moderadores llegan al endpoint), así que acá se mockea el repo directamente.
/// </summary>
public class DismissReportCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 13, 12, 0, 0, TimeSpan.Zero);

    private sealed record Deps(
        IReviewReportRepository Reports,
        IModerationUnitOfWork UnitOfWork,
        IMessageBus Bus,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<IReviewReportRepository>(),
        Substitute.For<IModerationUnitOfWork>(),
        Substitute.For<IMessageBus>(),
        new FixedClock(T0));

    [Fact]
    public async Task Handle_returns_ReportNotFound_and_does_not_persist_or_publish_when_report_missing()
    {
        var deps = NewDeps();
        deps.Reports.FindByIdAsync(Arg.Any<ReviewReportId>(), Arg.Any<CancellationToken>())
            .Returns((ReviewReport?)null);

        var result = await DismissReportCommandHandler.Handle(
            new DismissReportCommand(Guid.NewGuid(), Guid.NewGuid(), "crítica legítima"),
            deps.Reports,
            deps.UnitOfWork,
            deps.Bus,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewReportErrors.ReportNotFound);

        // Sin report no hay nada que persistir, ni conteo de open ni evento de resolución.
        await deps.Reports.DidNotReceive().CountOpenForReviewAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        await deps.Bus.DidNotReceive().PublishAsync(
            Arg.Any<ReviewReportsResolvedIntegrationEvent>(), Arg.Any<DeliveryOptions>());
    }
}
