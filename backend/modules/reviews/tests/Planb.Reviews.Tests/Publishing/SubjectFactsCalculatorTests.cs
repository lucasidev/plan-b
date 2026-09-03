using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Publishing;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Publishing;

/// <summary>
/// Domain unit tests de <see cref="SubjectFactsCalculator"/> (US-129, ADR-0085): qué publica la
/// ficha de una materia, que nunca se reseña directo sino que se deriva de sus cátedras.
///
/// <para>
/// Lo que estos tests protegen es la pregunta que la ficha de materia contesta y la de cátedra no:
/// **¿es la materia, o es la cátedra que te tocó?**. Por eso el centro son las dos mitades de esa
/// respuesta (lo que varía entre cátedras y lo que no) y la regla que decide cuál es cuál.
/// </para>
/// </summary>
public class SubjectFactsCalculatorTests
{
    private const string Conduct = "CHAIR_ANSWERS_IN_CLASS";
    private const string Weight = "CHAIR_OFF_SYLLABUS_EXAMS";

    /// <summary>
    /// Una cátedra con una frase de conducta donde <paramref name="negative"/> de
    /// <paramref name="total"/> eligieron la opción mala.
    /// </summary>
    private static ChairContribution Chair(
        string name,
        int reviewCount,
        params (string Code, int Negative, int Total)[] items) =>
        new(
            Guid.NewGuid(),
            name,
            reviewCount,
            items.Select(i => Tally(i.Code, i.Negative, i.Total)).ToList(),
            null);

    private static ItemTally Tally(string code, int negative, int total) =>
        new(
            code,
            ItemLayer.ChairConduct,
            [
                new OptionTally(1, 1, "Siempre", OptionValence.Positive, total - negative),
                new OptionTally(3, 3, "Casi nunca", OptionValence.Negative, negative),
            ]);

    private static ItemTally Outcome(int reaching, int total) =>
        new(
            "COURSE_OUTCOME",
            ItemLayer.Context,
            [
                new OptionTally(1, 1, "La aprobé", OptionValence.None, reaching),
                new OptionTally(3, 3, "La recursé", OptionValence.None, total - reaching),
            ]);

    private static ItemTally Attempts(int once, int twice, int more) =>
        new(
            "COURSE_ATTEMPTS",
            ItemLayer.Context,
            [
                new OptionTally(1, 1, "Una", OptionValence.None, once),
                new OptionTally(2, 2, "Dos", OptionValence.None, twice),
                new OptionTally(3, 3, "Tres o más", OptionValence.None, more),
            ]);

    [Fact]
    public void A_subject_whose_chairs_are_all_below_the_floor_publishes_nothing()
    {
        var facts = SubjectFactsCalculator.Calculate(
        [
            Chair("Pérez", reviewCount: 9, (Conduct, 8, 9)),
            Chair("Ruiz", reviewCount: 3, (Conduct, 1, 3)),
        ]);

        facts.IsPublished.ShouldBeFalse();
        facts.TotalVoices.ShouldBe(0);
        facts.PublishingChairs.ShouldBe(0);
        facts.ChairsBelowFloor.ShouldBe(2);

        // Ni un conteo, ni una diferencia: una cátedra bajo el piso no aporta a nada.
        facts.Spread.ShouldBeEmpty();
        facts.Shared.ShouldBeEmpty();
        facts.Attempts.ShouldBeNull();
        facts.Completion.ShouldBeNull();

        // Pero las cátedras se listan igual, con lo que les falta: esconderlas seria mentir.
        facts.Chairs.Count.ShouldBe(2);
        facts.Chairs[0].ReviewCount.ShouldBe(9);
        facts.Chairs[0].ReviewsMissingToPublish.ShouldBe(1);
        facts.Chairs[0].IsPublished.ShouldBeFalse();
    }

    [Fact]
    public void Only_chairs_past_the_floor_feed_the_numbers()
    {
        var facts = SubjectFactsCalculator.Calculate(
        [
            Chair("Pérez", reviewCount: 40, (Conduct, 30, 40)),
            Chair("Paz", reviewCount: 3, (Conduct, 0, 3)),
        ]);

        facts.IsPublished.ShouldBeTrue();

        // Las 3 voces de Paz no entran en ningún total, aunque su cátedra se liste.
        facts.TotalVoices.ShouldBe(40);
        facts.PublishingChairs.ShouldBe(1);
        facts.ChairsBelowFloor.ShouldBe(1);
        facts.Chairs.Count.ShouldBe(2);
    }

