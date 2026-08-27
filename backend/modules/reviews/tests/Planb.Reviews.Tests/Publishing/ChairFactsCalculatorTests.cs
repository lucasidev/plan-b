using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.CourseReviews;
using Planb.Reviews.Domain.Publishing;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Publishing;

/// <summary>
/// Domain unit tests de <see cref="ChairFactsCalculator"/> (ADR-0082, ADR-0083): el cálculo
/// editorial que decide qué publica la ficha de una cátedra a partir de conteos crudos. Es la
/// lógica más sensible del producto (decide qué se muestra y qué se calla), así que estos tests
/// son su especificación ejecutable.
///
/// <para>
/// Cubre, en el mismo orden que <see cref="ChairFactsCalculator.Calculate"/>: el piso de
/// <see cref="PublishingRules.ChairMinimumReviews"/> reseñas, la moda y la distribución de cada
/// ítem, que los bloques (conducta de cátedra, vivencia del estudiante y la fama) no se mezclan
/// entre sí ni con el contexto, que un ítem sin respuestas no se publica, la tasa de finalización
/// agregada y los contrastes contra las cátedras hermanas.
/// </para>
/// </summary>
public class ChairFactsCalculatorTests
{
    private static OptionTally Option(short value, short order, string label, OptionValence valence, int count) =>
        new(value, order, label, valence, count);

    private static ItemTally Tally(string itemCode, ItemLayer layer, params OptionTally[] options) =>
        new(itemCode, layer, options);

    /// <summary>Un ítem binario típico: una opción positiva y una negativa, nada más.</summary>
    private static ItemTally BinaryTally(string itemCode, ItemLayer layer, int positiveCount, int negativeCount) =>
        Tally(
            itemCode,
            layer,
            Option(1, 1, "Bien", OptionValence.Positive, positiveCount),
            Option(2, 2, "Mal", OptionValence.Negative, negativeCount));

    /// <summary>Calcula ya arriba del piso de reseñas, salvo que el test pida otra cosa.</summary>
    private static ChairFacts Publish(
        IReadOnlyList<ItemTally> tallies,
        IReadOnlyList<ItemTally>? siblingTallies = null,
        (int Reaching, int Total)? completion = null,
        int reviewCount = PublishingRules.ChairMinimumReviews) =>
        ChairFactsCalculator.Calculate(reviewCount, tallies, siblingTallies ?? [], completion);

    // -------------------------------------------------------------------
    // El piso
    // -------------------------------------------------------------------

