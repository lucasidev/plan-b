using NSubstitute;
using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.MyReviews;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Publishing;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Features.MyReviews;

/// <summary>
/// Handler unit tests de <see cref="GetMyReviewsQueryHandler"/> (US-162). Cubre lo que el handler
/// decide por sí mismo (a qué respuesta le cuelga voces, a cuál no, y que pide el tally una sola vez
/// por cátedra distinta) sin levantar base: reseñas, catálogo y tallies llegan mockeados.
/// </summary>
public class GetMyReviewsQueryHandlerTests
{
    private const string ClassesHeldCode = "SE_CLASSES_HELD";

    private sealed record Deps(
        IMyReviewsQueryService Reviews,
        IAcademicQueryService Academic,
        IChairTallyQueryService ChairTallies);

    private static Deps NewDeps()
    {
        var academic = Substitute.For<IAcademicQueryService>();
        academic
            .GetLabelsAsync(
                Arg.Any<IReadOnlyCollection<Guid>>(),
                Arg.Any<IReadOnlyCollection<Guid>>(),
                Arg.Any<IReadOnlyCollection<Guid>>(),
                Arg.Any<CancellationToken>())
            .Returns(CatalogLabels.Empty);

        var chairTallies = Substitute.For<IChairTallyQueryService>();
        chairTallies
            .GetPerChairAsync(Arg.Any<IReadOnlyList<(Guid ChairId, string ChairName)>>(), Arg.Any<CancellationToken>())
            .Returns(new SubjectTallies([], [], new Dictionary<string, string>(StringComparer.Ordinal)));

        return new(Substitute.For<IMyReviewsQueryService>(), academic, chairTallies);
    }

    private static Task<IReadOnlyList<MyReviewView>> Invoke(Deps deps, Guid accountId) =>
        GetMyReviewsQueryHandler.Handle(
            accountId, deps.Reviews, deps.Academic, deps.ChairTallies, CancellationToken.None);