    [Fact]
    public void Chairs_are_ordered_by_voices_never_by_their_numbers()
    {
        // Ruiz tiene menos voces pero mejores números: aún así va después. Ordenarlas por
        // resultado sería un ranking, y acá no hay ranking.
        var facts = SubjectFactsCalculator.Calculate(
        [
            Chair("Ruiz", reviewCount: 20, (Conduct, 1, 20)),
            Chair("Pérez", reviewCount: 40, (Conduct, 35, 40)),
        ]);

        facts.Chairs[0].ChairName.ShouldBe("Pérez");
        facts.Chairs[1].ChairName.ShouldBe("Ruiz");
    }

    [Fact]
    public void An_item_where_the_chairs_separate_is_the_chair_not_the_subject()
    {
        var facts = SubjectFactsCalculator.Calculate(
        [
            Chair("Pérez", reviewCount: 40, (Conduct, 34, 40)),
            Chair("Ruiz", reviewCount: 40, (Conduct, 4, 40)),
        ]);

        facts.Spread.Count.ShouldBe(1);
        var spread = facts.Spread[0];
        spread.ItemCode.ShouldBe(Conduct);
        spread.NegativeLabel.ShouldBe("Casi nunca");

        // De mayor a menor, con su denominador: el lector compara sin que nadie le diga quién es
        // "la mejor".
        spread.ByChair[0].ChairName.ShouldBe("Pérez");
        spread.ByChair[0].Percent.ShouldBe(85);
        spread.ByChair[1].ChairName.ShouldBe("Ruiz");
        spread.ByChair[1].Percent.ShouldBe(10);

        // Y no es un rasgo de la materia, porque no todas lo marcan.
        facts.Shared.ShouldBeEmpty();
    }

    [Fact]
    public void An_item_that_every_chair_marks_alike_is_the_subject_not_the_chair()
    {
        var facts = SubjectFactsCalculator.Calculate(
        [
            Chair("Pérez", reviewCount: 40, (Weight, 30, 40)),
            Chair("Ruiz", reviewCount: 40, (Weight, 29, 40)),
        ]);

        facts.Shared.Count.ShouldBe(1);
        facts.Shared[0].ItemCode.ShouldBe(Weight);
        facts.Shared[0].ChairCount.ShouldBe(2);
        facts.Shared[0].LowestPercent.ShouldBe(73);
        facts.Shared[0].HighestPercent.ShouldBe(75);

        // Si nadie se salva, la frase no distingue a una cátedra de otra.
        facts.Spread.ShouldBeEmpty();
    }

    [Fact]
    public void A_difference_that_the_sample_size_could_explain_is_not_published()
    {
        // 60 % contra 45 % con 20 respuestas cada una: los intervalos se tocan, así que la
        // diferencia no aguanta y no se publica como tal.
        var facts = SubjectFactsCalculator.Calculate(
        [
            Chair("Pérez", reviewCount: 20, (Conduct, 12, 20)),
            Chair("Ruiz", reviewCount: 20, (Conduct, 9, 20)),
        ]);

        facts.Spread.ShouldBeEmpty();
    }

    [Fact]
    public void A_single_chair_has_nothing_to_contrast_against()
    {
        var facts = SubjectFactsCalculator.Calculate(
        [
            Chair("Pérez", reviewCount: 40, (Conduct, 34, 40)),
        ]);

        facts.IsPublished.ShouldBeTrue();
        facts.Spread.ShouldBeEmpty();
        facts.Shared.ShouldBeEmpty();
    }

    [Fact]
    public void An_item_that_only_one_chair_answered_is_not_comparable()
    {
        var perez = new ChairContribution(
            Guid.NewGuid(), "Pérez", 40, [Tally(Conduct, 34, 40), Tally(Weight, 30, 40)], null);
        var ruiz = new ChairContribution(
            Guid.NewGuid(), "Ruiz", 40, [Tally(Conduct, 4, 40)], null);

        var facts = SubjectFactsCalculator.Calculate([perez, ruiz]);

        // Solo la frase que las dos respondieron entra en la comparación.
        facts.Spread.Count.ShouldBe(1);
        facts.Spread[0].ItemCode.ShouldBe(Conduct);
        facts.Shared.ShouldBeEmpty();
    }

