using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Publishing;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Publishing;

/// <summary>
/// Qué se publica de con qué otras materias se llevó una (US-143). El piso es por par y período: el
/// valor vive en <see cref="PublishingRules"/> y se pinea en <c>PublishingRulesTests</c>, así que
/// acá se referencia y no se escribe a mano.
/// </summary>
public class SubjectPairCalculatorTests
{
    private static readonly Guid OtherSubject = Guid.NewGuid();
    private static readonly Guid Term = Guid.NewGuid();

    private static SubjectPairCalculator.Tally Tally(int together, int dropped = 0) =>
        new(OtherSubject, Term, together, dropped);

    [Fact]
    public void A_pair_at_the_floor_publishes()
    {
        var facts = SubjectPairCalculator.Calculate(
            [Tally(PublishingRules.SubjectPairMinimumReviews, dropped: 4)]);

        var pair = facts.ShouldHaveSingleItem();
        pair.IsPublished.ShouldBeTrue();
        pair.DroppedCount.ShouldBe(4);
        pair.MissingToPublish.ShouldBe(0);
    }

    [Fact]
    public void A_pair_below_the_floor_is_listed_with_how_many_are_missing()
    {
        var facts = SubjectPairCalculator.Calculate(
            [Tally(PublishingRules.SubjectPairMinimumReviews - 1)]);

        // No se esconde: esconderlo mentiría sobre lo que hay, igual que con una cátedra.
        var pair = facts.ShouldHaveSingleItem();
        pair.IsPublished.ShouldBeFalse();
        pair.MissingToPublish.ShouldBe(1);
    }

    [Fact]
    public void Below_the_floor_the_dropped_count_does_not_travel()
    {
        var facts = SubjectPairCalculator.Calculate(
            [Tally(PublishingRules.SubjectPairMinimumReviews - 1, dropped: 3)]);

        // Publicar "3 de 9 dejaron una" es el mismo problema de denominador que el piso evita.
        facts.ShouldHaveSingleItem().DroppedCount.ShouldBe(0);
    }

    [Fact]
    public void Pairs_are_ordered_by_how_many_took_them_together()
    {
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();

        var facts = SubjectPairCalculator.Calculate(
        [
            new SubjectPairCalculator.Tally(a, Term, 12, 2),
            new SubjectPairCalculator.Tally(b, Term, 30, 9),
        ]);

        facts[0].OtherSubjectId.ShouldBe(b);
        facts[1].OtherSubjectId.ShouldBe(a);
    }

    [Fact]
    public void No_pairs_is_an_empty_list_and_not_a_null()
    {
        SubjectPairCalculator.Calculate([]).ShouldBeEmpty();
    }
}
