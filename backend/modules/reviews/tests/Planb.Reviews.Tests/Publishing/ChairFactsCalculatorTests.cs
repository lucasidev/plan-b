using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
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
/// agregada, los contrastes contra las cátedras hermanas, y el corte de serie de US-198: los dos
/// tramos se publican separados y el viejo no vota en nada de lo que se calcula sobre el de hoy.
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

    /// <summary>El mismo ítem binario, pero retirado el día que se abrió el código nuevo.</summary>
    private static ItemTally RetiredTally(
        string itemCode, ItemLayer layer, int positiveCount, int negativeCount) =>
        BinaryTally(itemCode, layer, positiveCount, negativeCount) with
        {
            IsRetired = true,
            RetiredAt = CutDate,
        };

    /// <summary>El sucesor, que declara de qué pregunta viene.</summary>
    private static ItemTally SuccessorTally(
        string itemCode,
        string supersedesCode,
        ItemLayer layer,
        int positiveCount,
        int negativeCount) =>
        BinaryTally(itemCode, layer, positiveCount, negativeCount) with
        {
            SupersedesCode = supersedesCode,
        };

    private static readonly DateTimeOffset CutDate = new(2026, 8, 21, 0, 0, 0, TimeSpan.Zero);

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

    /// <summary>
    /// ADR-0083: la fama exige más de la mitad de quienes respondieron, no "algunos". Este ítem
    /// tiene 10 respuestas y solo 2 marcaron la opción negativa (20 %): no converge, por muchas
    /// respuestas que tenga en crudo.
    /// </summary>
    [Fact]
    public void Calculate_ItemWithNegativeProportionAtOrBelowHalf_NeverContributesToFame()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct, positiveCount: 2, negativeCount: 8),      // 80 %
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 3, negativeCount: 7),     // 70 %
            BinaryTally("STUDENT_FELT_SUPPORTED", ItemLayer.StudentExperience, positiveCount: 8, negativeCount: 2), // 20 %: no converge
        ];

        var facts = Publish(tallies);

        // Sin el tercero, solo hay 2 que convergen: no llega al mínimo de 3.
        facts.Fame.ShouldBeEmpty();
    }

    /// <summary>
    /// El umbral es "más de la mitad", no "la mitad": empatado 5 y 5 no alcanza. Es el borde
    /// exacto de <see cref="ChairFactsCalculator.ConvergenceThreshold"/>.
    /// </summary>
    [Fact]
    public void Calculate_ItemExactlyAtConvergenceThreshold_DoesNotConverge()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct, positiveCount: 2, negativeCount: 8),      // 80 %
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 3, negativeCount: 7),     // 70 %
            BinaryTally("STUDENT_FELT_SUPPORTED", ItemLayer.StudentExperience, positiveCount: 5, negativeCount: 5), // exactamente 50 %
        ];

        var facts = Publish(tallies);

        facts.Fame.ShouldBeEmpty();
    }

    /// <summary>
    /// El orden es por proporción descendente, no por cuántos marcaron la negativa en crudo: acá
    /// el ítem con menos marcas negativas en total (3 de 4) va primero porque su proporción es más
    /// alta (75 %) que la del que tiene más marcas en crudo (5 de 9, 55,6 %).
    /// </summary>
    [Fact]
    public void Calculate_FameOrdering_RanksByProportion_NotByRawNegativeCount()
    {
        List<ItemTally> tallies =
        [
            Tally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct,
                Option(1, 1, "Bien", OptionValence.Positive, 1),
                Option(2, 2, "Mal", OptionValence.Negative, 3)),   // 3 de 4 = 75 %
            Tally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct,
                Option(1, 1, "Bien", OptionValence.Positive, 1),
                Option(2, 2, "Mal", OptionValence.Negative, 2)),   // 2 de 3 = 66,7 %
            Tally("STUDENT_FELT_SUPPORTED", ItemLayer.StudentExperience,
                Option(1, 1, "Bien", OptionValence.Positive, 4),
                Option(2, 2, "Mal", OptionValence.Negative, 5)),   // 5 de 9 = 55,6 %: más marcas en crudo, menor proporción
        ];

        var facts = Publish(tallies);

        var fame = facts.Fame.Single();
        fame.ItemCodes.ShouldBe(["CHAIR_EXPLAINS_CLEARLY", "CHAIR_ANSWERS_QUESTIONS", "STUDENT_FELT_SUPPORTED"]);
    }

    /// <summary>
    /// El denominador de cada ítem son quienes lo respondieron (ADR-0082): uno sin respuestas no
    /// tiene proporción que calcular y no puede converger, por muchos otros ítems que sí converjan.
    /// </summary>
    [Fact]
    public void Calculate_ItemWithNoAnswers_NeverEntersFame()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_EXPLAINS_CLEARLY", ItemLayer.ChairConduct, positiveCount: 2, negativeCount: 8),  // 80 %
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 3, negativeCount: 7), // 70 %
            Tally("STUDENT_FELT_SUPPORTED", ItemLayer.StudentExperience,
                Option(1, 1, "Bien", OptionValence.Positive, 0),
                Option(2, 2, "Mal", OptionValence.Negative, 0)), // nadie respondió
        ];

        var facts = Publish(tallies);

        facts.Fame.ShouldBeEmpty(); // sin el tercero, solo hay 2: no alcanza el mínimo
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

    /// <summary>
    /// Una hermana que nunca respondió ese ítem no tiene proporción que comparar: no hay contraste
    /// que hacer con un dato que no existe.
    /// </summary>
    [Fact]
    public void Calculate_SiblingWithNoAnswers_NeverProducesAContrast()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ARRIVES_LATE", ItemLayer.ChairConduct, positiveCount: 16, negativeCount: 20),
        ];
        List<ItemTally> siblingTallies =
        [
            Tally("CHAIR_ARRIVES_LATE", ItemLayer.ChairConduct,
                Option(1, 1, "Bien", OptionValence.Positive, 0),
                Option(2, 2, "Mal", OptionValence.Negative, 0)),
        ];

        var facts = Publish(tallies, siblingTallies);

        facts.Contrasts.ShouldBeEmpty();
    }

    /// <summary>
    /// El más separado va primero, y "separado" es la DIFERENCIA de porcentajes, no la suma: acá
    /// CHAIR_A acumula menos entre los dos lados (60) pero tiene una diferencia mucho más grande
    /// (50 puntos) que CHAIR_B (178 acumulados, apenas 18 de diferencia).
    /// </summary>
    [Fact]
    public void Calculate_ContrastOrdering_RanksByPercentDifference_NotByPercentSum()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_A", ItemLayer.ChairConduct, positiveCount: 19, negativeCount: 1),  // 5 %
            BinaryTally("CHAIR_B", ItemLayer.ChairConduct, positiveCount: 20, negativeCount: 80), // 80 %
        ];
        List<ItemTally> siblingTallies =
        [
            BinaryTally("CHAIR_A", ItemLayer.ChairConduct, positiveCount: 9, negativeCount: 11), // 55 %: 50 puntos de diferencia
            BinaryTally("CHAIR_B", ItemLayer.ChairConduct, positiveCount: 2, negativeCount: 98),  // 98 %: 18 puntos de diferencia
        ];

        var facts = Publish(tallies, siblingTallies);

        facts.Contrasts.Select(c => c.ItemCode).ShouldBe(["CHAIR_A", "CHAIR_B"]);
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

    // -------------------------------------------------------------------
    // El corte de serie (US-198, E3)
    // -------------------------------------------------------------------

    /// <summary>
    /// US-198 E3: lo de antes queda bajo el código viejo, lo de después bajo el nuevo, y los dos se
    /// publican. Que se vean separados es la mitad del corte; la otra mitad es que no se sumen.
    /// </summary>
    [Fact]
    public void Calculate_ItemThatSupersededAnother_PublishesBothStretchesSeparately()
    {
        List<ItemTally> tallies =
        [
            SuccessorTally(
                "CHAIR_CLASSES_HELD_B", "CHAIR_CLASSES_HELD", ItemLayer.ChairConduct,
                positiveCount: 9, negativeCount: 7),
            RetiredTally(
                "CHAIR_CLASSES_HELD", ItemLayer.ChairConduct,
                positiveCount: 56, negativeCount: 56),
        ];

        var facts = Publish(tallies);

        // Una sola fila en el bloque: el tramo viejo cuelga del nuevo, no compite con él.
        var item = facts.ChairConduct.ShouldHaveSingleItem();
        item.ItemCode.ShouldBe("CHAIR_CLASSES_HELD_B");
        item.Total.ShouldBe(16);

        var previous = item.PreviousSeries.ShouldNotBeNull();
        previous.ItemCode.ShouldBe("CHAIR_CLASSES_HELD");
        previous.Total.ShouldBe(112);
        previous.RetiredAt.ShouldBe(CutDate);

        // Y el punto de todo: los totales no se juntan en ningún lado.
        (item.Total + previous.Total).ShouldBe(128);
        item.Total.ShouldNotBe(128);
    }

    /// <summary>
    /// Un tramo viejo no vota en la fama. Si votara, tres preguntas retiradas podrían sostener una
    /// afirmación sobre la cátedra de hoy que nadie le hizo a la cátedra de hoy.
    /// </summary>
    [Fact]
    public void Calculate_RetiredStretches_DoNotFeedTheFame()
    {
        List<ItemTally> tallies =
        [
            SuccessorTally("A_B", "A", ItemLayer.ChairConduct, positiveCount: 30, negativeCount: 2),
            RetiredTally("A", ItemLayer.ChairConduct, positiveCount: 1, negativeCount: 99),
            RetiredTally("B", ItemLayer.ChairConduct, positiveCount: 1, negativeCount: 99),
            RetiredTally("C", ItemLayer.ChairConduct, positiveCount: 1, negativeCount: 99),
        ];

        var facts = Publish(tallies);

        // Tres retirados con 99 % negativo, y aun así no hay fama: el único ítem vigente está bien.
        facts.Fame.ShouldBeEmpty();
    }

    /// <summary>
    /// Un tramo viejo tampoco se compara contra las hermanas: la pregunta que ellas responden hoy
    /// no es esa, y contrastarlas sería exactamente la comparación que el corte prohíbe.
    /// </summary>
    [Fact]
    public void Calculate_RetiredStretches_AreNeverContrastedAgainstSiblings()
    {
        List<ItemTally> tallies =
        [
            RetiredTally("CHAIR_CLASSES_HELD", ItemLayer.ChairConduct, positiveCount: 10, negativeCount: 90),
        ];
        List<ItemTally> siblingTallies =
        [
            BinaryTally("CHAIR_CLASSES_HELD", ItemLayer.ChairConduct, positiveCount: 90, negativeCount: 10),
        ];

        var facts = Publish(tallies, siblingTallies);

        facts.Contrasts.ShouldBeEmpty();
    }

    /// <summary>
    /// Un retirado sin sucesor no aparece en ningún lado. Sus respuestas existen y no se borran,
    /// pero no hay pregunta viva de la que colgarlas, y publicarlo suelto lo haría leer como algo
    /// que todavía se pregunta.
    /// </summary>
    [Fact]
    public void Calculate_RetiredItemWithNoSuccessor_IsNotPublishedOnItsOwn()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 8, negativeCount: 4),
            RetiredTally("CHAIR_OLD_QUESTION", ItemLayer.ChairConduct, positiveCount: 50, negativeCount: 50),
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.Select(i => i.ItemCode).ShouldBe(["CHAIR_ANSWERS_QUESTIONS"]);
        facts.ChairConduct[0].PreviousSeries.ShouldBeNull();
    }

    /// <summary>
    /// El estado inmediatamente después del corte, que es el más común y el más peligroso: la
    /// pregunta nueva todavía no la contestó nadie. El ítem se publica igual, con su tramo anterior
    /// intacto. Descartarlo por tener cero respuestas propias escondería las 112 de antes justo el
    /// día que cambió la pregunta, que es lo único que el corte tenía que hacer visible.
    /// </summary>
    [Fact]
    public void Calculate_SuccessorWithNoAnswersYet_StillPublishesThePreviousStretch()
    {
        List<ItemTally> tallies =
        [
            SuccessorTally(
                "CHAIR_CLASSES_HELD_B", "CHAIR_CLASSES_HELD", ItemLayer.ChairConduct,
                positiveCount: 0, negativeCount: 0),
            RetiredTally(
                "CHAIR_CLASSES_HELD", ItemLayer.ChairConduct,
                positiveCount: 56, negativeCount: 56),
        ];

        var facts = Publish(tallies);

        var item = facts.ChairConduct.ShouldHaveSingleItem();
        item.ItemCode.ShouldBe("CHAIR_CLASSES_HELD_B");
        item.Total.ShouldBe(0);
        item.ModeLabel.ShouldBeEmpty(); // no hay moda que inventar sobre cero respuestas
        item.ModeIsNegative.ShouldBeFalse(); // tampoco hay un lado que teñir de rojo
        item.Distribution.ShouldBeEmpty();
        item.PreviousSeries.ShouldNotBeNull().Total.ShouldBe(112);
    }

    /// <summary>
    /// Y un ítem sin respuestas y sin tramo anterior sigue sin publicarse: no hay nada que decir de
    /// una pregunta que nadie contestó nunca, y una barra vacía no es información.
    /// </summary>
    [Fact]
    public void Calculate_ItemWithNoAnswersAndNoHistory_IsStillNotPublished()
    {
        List<ItemTally> tallies =
        [
            BinaryTally("CHAIR_ANSWERS_QUESTIONS", ItemLayer.ChairConduct, positiveCount: 8, negativeCount: 4),
            BinaryTally("CHAIR_NEVER_ANSWERED", ItemLayer.ChairConduct, positiveCount: 0, negativeCount: 0),
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.Select(i => i.ItemCode).ShouldBe(["CHAIR_ANSWERS_QUESTIONS"]);
    }

    /// <summary>
    /// US-198, edge: un ítem recién abierto sobre una cátedra que nunca respondió al anterior no
    /// tiene tramo viejo que mostrar. El corte existe en el catálogo; en esta ficha no hay nada que
    /// cortar, y una sección vacía diciendo "acá cambió la pregunta" sería ruido.
    /// </summary>
    [Fact]
    public void Calculate_SuccessorWhoseChairNeverAnsweredThePreviousItem_HasNoPreviousStretch()
    {
        List<ItemTally> tallies =
        [
            SuccessorTally(
                "CHAIR_CLASSES_HELD_B", "CHAIR_CLASSES_HELD", ItemLayer.ChairConduct,
                positiveCount: 9, negativeCount: 7),
            RetiredTally("CHAIR_CLASSES_HELD", ItemLayer.ChairConduct, positiveCount: 0, negativeCount: 0),
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.ShouldHaveSingleItem().PreviousSeries.ShouldBeNull();
    }

    /// <summary>
    /// El tramo de antes solo puede venir de un ítem efectivamente retirado. Acá "A" sigue activo
    /// (no está retirado) aunque comparta código con lo que "B" dice reemplazar: no es un tramo
    /// anterior legítimo y no se cuelga de "B".
    /// </summary>
    [Fact]
    public void Calculate_PreviousSeriesOnlyComesFromARetiredTally_NeverFromAnActiveOne()
    {
        List<ItemTally> tallies =
        [
            SuccessorTally("B", "A", ItemLayer.ChairConduct, positiveCount: 9, negativeCount: 7),
            BinaryTally("A", ItemLayer.ChairConduct, positiveCount: 5, negativeCount: 5), // activo, no retirado
        ];

        var facts = Publish(tallies);

        facts.ChairConduct.Single(i => i.ItemCode == "B").PreviousSeries.ShouldBeNull();
    }
}