    [Fact]
    public void Calculate_FewerThanMinimumReviews_DoesNotPublish_AndReportsHowManyAreMissing()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 5, negativeCount: 2),
        ];

        var facts = Publish(tallies, completion: (5, 7), reviewCount: 7);

        facts.IsPublished.ShouldBeFalse();
        facts.ReviewCount.ShouldBe(7);
        facts.ReviewsMissingToPublish.ShouldBe(3); // el piso (10) menos 7
        facts.Fame.ShouldBeEmpty();
        facts.ChairConduct.ShouldBeEmpty();
        facts.StudentExperience.ShouldBeEmpty();
        facts.Completion.ShouldBeNull();
        facts.Contrasts.ShouldBeEmpty();
    }

    [Fact]
    public void Calculate_ExactlyTheMinimumReviews_Publishes()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 6, negativeCount: 4),
        ];

        var facts = Publish(tallies, reviewCount: PublishingRules.ChairMinimumReviews);

        facts.IsPublished.ShouldBeTrue();
        facts.ReviewsMissingToPublish.ShouldBe(0);
    }

    // -------------------------------------------------------------------
    // Moda y distribución
    // -------------------------------------------------------------------

    [Fact]
    public void Calculate_ItemWithAClearWinner_PublishesModeLabelAndPercent()
    {
        List<ItemTally> tallies =
        [
            Tally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct,
                Option(1, 1, "Siempre", OptionValence.Positive, 5),
                Option(2, 2, "A veces", OptionValence.Neutral, 3),
                Option(3, 3, "Casi nunca", OptionValence.Negative, 2)),
        ];

        var facts = Publish(tallies);

        var item = facts.ChairConduct.Single();
        item.ModeLabel.ShouldBe("Siempre");
        item.ModePercent.ShouldBe(50); // 5 de 10
        item.ModeIsNegative.ShouldBeFalse();
        item.Total.ShouldBe(10);
    }

    [Fact]
    public void Calculate_OptionsGivenOutOfOrder_PublishesDistributionOrderedByOrder()
    {
        List<ItemTally> tallies =
        [
            Tally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct,
                Option(3, 3, "Casi nunca", OptionValence.Negative, 2),
                Option(1, 1, "Siempre", OptionValence.Positive, 5),
                Option(2, 2, "A veces", OptionValence.Neutral, 3)),
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.Single().Distribution.Select(o => o.Label)
            .ShouldBe(["Siempre", "A veces", "Casi nunca"]);
    }

    [Fact]
    public void Calculate_OptionsSplitUnevenly_DistributionPercentagesDoNotSumToOneHundred()
    {
        List<ItemTally> tallies =
        [
            Tally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct,
                Option(1, 1, "Siempre", OptionValence.Positive, 1),
                Option(2, 2, "A veces", OptionValence.Neutral, 1),
                Option(3, 3, "Casi nunca", OptionValence.Negative, 1)),
        ];

        var facts = Publish(tallies);

        // 1 de 3 redondea a 33 % cada uno: la suma da 99, no 100. Cada opción redondea la suya
        // (nadie le regala el resto a otra), así que el total es aproximado, no exacto.
        facts.ChairConduct.Single().Distribution.Sum(o => o.Percent).ShouldBe(99);
    }

    [Fact]
    public void Calculate_NegativeOptionIsTheMode_ModeIsNegativeIsTrue()
    {
        List<ItemTally> tallies =
        [
            Tally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct,
                Option(1, 1, "Siempre", OptionValence.Positive, 2),
                Option(2, 2, "Casi nunca", OptionValence.Negative, 8)),
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.Single().ModeIsNegative.ShouldBeTrue();
    }

    [Fact]
    public void Calculate_TiedCounts_ModeIsTheOptionWithTheLowerOrder()
    {
        List<ItemTally> tallies =
        [
            Tally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct,
                Option(2, 2, "Casi nunca", OptionValence.Negative, 5),
                Option(1, 1, "Siempre", OptionValence.Positive, 5)),
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.Single().ModeLabel.ShouldBe("Siempre");
    }

    // -------------------------------------------------------------------
    // Los bloques no se mezclan
    // -------------------------------------------------------------------

    [Fact]
    public void Calculate_ItemsAcrossLayers_KeepsBlocksSeparate_ContextNeverPublishes()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 6, negativeCount: 4),
            BinaryTally("STUDENT_FELT_SUPPORTED", ItemLayer.StudentExperience, positiveCount: 7, negativeCount: 3),
            BinaryTally("COURSE_MODALITY", ItemLayer.Context, positiveCount: 8, negativeCount: 2),
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.Select(i => i.ItemCode).ShouldBe(["CHAIR_ANSWERS_QUESTIONS"]);
        facts.StudentExperience.Select(i => i.ItemCode).ShouldBe(["STUDENT_FELT_SUPPORTED"]);
    }

    // -------------------------------------------------------------------
    // Un ítem sin respuestas
    // -------------------------------------------------------------------

    [Fact]
    public void Calculate_ItemWithNoAnswers_IsNotPublished()
    {
        List<ItemTally> tallies =
        [
            Tally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct,
                Option(1, 1, "Siempre", OptionValence.Positive, 0),
                Option(2, 2, "Casi nunca", OptionValence.Negative, 0)),
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.ShouldBeEmpty();
    }

    // -------------------------------------------------------------------
    // La fama (convergencia)
    // -------------------------------------------------------------------

    [Fact]
    public void Calculate_ThreeItemsConverge_FameHasOneConvergingFact()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct, positiveCount: 4, negativeCount: 6),      // 60 %
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 3, negativeCount: 7),     // 70 %
            BinaryTally("STUDENT_FELT_SUPPORTED", ItemLayer.StudentExperience, positiveCount: 2, negativeCount: 8), // 80 %
        ];

        var facts = Publish(tallies);

        var fame = facts.Fame.Single();
        fame.ItemsAgreeing.ShouldBe(3);
        fame.ItemCodes.ShouldBe(["STUDENT_FELT_SUPPORTED", "CHAIR_ANSWERS_QUESTIONS", "CHAIR_EXPLAINS_CLEARLY"]); // más alta primero
    }

    [Fact]
    public void Calculate_OnlyTwoItemsConverge_FameIsEmpty()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct, positiveCount: 4, negativeCount: 6),  // 60 %
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 3, negativeCount: 7), // 70 %
        ];

        var facts = Publish(tallies);

        facts.Fame.ShouldBeEmpty();
    }

    [Fact]
    public void Calculate_AThirdConvergingItemIsFromContext_FameStaysEmpty()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct, positiveCount: 4, negativeCount: 6),  // 60 %
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 3, negativeCount: 7), // 70 %
            BinaryTally("COURSE_MODALITY", ItemLayer.Context, positiveCount: 1, negativeCount: 9),              // 90 %, pero es de contexto
        ];

        var facts = Publish(tallies);

        facts.Fame.ShouldBeEmpty(); // sin el de contexto quedan 2, no llegan al mínimo de 3
    }

    // -------------------------------------------------------------------
    // La tasa de finalización
    // -------------------------------------------------------------------

    [Fact]
    public void Calculate_CompletionSeventeenOfFortyTwo_RoundsToFourOutOfTen()
    {
        var facts = Publish([], completion: (17, 42));

        facts.Completion.ShouldNotBeNull();
        facts.Completion!.Reaching.ShouldBe(17);
        facts.Completion!.Total.ShouldBe(42);
        facts.Completion!.OutOfTen.ShouldBe(4); // 10 * 17 / 42 = 4,05: redondea a 4
    }

    [Fact]
    public void Calculate_CompletionFiveOfTen_IsFiveOutOfTen()
    {
        var facts = Publish([], completion: (5, 10));

        facts.Completion!.OutOfTen.ShouldBe(5);
    }

    [Fact]
    public void Calculate_CompletionWithZeroTotal_ReturnsNull()
    {
        var facts = Publish([], completion: (0, 0));

        facts.Completion.ShouldBeNull();
    }

    // -------------------------------------------------------------------
    // Los contrastes contra las hermanas
    // -------------------------------------------------------------------

    [Fact]
    public void Calculate_SeparatedContrast_IsPublished_WithBothSidesRawCounts()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ARRIVES_LATE", ItemLayer.ChairConduct, positiveCount: 16, negativeCount: 20), // 20 de 36
        ];
        List<ItemTally> siblingTallies =
        [
            BinaryTally("CHAIR_ARRIVES_LATE", ItemLayer.ChairConduct, positiveCount: 56, negativeCount: 5), // 5 de 61
        ];

        var facts = Publish(tallies, siblingTallies);

        var contrast = facts.Contrasts.Single();
        contrast.ItemCode.ShouldBe("CHAIR_ARRIVES_LATE");
        contrast.HereCount.ShouldBe(20);
        contrast.HereTotal.ShouldBe(36);
        contrast.HerePercent.ShouldBe(56);    // 20/36 = 55,6 %
        contrast.SiblingsCount.ShouldBe(5);
        contrast.SiblingsTotal.ShouldBe(61);
        contrast.SiblingsPercent.ShouldBe(8); // 5/61 = 8,2 %
    }

    [Fact]
    public void Calculate_OverlappingContrast_IsNotPublished()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct, positiveCount: 5, negativeCount: 5), // 5 de 10
        ];
        List<ItemTally> siblingTallies =
        [
            BinaryTally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct, positiveCount: 4, negativeCount: 6), // 6 de 10
        ];

        var facts = Publish(tallies, siblingTallies);

        facts.Contrasts.ShouldBeEmpty();
    }

    [Fact]
    public void Calculate_ItemWithoutMatchingSiblingData_IsSkipped()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ONLY_HERE", ItemLayer.ChairConduct, positiveCount: 16, negativeCount: 20),
        ];
        List<ItemTally> siblingTallies =
        [
            BinaryTally("CHAIR_OTHER_ITEM", ItemLayer.ChairConduct, positiveCount: 56, negativeCount: 5), // código distinto: no matchea
        ];

        var facts = Publish(tallies, siblingTallies);

        facts.Contrasts.ShouldBeEmpty();
    }

    [Fact]
    public void Calculate_NoSiblingsWithData_ContrastsListIsEmpty()
    {
        // El caso de la cátedra única: no hay con quién compararla, así que no hay contraste que hacer.
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ARRIVES_LATE", ItemLayer.ChairConduct, positiveCount: 16, negativeCount: 20),
        ];

        var facts = Publish(tallies);

        facts.Contrasts.ShouldBeEmpty();
    }

    [Fact]
    public void Calculate_MultipleContrasts_AreOrderedByPercentDifferenceDescending()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_INTERRUPTS", ItemLayer.ChairConduct, positiveCount: 90, negativeCount: 10),   // 10 de 100: diferencia chica
            BinaryTally("CHAIR_ARRIVES_LATE", ItemLayer.ChairConduct, positiveCount: 16, negativeCount: 20), // 20 de 36: diferencia grande
        ];
        List<ItemTally> siblingTallies =
        [
            BinaryTally("CHAIR_INTERRUPTS", ItemLayer.ChairConduct, positiveCount: 70, negativeCount: 30),  // 30 de 100
            BinaryTally("CHAIR_ARRIVES_LATE", ItemLayer.ChairConduct, positiveCount: 56, negativeCount: 5), // 5 de 61
        ];

        var facts = Publish(tallies, siblingTallies);

        facts.Contrasts.Select(c => c.ItemCode).ShouldBe(["CHAIR_ARRIVES_LATE", "CHAIR_INTERRUPTS"]);
    }
}
