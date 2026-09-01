using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Reviews;

/// <summary>
/// Domain unit tests de <see cref="Review"/> (US-146, ADR-0082): creación, revisión, borrado
/// del texto libre y reconstitución. El foco central es el invariante del agregado: las respuestas
/// se validan enteras contra el catálogo que arma el application layer (ítem ofrecido, opción
/// perteneciente a ese ítem), y saltear un ítem no deja fila (el denominador de cada ítem son las
/// reseñas que lo respondieron, no las que existen).
/// </summary>
public class ReviewTests
{
    private static readonly DateTimeOffset T0 = new(2026, 8, 20, 12, 0, 0, TimeSpan.Zero);

    private static readonly InstrumentId SomeInstrument = InstrumentId.New();

    // Cinco ítems de un instrumento de prueba: FiveItemInstrument() los admite todos, con las
    // opciones 1, 2 y 3 como válidas para cada uno.
    private static readonly ItemId Item1 = ItemId.New();
    private static readonly ItemId Item2 = ItemId.New();
    private static readonly ItemId Item3 = ItemId.New();
    private static readonly ItemId Item4 = ItemId.New();
    private static readonly ItemId Item5 = ItemId.New();

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    private static IReadOnlyDictionary<ItemId, IReadOnlySet<short>> FiveItemInstrument() =>
        new Dictionary<ItemId, IReadOnlySet<short>>
        {
            [Item1] = new HashSet<short> { 1, 2, 3 },
            [Item2] = new HashSet<short> { 1, 2, 3 },
            [Item3] = new HashSet<short> { 1, 2, 3 },
            [Item4] = new HashSet<short> { 1, 2, 3 },
            [Item5] = new HashSet<short> { 1, 2, 3 },
        };

    private static Result<Review> Create(
        Guid? accountId = null,
        Guid? subjectId = null,
        Guid? termId = null,
        Guid? chairId = null,
        InstrumentId? instrumentId = null,
        IEnumerable<(ItemId ItemId, short OptionValue)>? answers = null,
        string? freeText = null,
        IReadOnlyDictionary<ItemId, IReadOnlySet<short>>? allowedOptionsByItem = null,
        DateTimeOffset? at = null) =>
        Review.Create(
            accountId ?? Guid.NewGuid(),
            subjectId ?? Guid.NewGuid(),
            termId ?? Guid.NewGuid(),
            chairId,
            instrumentId ?? SomeInstrument,
            answers ?? [(Item1, 1)],
            freeText,
            allowedOptionsByItem ?? FiveItemInstrument(),
            new FixedClock(at ?? T0));

    private static Review CreatedReview(
        Guid? accountId = null,
        IEnumerable<(ItemId ItemId, short OptionValue)>? answers = null,
        string? freeText = null,
        DateTimeOffset? at = null) =>
        Create(accountId: accountId, answers: answers, freeText: freeText, at: at).Value;

    [Fact]
    public void Create_ValidAnswers_StoresIdentityFieldsAndAnswers()
    {
        var accountId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();
        var termId = Guid.NewGuid();
        var chairId = Guid.NewGuid();

        var result = Create(
            accountId: accountId,
            subjectId: subjectId,
            termId: termId,
            chairId: chairId,
            answers: [(Item1, 2)]);

        result.IsSuccess.ShouldBeTrue();
        var review = result.Value;
        review.AccountId.ShouldBe(accountId);
        review.SubjectId.ShouldBe(subjectId);
        review.TermId.ShouldBe(termId);
        review.ChairId.ShouldBe(chairId);
        review.InstrumentId.ShouldBe(SomeInstrument);
        review.Answers.Count.ShouldBe(1);
        review.Answers[0].ItemId.ShouldBe(Item1);
        review.Answers[0].OptionValue.ShouldBe((short)2);
    }

    [Fact]
    public void Create_ValidAnswers_CreatedAtEqualsUpdatedAt()
    {
        var result = Create();

        result.IsSuccess.ShouldBeTrue();
        result.Value.CreatedAt.ShouldBe(result.Value.UpdatedAt);
    }

    [Fact]
    public void Create_ChairIdNull_IsStoredAsNull()
    {
        var result = Create(chairId: null);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ChairId.ShouldBeNull();
    }