    private static MyReviewRow Review(Guid? chairId, params MyAnswerView[] answers) =>
        new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            chairId,
            answers,
            FreeText: null,
            CreatedAt: DateTimeOffset.UtcNow,
            UpdatedAt: DateTimeOffset.UtcNow);

    /// <summary>
    /// E1: la opción elegida suma 12 de 40 voces, tal como la cuenta el tally de la cátedra después
    /// de esta reseña (el "antes" de 11 de 39 lo aporta la base, no el handler).
    /// </summary>
    [Fact]
    public async Task Handle_AnswerHasTallyForItsChair_AttachesOptionVoicesAndItemTotalVoices()
    {
        var deps = NewDeps();
        var accountId = Guid.NewGuid();
        var chairId = Guid.NewGuid();
        var row = Review(chairId, new MyAnswerView(ClassesHeldCode, OptionValue: 1));
        deps.Reviews.ListAsync(accountId, Arg.Any<CancellationToken>())
            .Returns(new List<MyReviewRow> { row });
        deps.ChairTallies
            .GetPerChairAsync(Arg.Any<IReadOnlyList<(Guid ChairId, string ChairName)>>(), Arg.Any<CancellationToken>())
            .Returns(new SubjectTallies(
                [
                    new ChairContribution(
                        chairId,
                        "Pérez",
                        ReviewCount: 12,
                        Tallies:
                        [
                            new ItemTally(
                                ClassesHeldCode,
                                ItemLayer.StudentExperience,
                                Options:
                                [
                                    new OptionTally(1, 1, "Faltaron muchas", OptionValence.Negative, Count: 12),
                                    new OptionTally(2, 2, "Casi siempre", OptionValence.Positive, Count: 28),
                                ]),
                        ],
                        LastReviewedAt: null),
                ],
                [],
                new Dictionary<string, string>(StringComparer.Ordinal)));

        var result = await Invoke(deps, accountId);

        var answer = result.Single().Answers.Single();
        answer.OptionVoices.ShouldBe(12);
        answer.ItemTotalVoices.ShouldBe(40);
    }

    /// <summary>
    /// Sin cátedra declarada no hay un tally al que atribuirle la voz (US-162): la respuesta viaja
    /// igual, sin esos dos números, y ni se pide el tally.
    /// </summary>
    [Fact]
    public async Task Handle_ReviewWithoutChair_LeavesAnswersWithoutVoicesAndSkipsTheTallyCall()
    {
        var deps = NewDeps();
        var accountId = Guid.NewGuid();
        var row = Review(chairId: null, new MyAnswerView("COURSE_OUTCOME", OptionValue: 1));
        deps.Reviews.ListAsync(accountId, Arg.Any<CancellationToken>())
            .Returns(new List<MyReviewRow> { row });

        var result = await Invoke(deps, accountId);

        var answer = result.Single().Answers.Single();
        answer.OptionVoices.ShouldBeNull();
        answer.ItemTotalVoices.ShouldBeNull();
        await deps.ChairTallies.DidNotReceive().GetPerChairAsync(
            Arg.Any<IReadOnlyList<(Guid ChairId, string ChairName)>>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Una frase que el tally de la cátedra no trae (retirada y ya no vigente) no rompe la fila: la
    /// respuesta se sigue viendo, solo que sin voces que contarle.
    /// </summary>
    [Fact]
    public async Task Handle_ItemMissingFromChairTallies_LeavesThatAnswerWithoutVoices()
    {
        var deps = NewDeps();
        var accountId = Guid.NewGuid();
        var chairId = Guid.NewGuid();
        var row = Review(chairId, new MyAnswerView("RETIRED_ITEM", OptionValue: 1));
        deps.Reviews.ListAsync(accountId, Arg.Any<CancellationToken>())
            .Returns(new List<MyReviewRow> { row });
        deps.ChairTallies
            .GetPerChairAsync(Arg.Any<IReadOnlyList<(Guid ChairId, string ChairName)>>(), Arg.Any<CancellationToken>())
            .Returns(new SubjectTallies(
                [new ChairContribution(chairId, "Pérez", ReviewCount: 1, Tallies: [], LastReviewedAt: null)],
                [],
                new Dictionary<string, string>(StringComparer.Ordinal)));

        var result = await Invoke(deps, accountId);

        var answer = result.Single().Answers.Single();
        answer.ItemCode.ShouldBe("RETIRED_ITEM");
        answer.OptionVoices.ShouldBeNull();
        answer.ItemTotalVoices.ShouldBeNull();
    }

    /// <summary>
    /// Varias cursadas de la misma cátedra comparten un solo pedido de tallies: no es un viaje por
    /// reseña.
    /// </summary>
    [Fact]
    public async Task Handle_TwoReviewsShareTheSameChair_FetchesTalliesOnce()
    {
        var deps = NewDeps();
        var accountId = Guid.NewGuid();
        var chairId = Guid.NewGuid();
        var rows = new List<MyReviewRow>
        {
            Review(chairId, new MyAnswerView(ClassesHeldCode, OptionValue: 1)),
            Review(chairId, new MyAnswerView(ClassesHeldCode, OptionValue: 2)),
        };
        deps.Reviews.ListAsync(accountId, Arg.Any<CancellationToken>()).Returns(rows);

        await Invoke(deps, accountId);

        await deps.ChairTallies.Received(1).GetPerChairAsync(
            Arg.Any<IReadOnlyList<(Guid ChairId, string ChairName)>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NoReviews_ReturnsEmptyWithoutQueryingCatalogOrTallies()
    {
        var deps = NewDeps();
        var accountId = Guid.NewGuid();
        deps.Reviews.ListAsync(accountId, Arg.Any<CancellationToken>())
            .Returns(new List<MyReviewRow>());

        var result = await Invoke(deps, accountId);

        result.ShouldBeEmpty();
        await deps.Academic.DidNotReceive().GetLabelsAsync(
            Arg.Any<IReadOnlyCollection<Guid>>(),
            Arg.Any<IReadOnlyCollection<Guid>>(),
            Arg.Any<IReadOnlyCollection<Guid>>(),
            Arg.Any<CancellationToken>());
        await deps.ChairTallies.DidNotReceive().GetPerChairAsync(
            Arg.Any<IReadOnlyList<(Guid ChairId, string ChairName)>>(), Arg.Any<CancellationToken>());
    }
}
