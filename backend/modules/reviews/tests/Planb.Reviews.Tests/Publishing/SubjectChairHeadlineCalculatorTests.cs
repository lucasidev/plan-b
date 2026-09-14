using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Publishing;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Publishing;

/// <summary>
/// Domain unit tests de <see cref="SubjectChairHeadlineCalculator"/> (US-129): qué frase de
/// conducta observable resume mejor a una cátedra publicada, en la lista de cátedras de su materia.
/// </summary>
public class SubjectChairHeadlineCalculatorTests
{
    private static ItemTally Conduct(string code, int negative, int total, bool isRetired = false) =>
        new(
            code,
            ItemLayer.ChairConduct,
            [
                new OptionTally(1, 1, "Siempre", OptionValence.Positive, total - negative),
                new OptionTally(3, 3, "Casi nunca", OptionValence.Negative, negative),
            ],
            IsRetired: isRetired);

    [Fact]
    public void The_item_with_the_strongest_mode_wins()
    {
        // CHAIR_CLASSES_HELD tiene una moda del 90 %; CHAIR_ANSWERS_IN_CLASS, del 60 %. Gana la
        // más marcada, no la primera en el catálogo.
        var headline = SubjectChairHeadlineCalculator.Calculate(
        [
            Conduct("CHAIR_ANSWERS_IN_CLASS", negative: 24, total: 40),
            Conduct("CHAIR_CLASSES_HELD", negative: 36, total: 40),
        ]);

        headline.ShouldNotBeNull();
        headline!.ItemCode.ShouldBe("CHAIR_CLASSES_HELD");
        headline.Percent.ShouldBe(90);
        headline.Respondents.ShouldBe(40);
        headline.OptionValue.ShouldBe((short)3);
    }

    [Fact]
    public void A_tie_in_percent_breaks_by_catalog_order()
    {
        // Las dos modas pesan 75 %: CHAIR_CLASSES_HELD va antes que CHAIR_EXAM_DATE_NOTICE en el
        // catálogo (CatalogSeedData.Items), así que gana ella.
        var headline = SubjectChairHeadlineCalculator.Calculate(
        [
            Conduct("CHAIR_EXAM_DATE_NOTICE", negative: 30, total: 40),
            Conduct("CHAIR_CLASSES_HELD", negative: 30, total: 40),
        ]);

        headline.ShouldNotBeNull();
        headline!.ItemCode.ShouldBe("CHAIR_CLASSES_HELD");
    }

    [Fact]
    public void A_chair_without_a_single_conduct_answer_has_no_headline()
    {
        var headline = SubjectChairHeadlineCalculator.Calculate(
        [
            new ItemTally(
                "STUDENT_UNDERSTOOD_IN_CLASS",
                ItemLayer.StudentExperience,
                [
                    new OptionTally(1, 1, "Casi siempre", OptionValence.Positive, 30),
                    new OptionTally(3, 3, "Casi nunca", OptionValence.Negative, 10),
                ]),
        ]);

        headline.ShouldBeNull();
    }

    [Fact]
    public void An_empty_tally_list_has_no_headline()
    {
        SubjectChairHeadlineCalculator.Calculate([]).ShouldBeNull();
    }

    /// <summary>
    /// Una sola persona respondiendo una frase (100 %) no puede ganar el headline: publicaría la
    /// respuesta de una persona identificable. El piso de respuestas de una frase para poder ganar
    /// es el mismo que el piso de reseñas de la cátedra para publicar (ADR-0082).
    /// </summary>
    [Fact]
    public void An_item_below_the_floor_of_responses_cannot_win_even_at_100_percent()
    {
        var headline = SubjectChairHeadlineCalculator.Calculate(
        [
            Conduct("CHAIR_SYLLABUS_UPFRONT", negative: 1, total: 1),
            Conduct("CHAIR_CLASSES_HELD", negative: 5, total: 20),
        ]);

        headline.ShouldNotBeNull();
        headline!.ItemCode.ShouldBe("CHAIR_CLASSES_HELD");
    }

    [Fact]
    public void With_no_item_reaching_the_floor_of_responses_there_is_no_headline()
    {
        var headline = SubjectChairHeadlineCalculator.Calculate(
        [
            Conduct("CHAIR_SYLLABUS_UPFRONT", negative: 3, total: 9),
        ]);

        headline.ShouldBeNull();
    }

    /// <summary>
    /// Un ítem retirado (el catálogo cambió de código, US-198) no puede ganar aunque tenga la moda
    /// más marcada: es el tramo de antes, y elegirlo publicaría en la lista de cátedras una
    /// pregunta que ya no se hace.
    /// </summary>
    [Fact]
    public void A_retired_item_does_not_win_even_with_the_strongest_mode()
    {
        var headline = SubjectChairHeadlineCalculator.Calculate(
        [
            Conduct("CHAIR_SYLLABUS_UPFRONT", negative: 19, total: 20, isRetired: true),
            Conduct("CHAIR_CLASSES_HELD", negative: 5, total: 20),
        ]);

        headline.ShouldNotBeNull();
        headline!.ItemCode.ShouldBe("CHAIR_CLASSES_HELD");
    }
}