    [Fact]
    public void Create_SkippedItems_LeaveNoRowInAnswers()
    {
        // El instrumento ofrece 5 ítems (Item1..Item5); se responden solo 3, Item3 e Item5 se saltean.
        var result = Create(answers: [(Item1, 1), (Item2, 2), (Item4, 3)]);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Answers.Count.ShouldBe(3);
        result.Value.Answers.ShouldContain(a => a.ItemId == Item1 && a.OptionValue == 1);
        result.Value.Answers.ShouldContain(a => a.ItemId == Item2 && a.OptionValue == 2);
        result.Value.Answers.ShouldContain(a => a.ItemId == Item4 && a.OptionValue == 3);
        result.Value.Answers.ShouldNotContain(a => a.ItemId == Item3);
        result.Value.Answers.ShouldNotContain(a => a.ItemId == Item5);
    }

    [Fact]
    public void Create_NoAnswers_ReturnsNoAnswersError()
    {
        var result = Create(answers: []);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.NoAnswers);
    }

    [Fact]
    public void Create_DuplicateAnswer_ReturnsDuplicateAnswerError()
    {
        var result = Create(answers: [(Item1, 1), (Item1, 2)]);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.DuplicateAnswer);
    }

    [Fact]
    public void Create_ItemNotInInstrument_ReturnsItemNotInInstrumentError()
    {
        var unknownItem = ItemId.New();

        var result = Create(answers: [(unknownItem, 1)]);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.ItemNotInInstrument);
    }

    [Fact]
    public void Create_OptionNotInItem_ReturnsOptionNotInItemError()
    {
        // Item1 solo admite 1, 2 y 3: 9 no es una opción válida para ese ítem.
        var result = Create(answers: [(Item1, 9)]);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.OptionNotInItem);
    }

    [Fact]
    public void Create_FreeTextTooLong_ReturnsFreeTextTooLongError()
    {
        var tooLong = new string('a', Review.MaxFreeTextLength + 1);

        var result = Create(freeText: tooLong);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.FreeTextTooLong);
    }

    [Fact]
    public void Create_FreeTextWithSurroundingSpaces_IsTrimmed()
    {
        var result = Create(freeText: "  Buena cursada, la volvería a hacer.  ");

        result.IsSuccess.ShouldBeTrue();
        result.Value.FreeText.ShouldBe("Buena cursada, la volvería a hacer.");
    }

    [Fact]
    public void Create_BlankFreeText_IsStoredAsNull()
    {
        var result = Create(freeText: "   ");

        result.IsSuccess.ShouldBeTrue();
        result.Value.FreeText.ShouldBeNull();
    }

    [Fact]
    public void Revise_ReplacesAnswersAndFreeText_MovesUpdatedAtKeepsCreatedAt()
    {
        var review = CreatedReview(answers: [(Item1, 1)], freeText: "Texto original.", at: T0);
        var revisedAt = T0.AddDays(1);

        var result = review.Revise(
            [(Item2, 3)],
            "Texto revisado.",
            FiveItemInstrument(),
            new FixedClock(revisedAt));

        result.IsSuccess.ShouldBeTrue();
        review.Answers.Count.ShouldBe(1);
        review.Answers[0].ItemId.ShouldBe(Item2);
        review.Answers[0].OptionValue.ShouldBe((short)3);
        review.FreeText.ShouldBe("Texto revisado.");
        review.UpdatedAt.ShouldBe(revisedAt);
        review.CreatedAt.ShouldBe(T0);
    }

    [Fact]
    public void Revise_AddsAnAnswerThatWasPreviouslySkipped()
    {
        // Arranca respondiendo solo Item1: Item2 estaba salteado.
        var review = CreatedReview(answers: [(Item1, 1)], at: T0);

        var result = review.Revise(
            [(Item1, 1), (Item2, 2)],
            null,
            FiveItemInstrument(),
            new FixedClock(T0.AddHours(1)));

        result.IsSuccess.ShouldBeTrue();
        review.Answers.Count.ShouldBe(2);
        review.Answers.ShouldContain(a => a.ItemId == Item2 && a.OptionValue == 2);
    }

    [Fact]
    public void Revise_RemovingAnAnswer_LeavesNoRowForThatItem()
    {
        var review = CreatedReview(answers: [(Item1, 1), (Item2, 2)], at: T0);

        var result = review.Revise(
            [(Item1, 1)],
            null,
            FiveItemInstrument(),
            new FixedClock(T0.AddHours(1)));

        result.IsSuccess.ShouldBeTrue();
        review.Answers.Count.ShouldBe(1);
        review.Answers.ShouldNotContain(a => a.ItemId == Item2);
    }

    /// <summary>
    /// El punto de la atomicidad: <c>Revise</c> valida el set nuevo entero antes de tocar nada. Si
    /// el set nuevo es inválido, ni las respuestas viejas ni el texto ni UpdatedAt se mueven.
    /// </summary>
    [Fact]
    public void Revise_InvalidNewAnswers_KeepsOldAnswersIntact()
    {
        var review = CreatedReview(
            answers: [(Item1, 1), (Item2, 2)],
            freeText: "Texto original.",
            at: T0);

        // El set nuevo es inválido: Item3 respondido dos veces.
        var result = review.Revise(
            [(Item3, 1), (Item3, 2)],
            "Texto que no debería aplicarse.",
            FiveItemInstrument(),
            new FixedClock(T0.AddHours(1)));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ReviewErrors.DuplicateAnswer);
        review.Answers.Count.ShouldBe(2);
        review.Answers.ShouldContain(a => a.ItemId == Item1 && a.OptionValue == 1);
        review.Answers.ShouldContain(a => a.ItemId == Item2 && a.OptionValue == 2);
        review.FreeText.ShouldBe("Texto original.");
        review.UpdatedAt.ShouldBe(T0);
    }

    [Fact]
    public void ClearFreeText_SetsFreeTextToNull_KeepsAnswersIntact()
    {
        var review = CreatedReview(
            answers: [(Item1, 1), (Item2, 2)],
            freeText: "Texto a borrar.",
            at: T0);

        var result = review.ClearFreeText(new FixedClock(T0.AddHours(1)));

        result.IsSuccess.ShouldBeTrue();
        review.FreeText.ShouldBeNull();
        review.Answers.Count.ShouldBe(2);
        review.UpdatedAt.ShouldBe(T0.AddHours(1));
    }

    [Fact]
    public void IsAuthoredBy_MatchingAccountId_ReturnsTrue()
    {
        var accountId = Guid.NewGuid();
        var review = CreatedReview(accountId: accountId);

        review.IsAuthoredBy(accountId).ShouldBeTrue();
    }

    [Fact]
    public void IsAuthoredBy_DifferentAccountId_ReturnsFalse()
    {
        var review = CreatedReview(accountId: Guid.NewGuid());

        review.IsAuthoredBy(Guid.NewGuid()).ShouldBeFalse();
    }

    [Fact]
    public void Hydrate_ValidAnswers_ReconstitutesWithItsAnswers()
    {
        var id = ReviewId.New();
        var accountId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();
        var termId = Guid.NewGuid();
        var chairId = Guid.NewGuid();
        var updatedAt = T0.AddDays(2);

        var review = Review.Hydrate(
            id,
            accountId,
            subjectId,
            termId,
            chairId,
            SomeInstrument,
            [(Item1, 1), (Item2, 2)],
            "Texto hidratado.",
            createdAt: T0,
            updatedAt: updatedAt);

        review.Id.ShouldBe(id);
        review.AccountId.ShouldBe(accountId);
        review.SubjectId.ShouldBe(subjectId);
        review.TermId.ShouldBe(termId);
        review.ChairId.ShouldBe(chairId);
        review.InstrumentId.ShouldBe(SomeInstrument);
        review.FreeText.ShouldBe("Texto hidratado.");
        review.CreatedAt.ShouldBe(T0);
        review.UpdatedAt.ShouldBe(updatedAt);
        review.Answers.Count.ShouldBe(2);
        review.Answers.ShouldContain(a => a.ItemId == Item1 && a.OptionValue == 1);
        review.Answers.ShouldContain(a => a.ItemId == Item2 && a.OptionValue == 2);
    }

    [Fact]
    public void Hydrate_DuplicateItemAnswer_ThrowsArgumentException()
    {
        Should.Throw<ArgumentException>(() => Review.Hydrate(
            ReviewId.New(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            SomeInstrument,
            [(Item1, 1), (Item1, 2)],
            null,
            createdAt: T0,
            updatedAt: T0));
    }
}
