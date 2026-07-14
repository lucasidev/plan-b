using Microsoft.Extensions.Configuration;
using NSubstitute;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Moderation.Application.Abstractions.Persistence;
using Planb.Moderation.Application.Features.ReportReview;
using Planb.Moderation.Domain.Reports;
using Planb.Reviews.Application.Contracts;
using Shouldly;
using Wolverine;
using Xunit;

namespace Planb.Moderation.Tests.Features.ReportReview;

/// <summary>
/// Handler unit tests para <see cref="ReportReviewCommandHandler"/>. Cubre la rama de rate limit
/// (US-019, 10 reports/hora por reporter): forzar 11 requests reales sería derroche de un
/// integration test, así que acá se mockea <see cref="IRateLimiter"/> directamente.
/// </summary>
public class ReportReviewCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 13, 12, 0, 0, TimeSpan.Zero);

    private sealed record Deps(
        IReviewReportRepository Reports,
        IModerationUnitOfWork UnitOfWork,
        IReviewQueryService ReviewQuery,
        IRateLimiter RateLimiter,
        IConfiguration Configuration,
        IMessageBus Bus,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<IReviewReportRepository>(),
        Substitute.For<IModerationUnitOfWork>(),
        Substitute.For<IReviewQueryService>(),
        Substitute.For<IRateLimiter>(),
        Substitute.For<IConfiguration>(),
        Substitute.For<IMessageBus>(),
        new FixedClock(T0));

    [Fact]
    public async Task Handle_returns_RateLimitExceeded_and_does_nothing_else_when_rate_limiter_denies()
    {
        var deps = NewDeps();
        deps.RateLimiter.TryAcquireAsync(
                Arg.Any<string>(), Arg.Any<TimeSpan>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(new RateLimitResult(false, 0));

        var command = new ReportReviewCommand(
            Guid.NewGuid(), Guid.NewGuid(), ReviewReportReason.Spam, "detalle");

        var result = await ReportReviewCommandHandler.Handle(
            command,
            deps.Reports,
            deps.UnitOfWork,
            deps.ReviewQuery,
            deps.RateLimiter,
            deps.Configuration,
            deps.Bus,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewReportErrors.RateLimitExceeded);

        // Corta antes de resolver la reseña, chequear duplicados, persistir o publicar.
        await deps.ReviewQuery.DidNotReceive().GetAuthorUserIdAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await deps.Reports.DidNotReceive().ExistsAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        deps.Reports.DidNotReceive().Add(Arg.Any<ReviewReport>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