    [Fact]
    public void Completion_adds_up_across_the_chairs_that_publish()
    {
        var perez = new ChairContribution(
            Guid.NewGuid(), "Pérez", 40, [Outcome(reaching: 20, total: 40)], null);
        var ruiz = new ChairContribution(
            Guid.NewGuid(), "Ruiz", 40, [Outcome(reaching: 36, total: 40)], null);

        var facts = SubjectFactsCalculator.Calculate([perez, ruiz]);

        facts.Completion.ShouldNotBeNull();
        facts.Completion!.Reaching.ShouldBe(56);
        facts.Completion.Total.ShouldBe(80);
        facts.Completion.OutOfTen.ShouldBe(7);
    }

    [Fact]
    public void Attempts_travel_as_a_distribution_never_as_an_average()
    {
        var perez = new ChairContribution(
            Guid.NewGuid(), "Pérez", 40, [Attempts(once: 24, twice: 10, more: 6)], null);

        var facts = SubjectFactsCalculator.Calculate([perez]);

        facts.Attempts.ShouldNotBeNull();
        facts.Attempts!.Total.ShouldBe(40);
        facts.Attempts.ModeLabel.ShouldBe("Una");
        facts.Attempts.ModePercent.ShouldBe(60);

        // La distribución entera, en el orden en que se ofreció: es lo que reemplaza al promedio.
        facts.Attempts.Options.Count.ShouldBe(3);
        facts.Attempts.Options[0].Label.ShouldBe("Una");
        facts.Attempts.Options[2].Label.ShouldBe("Tres o más");
        facts.Attempts.Options[2].Percent.ShouldBe(15);
    }

    [Fact]
    public void The_open_ended_option_travels_apart_so_the_ficha_can_say_it_alone()
    {
        var perez = new ChairContribution(
            Guid.NewGuid(), "Pérez", 40, [Attempts(once: 24, twice: 10, more: 6)], null);

        var facts = SubjectFactsCalculator.Calculate([perez]);

        // "Tres o más" es la opción abierta: quien la cursó cinco veces y quien la cursó tres
        // marcan lo mismo. Viaja separada del resto para que la ficha la diga sola, porque es
        // justo la gente a la que le costó y la que un promedio taparía.
        facts.Attempts!.OpenEnded.ShouldNotBeNull();
        facts.Attempts.OpenEnded!.Label.ShouldBe("Tres o más");
        facts.Attempts.OpenEnded.Percent.ShouldBe(15);

        // Y sigue estando en la distribución: se dice dos veces a propósito, una en la afirmación
        // y otra en el detalle auditable.
        facts.Attempts.Options.ShouldContain(o => o.Label == "Tres o más" && o.Percent == 15);
    }

    [Fact]
    public void An_item_without_an_open_ended_option_carries_no_tail()
    {
        // La conducta de la cátedra no tiene categoría abierta: ninguna opción dice "o más".
        var facts = SubjectFactsCalculator.Calculate(
        [
            Chair("Pérez", reviewCount: 40, (Conduct, 30, 40)),
        ]);

        // Y la frase de intentos ni siquiera se contestó acá, así que no hay distribución alguna.
        facts.Attempts.ShouldBeNull();
    }

    [Fact]
    public void Context_items_never_show_up_as_a_difference_between_chairs()
    {
        var perez = new ChairContribution(
            Guid.NewGuid(), "Pérez", 40, [Outcome(reaching: 8, total: 40)], null);
        var ruiz = new ChairContribution(
            Guid.NewGuid(), "Ruiz", 40, [Outcome(reaching: 38, total: 40)], null);

        var facts = SubjectFactsCalculator.Calculate([perez, ruiz]);

        // Cómo terminó la cursada alimenta la tasa agregada y nada más: publicarlo frase por frase
        // y cátedra por cátedra sería exponer el desenlace de la gente (US-148).
        facts.Spread.ShouldBeEmpty();
        facts.Shared.ShouldBeEmpty();
        facts.Completion.ShouldNotBeNull();
    }
}
